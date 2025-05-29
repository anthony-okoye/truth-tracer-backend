import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ISonarService } from '../../domain/interfaces/sonar.interface';
import { factCheckTemplate } from './templates/fact-check.template';
import { trustChainTemplate } from './templates/trust-chain.template';
import { socraticTemplate } from './templates/socratic.template';
import { SonarResponseDto } from './dto/sonar-response.dto';
import { FactCheckResponse } from '../../domain/dtos/fact-check.dto';
import { TrustChainResponse } from '../../domain/dtos/trust-chain.dto';
import { SocraticReasoningResponse } from '../../domain/dtos/socratic-reasoning.dto';
import { 
  SonarApiException, 
  SonarTimeoutException, 
  SonarConfigurationException 
} from '../../common/exceptions/sonar.exceptions';
import { ISonarConfig } from '../../domain/interfaces/config.interface';
import { SonarResponseSanitizer } from './response-sanitizer';
import { TokenMonitorService, TokenUsageMetrics } from '../../domain/services/token-monitor.service';

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable()
export class SonarClient implements ISonarService {
  private readonly logger = new Logger(SonarClient.name);
  private readonly config: ISonarConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly responseSanitizer: SonarResponseSanitizer,
    private readonly tokenMonitor: TokenMonitorService
  ) {
    this.config = this.validateConfig();
  }

  private validateConfig(): ISonarConfig {
    const apiKey = this.configService.get<string>('SONAR_API_KEY');
    const baseUrl = this.configService.get<string>('SONAR_API_URL');
    const timeout = this.configService.get<number>('SONAR_TIMEOUT', 30000);
    const maxRetries = this.configService.get<number>('SONAR_MAX_RETRIES', 3);
    const retryDelay = this.configService.get<number>('SONAR_RETRY_DELAY', 1000);

    if (!apiKey || !baseUrl) {
      throw new SonarConfigurationException(
        'Sonar API configuration missing',
        !apiKey ? 'SONAR_API_KEY' : 'SONAR_API_URL'
      );
    }

    return { apiKey, baseUrl, timeout, maxRetries, retryDelay };
  }

  private async makeApiRequest<T>(
    endpoint: string, 
    data: any, 
    retryCount = 0
  ): Promise<T> {
    try {
      this.logger.debug(`Making API request to ${this.config.baseUrl}${endpoint}`);
      
      const response = await axios.post<PerplexityResponse>(
        `${this.config.baseUrl}${endpoint}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.config.timeout,
        }
      );

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new SonarApiException(
          'Invalid response format from Sonar API',
          500,
          'INVALID_RESPONSE_FORMAT',
          response.data
        );
      }

      // Record token usage if available
      if (response.data.usage) {
        const metrics: TokenUsageMetrics = {
          endpoint,
          usage: {
            promptTokens: response.data.usage.prompt_tokens,
            completionTokens: response.data.usage.completion_tokens,
            totalTokens: response.data.usage.total_tokens
          },
          maxTokens: data.max_tokens,
          timestamp: new Date()
        };
        this.tokenMonitor.recordTokenUsage(metrics);
      }

      const content = response.data.choices[0].message.content;
      
      // Use the response sanitizer
      const sanitizedResult = this.responseSanitizer.sanitizeResponse<T>(content);
      
      if (!sanitizedResult.success) {
        this.logger.error('Failed to sanitize API response', {
          steps: sanitizedResult.sanitizationSteps,
          error: sanitizedResult.error,
          originalResponse: sanitizedResult.originalResponse
        });
        
        throw new SonarApiException(
          'Failed to sanitize API response',
          500,
          'SANITIZATION_FAILED',
          {
            steps: sanitizedResult.sanitizationSteps,
            error: sanitizedResult.error
          }
        );
      }

      return sanitizedResult.data;

    } catch (error) {
      if (error && typeof error === 'object' && 'isAxiosError' in error) {
        if (error.code === 'ECONNABORTED') {
          throw new SonarTimeoutException(
            `Request timed out after ${this.config.timeout}ms`,
            this.config.timeout
          );
        }

        if (retryCount < this.config.maxRetries) {
          this.logger.warn(
            `API request failed, retrying (${retryCount + 1}/${this.config.maxRetries})...`,
            error.message
          );
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryDelay * (retryCount + 1))
          );
          return this.makeApiRequest(endpoint, data, retryCount + 1);
        }

        throw new SonarApiException(
          error.message,
          error.response?.status || 500,
          'API_REQUEST_FAILED',
          error.response?.data
        );
      }

      throw error;
    }
  }

  async analyzeClaim(claim: string): Promise<SonarResponseDto> {
    try {
      this.logger.debug(`Analyzing claim: ${claim}`);
      
      // First attempt: Try parallel execution
      const [factCheckResult, trustChainResult, socraticResult] = await Promise.allSettled([
        this.factCheck(claim),
        this.trustChain(claim),
        this.generateSocraticReasoning(claim)
      ]);

      // Check if any analysis failed
      const hasFailures = [factCheckResult, trustChainResult, socraticResult].some(
        result => result.status === 'rejected'
      );

      // If there are failures, retry failed analyses sequentially
      if (hasFailures) {
        this.logger.warn('Some analyses failed in parallel execution, retrying failed ones sequentially');
        
        // Retry failed analyses with a delay between each
        const retryWithDelay = async (promise: Promise<any>, delay: number) => {
          await new Promise(resolve => setTimeout(resolve, delay));
          return promise;
        };

        const factCheck = factCheckResult.status === 'rejected' 
          ? await retryWithDelay(this.factCheck(claim), 1000)
          : (factCheckResult as PromiseFulfilledResult<FactCheckResponse>).value;

        const trustChain = trustChainResult.status === 'rejected'
          ? await retryWithDelay(this.trustChain(claim), 1000)
          : (trustChainResult as PromiseFulfilledResult<TrustChainResponse>).value;

        const socratic = socraticResult.status === 'rejected'
          ? await retryWithDelay(this.generateSocraticReasoning(claim), 1000)
          : (socraticResult as PromiseFulfilledResult<SocraticReasoningResponse>).value;

        return {
          factCheck,
          trustChain,
          socratic,
          status: {
            factCheck: factCheck ? 'fulfilled' : 'rejected',
            trustChain: trustChain ? 'fulfilled' : 'rejected',
            socratic: socratic ? 'fulfilled' : 'rejected',
            timestamp: new Date().toISOString()
          }
        };
      }

      // If all succeeded in parallel, return the results
      return {
        factCheck: (factCheckResult as PromiseFulfilledResult<FactCheckResponse>).value,
        trustChain: (trustChainResult as PromiseFulfilledResult<TrustChainResponse>).value,
        socratic: (socraticResult as PromiseFulfilledResult<SocraticReasoningResponse>).value,
        status: {
          factCheck: 'fulfilled',
          trustChain: 'fulfilled',
          socratic: 'fulfilled',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error(`Error analyzing claim: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async factCheck(claim: string): Promise<FactCheckResponse> {
    return this.makeApiRequest<FactCheckResponse>('/chat/completions', {
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: factCheckTemplate.system
        },
        {
          role: 'user',
          content: claim
        }
      ],
      max_tokens: factCheckTemplate.max_tokens
    });
  }

  private async trustChain(claim: string): Promise<TrustChainResponse> {
    return this.makeApiRequest<TrustChainResponse>('/chat/completions', {
      model: 'sonar-deep-research',
      messages: [
        {
          role: 'system',
          content: trustChainTemplate.system
        },
        {
          role: 'user',
          content: claim
        }
      ],
      max_tokens: trustChainTemplate.max_tokens
    });
  }

  private async generateSocraticReasoning(claim: string): Promise<SocraticReasoningResponse> {
    return this.makeApiRequest<SocraticReasoningResponse>('/chat/completions', {
      model: 'sonar-reasoning',
      messages: [
        {
          role: 'system',
          content: socraticTemplate.system
        },
        {
          role: 'user',
          content: claim
        }
      ],
      max_tokens: socraticTemplate.max_tokens
    });
  }
} 