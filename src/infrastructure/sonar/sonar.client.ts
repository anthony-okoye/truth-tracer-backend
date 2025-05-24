import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { AxiosError } from 'axios';
import { ISonarService } from '../../domain/interfaces/sonar.interface';
import { Claim, ClaimRating, VerificationStatus } from '../../domain/entities/claim.entity';
import { TrustChain, SourceNode } from '../../domain/entities/trust-chain.entity';
import { SocraticReasoning } from '../../domain/entities/socratic-reasoning.entity';
import { ClaimVerificationService } from '../../domain/services/claim-verification.service';
import { TrustChainResult } from '../../domain/interfaces/ai-services.interface';
import { SocraticReasoningResult } from '../../domain/interfaces/ai-services.interface';
import { ModelSelectionStrategy } from './strategies/model-selection.strategy';
import { factCheckTemplate } from './templates/fact-check.template';
import { trustChainTemplate } from './templates/trust-chain.template';
import { socraticTemplate } from './templates/socratic.template';
import { AnalysisModel } from '../../domain/dtos/claim-analysis.dto';
import { SonarResponseDto } from './dto/sonar-response.dto';

interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    search_context_size: string;
  };
  citations: string[];
  object: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }>;
}

@Injectable()
export class SonarClient implements ISonarService {
  private readonly logger = new Logger(SonarClient.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second
  private readonly timeout: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly claimVerificationService: ClaimVerificationService
  ) {
    this.apiKey = this.configService.get<string>('SONAR_API_KEY');
    this.baseUrl = this.configService.get<string>('SONAR_API_URL');
    this.timeout = this.configService.get<number>('SONAR_TIMEOUT', 30000); // 30 seconds default
    
    if (!this.apiKey || !this.baseUrl) {
      this.logger.error('Sonar API configuration missing. Please check your environment variables.');
      throw new Error('Sonar API configuration missing');
    }
  }

  private async makeApiRequest(endpoint: string, data: any, retryCount = 0): Promise<any> {
    const requestId = crypto.randomUUID();
    try {
      this.logger.debug(`[${requestId}] Making API request to ${this.baseUrl}${endpoint}`);
      this.logger.debug(`[${requestId}] Request data: ${JSON.stringify(data, null, 2)}`);
      
      const response = await axios.post<PerplexityResponse>(
        `${this.baseUrl}${endpoint}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
          },
          timeout: this.timeout,
        }
      );

      this.logger.debug(`[${requestId}] API Response status: ${response.status}`);
      this.logger.debug(`[${requestId}] API Response headers: ${JSON.stringify(response.headers, null, 2)}`);
      this.logger.debug(`[${requestId}] API Response data: ${JSON.stringify(response.data, null, 2)}`);

      if (!this.validateResponse(response.data)) {
        throw new Error('Invalid response format from Sonar API');
      }

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`[${requestId}] API Error details:`, {
        message: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers,
        config: {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          headers: axiosError.config?.headers,
          data: axiosError.config?.data
        }
      });

      if (this.shouldRetry(axiosError) && retryCount < this.maxRetries) {
        const delay = this.calculateRetryDelay(retryCount);
        this.logger.warn(`[${requestId}] API request failed, retrying (${retryCount + 1}/${this.maxRetries}) after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeApiRequest(endpoint, data, retryCount + 1);
      }
      throw this.handleError(axiosError);
    }
  }

  private validateResponse(response: any): response is PerplexityResponse {
    return (
      response &&
      typeof response === 'object' &&
      Array.isArray(response.choices) &&
      response.choices.length > 0 &&
      response.choices[0].message?.content
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    // Retry on network errors or 5xx server errors
    return (
      !error.response ||
      (error.response.status >= 500 && error.response.status < 600)
    );
  }

  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.retryDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000;
    return baseDelay + jitter;
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      // Server responded with error
      return new Error(`API Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // Request made but no response
      return new Error('No response received from API');
    } else {
      // Request setup error
      return new Error(`Request Error: ${error.message}`);
    }
  }

  async analyzeClaim(claim: string): Promise<SonarResponseDto> {
    try {
      this.logger.debug(`Analyzing claim: ${claim}`);
      
      const [factCheckResult, trustChainResult, socraticResult] = await Promise.allSettled([
        this.factCheck(claim),
        this.trustChain(new Claim(
          crypto.randomUUID(),
          claim,
          {
            source: 'user_input',
            timestamp: new Date(),
            userId: 'system',
            originalText: claim
          },
          'UNVERIFIABLE' as ClaimRating,
          '',
          [],
          [],
          undefined,
          VerificationStatus.PENDING
        )),
        this.generateSocraticReasoning(new Claim(
          crypto.randomUUID(),
          claim,
          {
            source: 'user_input',
            timestamp: new Date(),
            userId: 'system',
            originalText: claim
          },
          'UNVERIFIABLE' as ClaimRating,
          '',
          [],
          [],
          undefined,
          VerificationStatus.PENDING
        ))
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

  private async factCheck(claim: string): Promise<any> {
    const response = await this.makeApiRequest('/chat/completions', {
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

    const result = response.choices[0].message.content;
    return JSON.parse(result);
  }

  private async trustChain(claim: Claim): Promise<any> {
    const response = await this.makeApiRequest('/chat/completions', {
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: trustChainTemplate.system
        },
        {
          role: 'user',
          content: claim.text
        }
      ],
      max_tokens: trustChainTemplate.max_tokens
    });

    const result = response.choices[0].message.content;
    return JSON.parse(result);
  }

  private async generateSocraticReasoning(claim: Claim): Promise<any> {
    const response = await this.makeApiRequest('/chat/completions', {
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: socraticTemplate.system
        },
        {
          role: 'user',
          content: claim.text
        }
      ],
      max_tokens: socraticTemplate.max_tokens
    });

    const result = response.choices[0].message.content;
    return JSON.parse(result);
  }

  private mapVerdictToRating(verdict: string): ClaimRating {
    const mapping: { [key: string]: ClaimRating } = {
      'TRUE': 'TRUE',
      'FALSE': 'FALSE',
      'MISLEADING': 'MISLEADING',
      'UNVERIFIABLE': 'UNVERIFIABLE'
    };
    return mapping[verdict] || 'UNVERIFIABLE';
  }
} 