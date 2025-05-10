import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ISonarService } from '../../domain/interfaces/sonar.interface';
import { Claim, ClaimRating } from '../../domain/entities/claim.entity';
import { TrustChain } from '../../domain/entities/trust-chain.entity';
import { SocraticReasoning } from '../../domain/entities/socratic-reasoning.entity';

@Injectable()
export class SonarClient implements ISonarService {
  private readonly logger = new Logger(SonarClient.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SONAR_API_KEY') ?? '';
    this.baseUrl = this.configService.get<string>('SONAR_API_URL') ?? 'https://api.perplexity.ai/sonar';
  }

  async analyzeClaim(text: string): Promise<{
    rating: ClaimRating;
    explanation: string;
    sources: { title: string; url: string; source: string }[];
    reasoningSteps: string[];
  }> {
    try {
      // Use Sonar's Deep Research + Reasoning capabilities
      const response = await axios.post(
        `${this.baseUrl}/analyze`,
        {
          query: text,
          mode: 'deep_research',
          include_reasoning: true,
          include_sources: true,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data as {
        verdict: string;
        explanation: string;
        sources: Array<{ title: string; url: string; domain: string }>;
        reasoning_chain: string[];
      };

      return {
        rating: this.mapVerdictToRating(result.verdict),
        explanation: result.explanation,
        sources: result.sources.map(source => ({
          title: source.title,
          url: source.url,
          source: source.domain,
        })),
        reasoningSteps: result.reasoning_chain,
      };
    } catch (error) {
      this.logger.error(`Error analyzing claim: ${error.message}`);
      throw error;
    }
  }

  async traceTrustChain(claim: Claim): Promise<TrustChain> {
    try {
      // Use Sonar to analyze the claim's propagation
      const response = await axios.post(
        `${this.baseUrl}/trace`,
        {
          claim: claim.text,
          include_credibility: true,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data as {
        original_source: {
          id: string;
          type: string;
          url: string;
          credibility_score: number;
          timestamp: string;
        };
        propagation_path: Array<{
          id: string;
          type: string;
          url: string;
          credibility_score: number;
          timestamp: string;
        }>;
      };

      return new TrustChain(
        crypto.randomUUID(),
        claim.id,
        {
          id: result.original_source.id,
          type: this.mapSourceType(result.original_source.type),
          url: result.original_source.url,
          credibility: result.original_source.credibility_score,
          timestamp: new Date(result.original_source.timestamp),
        },
        result.propagation_path.map(node => ({
          id: node.id,
          type: this.mapSourceType(node.type),
          url: node.url,
          credibility: node.credibility_score,
          timestamp: new Date(node.timestamp),
        })),
        new Date(),
        new Date(),
      );
    } catch (error) {
      this.logger.error(`Error tracing trust chain: ${error.message}`);
      throw error;
    }
  }

  async generateSocraticReasoning(claim: Claim): Promise<SocraticReasoning> {
    try {
      // Use Sonar's reasoning capabilities to generate Socratic questions
      const response = await axios.post(
        `${this.baseUrl}/reason`,
        {
          claim: claim.text,
          mode: 'socratic',
          include_questions: true,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data as {
        reasoning_tree: Array<{
          id: string;
          type: string;
          content: string;
          children: string[];
        }>;
        questions: string[];
      };

      return new SocraticReasoning(
        crypto.randomUUID(),
        claim.id,
        result.reasoning_tree.map(node => ({
          id: node.id,
          type: node.type as 'PREMISE' | 'EVIDENCE' | 'CONCLUSION' | 'QUESTION',
          content: node.content,
          children: node.children,
        })),
        result.questions,
        new Date(),
        new Date(),
      );
    } catch (error) {
      this.logger.error(`Error generating socratic reasoning: ${error.message}`);
      throw error;
    }
  }

  private mapVerdictToRating(verdict: string): ClaimRating {
    const mapping: Record<string, ClaimRating> = {
      'true': 'TRUE',
      'false': 'FALSE',
      'misleading': 'MISLEADING',
      'unverifiable': 'UNVERIFIABLE',
    };
    return mapping[verdict.toLowerCase()] || 'UNVERIFIABLE';
  }

  private mapSourceType(type: string): 'SOCIAL_MEDIA' | 'NEWS' | 'BLOG' | 'YOUTUBE' | 'OTHER' {
    const mapping: Record<string, 'SOCIAL_MEDIA' | 'NEWS' | 'BLOG' | 'YOUTUBE' | 'OTHER'> = {
      'twitter': 'SOCIAL_MEDIA',
      'facebook': 'SOCIAL_MEDIA',
      'news': 'NEWS',
      'blog': 'BLOG',
      'youtube': 'YOUTUBE',
    };
    return mapping[type.toLowerCase()] || 'OTHER';
  }
} 