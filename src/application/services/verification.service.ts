import { Injectable } from '@nestjs/common';
import { IVerificationService, IVerificationRepository } from '../../domain/interfaces/verification-service.interface';
import { Verification, VerificationStatus, ConfidenceLevel } from '../../domain/models/verification.model';
import { VerificationPrompt } from '../../domain/interfaces/chat-template.interface';
import { ChatTemplate } from '../../domain/interfaces/chat-template.interface';

@Injectable()
export class VerificationService implements IVerificationService {
  private readonly systemPrompt: ChatTemplate['system'] = {
    role: 'system',
    content: `You are a Truth-Tracer AI assistant specialized in fact verification and validation.
    Your primary responsibilities include:
    1. Analyzing claims for factual accuracy
    2. Identifying and evaluating supporting evidence
    3. Assessing source credibility
    4. Providing detailed analysis with confidence levels`,
    constraints: [
      'Always cite sources',
      'Maintain objectivity',
      'Express confidence levels',
      'Highlight uncertainties',
      'Consider temporal context'
    ],
    capabilities: [
      'Cross-reference multiple sources',
      'Analyze temporal consistency',
      'Evaluate source reliability',
      'Generate detailed reports'
    ]
  };

  constructor(
    private readonly verificationRepository: IVerificationRepository,
    private readonly aiService: any // TODO: Implement AI service interface
  ) {}

  async verifyClaim(prompt: VerificationPrompt): Promise<Verification> {
    // Create initial verification record
    const verification = await this.verificationRepository.create({
      claim: prompt.claim,
      context: prompt.context,
      status: VerificationStatus.IN_PROGRESS
    });

    try {
      // Prepare chat template
      const chatTemplate: ChatTemplate = {
        system: this.systemPrompt,
        user: {
          role: 'user',
          content: this.formatUserPrompt(prompt),
          metadata: {
            verificationLevel: prompt.verificationLevel,
            language: prompt.language
          }
        },
        assistant: {
          role: 'assistant',
          content: '',
          confidence: 0
        }
      };

      // Process verification with AI
      const result = await this.aiService.processVerification(chatTemplate);

      // Update verification with results
      const updatedVerification = await this.verificationRepository.update(verification.id, {
        status: VerificationStatus.COMPLETED,
        confidenceLevel: this.calculateConfidenceLevel(result.confidence),
        confidenceScore: result.confidence,
        evidence: {
          sources: result.sources,
          supportingEvidence: result.supportingEvidence,
          contradictingEvidence: result.contradictingEvidence,
          analysis: result.analysis
        },
        metadata: {
          modelUsed: result.modelUsed,
          processingTime: result.processingTime,
          language: prompt.language || 'en',
          categories: result.categories
        }
      });

      return updatedVerification;
    } catch (error) {
      // Update verification status to failed
      await this.verificationRepository.update(verification.id, {
        status: VerificationStatus.FAILED
      });
      throw error;
    }
  }

  async getVerificationStatus(id: string): Promise<Verification> {
    return this.verificationRepository.findById(id);
  }

  async cancelVerification(id: string): Promise<void> {
    const verification = await this.verificationRepository.findById(id);
    if (verification.status === VerificationStatus.IN_PROGRESS) {
      await this.verificationRepository.update(id, {
        status: VerificationStatus.FAILED
      });
    }
  }

  async getVerificationHistory(filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    confidenceLevel?: string;
  }): Promise<Verification[]> {
    return this.verificationRepository.find(filters);
  }

  private formatUserPrompt(prompt: VerificationPrompt): string {
    return `
      Claim to verify: ${prompt.claim}
      ${prompt.context ? `Context: ${prompt.context}` : ''}
      Verification level: ${prompt.verificationLevel || 'standard'}
      ${prompt.additionalContext ? `Additional context: ${JSON.stringify(prompt.additionalContext)}` : ''}
    `.trim();
  }

  private calculateConfidenceLevel(score: number): ConfidenceLevel {
    if (score >= 0.9) return ConfidenceLevel.VERY_HIGH;
    if (score >= 0.7) return ConfidenceLevel.HIGH;
    if (score >= 0.5) return ConfidenceLevel.MEDIUM;
    if (score >= 0.3) return ConfidenceLevel.LOW;
    return ConfidenceLevel.VERY_LOW;
  }
} 