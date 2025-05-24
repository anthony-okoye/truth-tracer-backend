import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ISonarService } from '../../domain/interfaces/sonar.interface';
import { ClaimVerificationService } from '../../domain/services/claim-verification.service';
import { factCheckTemplate } from './templates/fact-check.template';
import { trustChainTemplate } from './templates/trust-chain.template';
import { socraticTemplate } from './templates/socratic.template';
import { SonarResponseDto, AnalysisStatus } from './dto/sonar-response.dto';
import { FactCheckResponse } from '../../domain/dtos/fact-check.dto';
import { TrustChainResponse } from '../../domain/dtos/trust-chain.dto';
import { SocraticReasoningResponse } from '../../domain/dtos/socratic-reasoning.dto';
import { 
  SonarApiException, 
  SonarTimeoutException, 
  SonarConfigurationException 
} from '../../common/exceptions/sonar.exceptions';
import { ISonarConfig } from '../../domain/interfaces/config.interface';

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

@Injectable()
export class SonarClient implements ISonarService {
  private readonly logger = new Logger(SonarClient.name);
  private readonly config: ISonarConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly claimVerificationService: ClaimVerificationService
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

      return JSON.parse(response.data.choices[0].message.content) as T;
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
      
      const [factCheckResult, trustChainResult, socraticResult] = await Promise.allSettled([
        this.factCheck(claim),
        this.trustChain(claim),
        this.generateSocraticReasoning(claim)
      ]);

      return {
        factCheck: factCheckResult.status === 'fulfilled' ? factCheckResult.value : null,
        trustChain: trustChainResult.status === 'fulfilled' ? trustChainResult.value : null,
        socratic: socraticResult.status === 'fulfilled' ? socraticResult.value : null,
        status: {
          factCheck: factCheckResult.status,
          trustChain: trustChainResult.status,
          socratic: socraticResult.status,
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
      model: 'sonar-pro',
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
      model: 'sonar-pro',
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