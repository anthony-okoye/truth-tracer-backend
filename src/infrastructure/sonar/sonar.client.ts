import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
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
  choices: Array<{
    message: {
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
    try {
      this.logger.debug(`Making API request to ${this.baseUrl}${endpoint}`);
      this.logger.debug(`Request data: ${JSON.stringify(data, null, 2)}`);
      
      const response = await axios.post<PerplexityResponse>(
        `${this.baseUrl}${endpoint}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        }
      );

      this.logger.debug(`API Response status: ${response.status}`);
      this.logger.debug(`API Response headers: ${JSON.stringify(response.headers, null, 2)}`);
      this.logger.debug(`API Response data: ${JSON.stringify(response.data, null, 2)}`);

      if (!response.data?.choices?.[0]?.message?.content) {
        this.logger.error('Invalid response format. Full response:', response.data);
        throw new Error('Invalid response format from Sonar API');
      }

      return response.data;
    } catch (error) {
      this.logger.error(`API Error details:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      });

      if (retryCount < this.maxRetries) {
        this.logger.warn(`API request failed, retrying (${retryCount + 1}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
        return this.makeApiRequest(endpoint, data, retryCount + 1);
      }
      throw error;
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