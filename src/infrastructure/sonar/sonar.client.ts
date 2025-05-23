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

  constructor(
    private readonly configService: ConfigService,
    private readonly claimVerificationService: ClaimVerificationService
  ) {
    this.apiKey = this.configService.get<string>('PERPLEXITY_API_KEY');
    this.baseUrl = this.configService.get<string>('PERPLEXITY_API_URL');
    
    if (!this.apiKey || !this.baseUrl) {
      this.logger.error('Perplexity API configuration missing. Please check your environment variables.');
      throw new Error('Perplexity API configuration missing');
    }
  }

  private async makeApiRequest(endpoint: string, data: any, retryCount = 0): Promise<any> {
    try {
      const response = await axios.post<PerplexityResponse>(
        `${this.baseUrl}${endpoint}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from Perplexity API');
      }

      return response.data;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        this.logger.warn(`API request failed, retrying (${retryCount + 1}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
        return this.makeApiRequest(endpoint, data, retryCount + 1);
      }
      throw error;
    }
  }

  async analyzeClaim(text: string): Promise<{
    rating: ClaimRating;
    explanation: string;
    sources: { title: string; url: string; source: string }[];
    reasoningSteps: string[];
  }> {
    try {
      this.logger.debug(`Analyzing claim: ${text}`);
      
      const response = await this.makeApiRequest('/chat/completions', {
        model: 'sonar-deep-research',
        messages: [
          {
            role: 'system',
            content: 'You are a fact-checking assistant. Analyze the following claim and provide a detailed verification. Format your response as follows:\n\nVERDICT: [TRUE/FALSE/MISLEADING/UNVERIFIABLE]\nEXPLANATION: [detailed explanation]\nSOURCES:\n- [title] ([url]) - [source]\nREASONING:\n1. [step 1]\n2. [step 2]'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const result = response.choices[0].message.content;
      this.logger.debug(`Raw API response: ${result}`);

      const parsedResult = this.parseFactCheckResponse(result);
      this.logger.debug(`Parsed result: ${JSON.stringify(parsedResult, null, 2)}`);

      return {
        rating: this.mapVerdictToRating(parsedResult.verdict),
        explanation: parsedResult.explanation,
        sources: parsedResult.sources,
        reasoningSteps: parsedResult.reasoningSteps
      };
    } catch (error) {
      this.logger.error(`Error analyzing claim: ${error.message}`, error.stack);
      throw error;
    }
  }

  async traceTrustChain(claim: Claim): Promise<TrustChain> {
    try {
      const response = await axios.post<PerplexityResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'sonar-reasoning-pro',
          messages: [
            {
              role: 'system',
              content: 'You are a trust chain analyzer. Trace the origin and propagation of the following claim. Format your response as follows:\n\nORIGINAL SOURCE:\nURL: [url]\nType: [type]\nCredibility: [score]\nTimestamp: [timestamp]\n\nPROPAGATION PATH:\n1. URL: [url]\n   Type: [type]\n   Credibility: [score]\n   Timestamp: [timestamp]'
            },
            {
              role: 'user',
              content: claim.text
            }
          ],
          temperature: 0.1,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data.choices[0].message.content;
      const parsedChain = this.parseTrustChainResponse(result);

      return new TrustChain(
        crypto.randomUUID(),
        claim.id,
        parsedChain.originalSource.url,
        parsedChain.propagationPath.map(node => new SourceNode(
          node.url,
          node.type,
          node.credibilityScore,
          new Date(node.timestamp)
        )),
        new Date(),
        new Date()
      );
    } catch (error) {
      this.logger.error(`Error tracing trust chain: ${error.message}`);
      throw error;
    }
  }

  async generateSocraticReasoning(claim: Claim): Promise<SocraticReasoning> {
    try {
      const response = await axios.post<PerplexityResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'sonar-reasoning',
          messages: [
            {
              role: 'system',
              content: 'You are a Socratic reasoning assistant. Generate critical questions and reasoning for the following claim. Format your response as follows:\n\nREASONING TREE:\nPREMISE: [content]\n  EVIDENCE: [content]\n  EVIDENCE: [content]\nCONCLUSION: [content]\n\nQUESTIONS:\n1. [question 1]\n2. [question 2]'
            },
            {
              role: 'user',
              content: claim.text
            }
          ],
          temperature: 0.1,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data.choices[0].message.content;
      const parsedReasoning = this.parseSocraticResponse(result);

      return new SocraticReasoning(
        crypto.randomUUID(),
        claim.id,
        parsedReasoning.reasoningTree,
        parsedReasoning.questions,
        new Date(),
        new Date()
      );
    } catch (error) {
      this.logger.error(`Error generating socratic reasoning: ${error.message}`);
      throw error;
    }
  }

  private parseFactCheckResponse(response: string) {
    try {
      this.logger.debug(`Parsing fact check response: ${response}`);
      
      const lines = response.split('\n');
      const result = {
        verdict: '',
        explanation: '',
        sources: [] as { title: string; url: string; source: string }[],
        reasoningSteps: [] as string[]
      };

      let currentSection = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.startsWith('VERDICT:')) {
          result.verdict = trimmedLine.replace('VERDICT:', '').trim();
          this.logger.debug(`Found verdict: ${result.verdict}`);
        } else if (trimmedLine.startsWith('EXPLANATION:')) {
          result.explanation = trimmedLine.replace('EXPLANATION:', '').trim();
          this.logger.debug(`Found explanation: ${result.explanation}`);
        } else if (trimmedLine === 'SOURCES:') {
          currentSection = 'SOURCES';
        } else if (trimmedLine === 'REASONING:') {
          currentSection = 'REASONING';
        } else if (currentSection === 'SOURCES' && trimmedLine.startsWith('-')) {
          const match = trimmedLine.match(/- (.*?) \((.*?)\) - (.*)/);
          if (match) {
            const source = {
              title: match[1].trim(),
              url: match[2].trim(),
              source: match[3].trim()
            };
            result.sources.push(source);
            this.logger.debug(`Found source: ${JSON.stringify(source)}`);
          }
        } else if (currentSection === 'REASONING' && /^\d+\./.test(trimmedLine)) {
          const step = trimmedLine.replace(/^\d+\.\s*/, '').trim();
          if (step) {
            result.reasoningSteps.push(step);
            this.logger.debug(`Found reasoning step: ${step}`);
          }
        }
      }

      // Validate required fields
      if (!result.verdict) {
        throw new Error('Missing VERDICT in response');
      }
      if (!result.explanation) {
        throw new Error('Missing EXPLANATION in response');
      }
      if (result.sources.length === 0) {
        this.logger.warn('No sources found in response');
      }
      if (result.reasoningSteps.length === 0) {
        this.logger.warn('No reasoning steps found in response');
      }

      return result;
    } catch (error) {
      this.logger.error(`Error parsing fact check response: ${error.message}`, error.stack);
      throw new Error(`Failed to parse fact check response: ${error.message}`);
    }
  }

  private parseTrustChainResponse(response: string) {
    try {
      // The response should be in a structured format like:
      // ORIGINAL SOURCE:
      // URL: [url]
      // Type: [type]
      // Credibility: [score]
      // Timestamp: [timestamp]
      // 
      // PROPAGATION PATH:
      // 1. URL: [url]
      //    Type: [type]
      //    Credibility: [score]
      //    Timestamp: [timestamp]
      
      const lines = response.split('\n');
      const result = {
        originalSource: {
          url: '',
          type: '',
          credibilityScore: 0,
          timestamp: new Date()
        },
        propagationPath: [] as Array<{
          url: string;
          type: string;
          credibilityScore: number;
          timestamp: Date;
        }>
      };

      let currentSection = '';
      let currentNode: any = null;

      for (const line of lines) {
        if (line === 'ORIGINAL SOURCE:') {
          currentSection = 'ORIGINAL';
        } else if (line === 'PROPAGATION PATH:') {
          currentSection = 'PATH';
        } else if (line.trim() && currentSection === 'ORIGINAL') {
          const [key, value] = line.split(':').map(s => s.trim());
          if (key === 'URL') result.originalSource.url = value;
          else if (key === 'Type') result.originalSource.type = value;
          else if (key === 'Credibility') result.originalSource.credibilityScore = parseFloat(value);
          else if (key === 'Timestamp') result.originalSource.timestamp = new Date(value);
        } else if (line.trim() && currentSection === 'PATH') {
          if (line.match(/^\d+\./)) {
            if (currentNode) {
              result.propagationPath.push(currentNode);
            }
            currentNode = {
              url: '',
              type: '',
              credibilityScore: 0,
              timestamp: new Date()
            };
          } else {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key === 'URL') currentNode.url = value;
            else if (key === 'Type') currentNode.type = value;
            else if (key === 'Credibility') currentNode.credibilityScore = parseFloat(value);
            else if (key === 'Timestamp') currentNode.timestamp = new Date(value);
          }
        }
      }

      // Add the last node if exists
      if (currentNode) {
        result.propagationPath.push(currentNode);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error parsing trust chain response: ${error.message}`);
      throw new Error('Failed to parse trust chain response');
    }
  }

  private parseSocraticResponse(response: string) {
    try {
      // The response should be in a structured format like:
      // REASONING TREE:
      // PREMISE: [content]
      //   EVIDENCE: [content]
      //   EVIDENCE: [content]
      // CONCLUSION: [content]
      // 
      // QUESTIONS:
      // 1. [question 1]
      // 2. [question 2]
      
      const lines = response.split('\n');
      const result = {
        reasoningTree: [] as Array<{
          id: string;
          type: 'PREMISE' | 'EVIDENCE' | 'CONCLUSION' | 'QUESTION';
          content: string;
          children: string[];
        }>,
        questions: [] as string[]
      };

      let currentSection = '';
      let currentNode: any = null;
      let currentIndent = 0;

      for (const line of lines) {
        if (line === 'REASONING TREE:') {
          currentSection = 'TREE';
        } else if (line === 'QUESTIONS:') {
          currentSection = 'QUESTIONS';
        } else if (line.trim() && currentSection === 'TREE') {
          const indent = line.search(/\S/);
          const content = line.trim();
          
          if (content.startsWith('PREMISE:') || 
              content.startsWith('EVIDENCE:') || 
              content.startsWith('CONCLUSION:') || 
              content.startsWith('QUESTION:')) {
            
            if (currentNode) {
              result.reasoningTree.push(currentNode);
            }

            const [type, ...contentParts] = content.split(':');
            currentNode = {
              id: crypto.randomUUID(),
              type: type.trim() as 'PREMISE' | 'EVIDENCE' | 'CONCLUSION' | 'QUESTION',
              content: contentParts.join(':').trim(),
              children: []
            };
            currentIndent = indent;
          } else if (currentNode && indent > currentIndent) {
            currentNode.children.push(content);
          }
        } else if (line.trim() && currentSection === 'QUESTIONS') {
          const question = line.replace(/^\d+\.\s*/, '').trim();
          if (question) {
            result.questions.push(question);
          }
        }
      }

      // Add the last node if exists
      if (currentNode) {
        result.reasoningTree.push(currentNode);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error parsing socratic response: ${error.message}`);
      throw new Error('Failed to parse socratic response');
    }
  }

  private convertToTrustChainResult(trustChain: TrustChain): TrustChainResult {
    return {
      chain: trustChain.propagationPath,
      confidence: trustChain.propagationPath.reduce((acc, node) => acc + node.credibility, 0) / trustChain.propagationPath.length
    };
  }

  private convertToSocraticResult(socratic: SocraticReasoning): SocraticReasoningResult {
    return {
      reasoning: socratic.reasoningTree.map(node => node.content).join('\n'),
      questions: socratic.questions,
      conclusions: socratic.reasoningTree
        .filter(node => node.type === 'CONCLUSION')
        .map(node => node.content)
    };
  }

  async verifyClaim(claim: string): Promise<{
    isVerified: boolean;
    confidenceScore: number;
    explanation: string;
    sources: string[];
  }> {
    const factCheckResult = await this.analyzeClaim(claim);
    const trustChain = await this.traceTrustChain(new Claim(
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
    ));
    const socratic = await this.generateSocraticReasoning(new Claim(
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
    ));

    const confidenceScore = this.claimVerificationService.calculateConfidenceScore(
      this.claimVerificationService.getConfidenceFromFactCheck(factCheckResult),
      this.convertToTrustChainResult(trustChain).confidence,
      this.claimVerificationService.getConfidenceFromSocratic(this.convertToSocraticResult(socratic))
    );

    return {
      isVerified: confidenceScore >= 0.7,
      confidenceScore,
      explanation: this.claimVerificationService.generateExplanation(
        factCheckResult,
        this.convertToTrustChainResult(trustChain),
        this.convertToSocraticResult(socratic)
      ),
      sources: factCheckResult.sources.map(s => s.url)
    };
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