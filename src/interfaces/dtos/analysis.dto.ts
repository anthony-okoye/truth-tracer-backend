import { IsString, IsNotEmpty } from 'class-validator';
import { Claim, VerificationStatus, ConfidenceLevel } from '../../domain/entities/claim.entity';

export class AnalyzeClaimDto {
  @IsString()
  @IsNotEmpty()
  input: string;
  verificationLevel?: 'quick' | 'standard' | 'comprehensive';
  language?: string;
  additionalContext?: Record<string, any>;
}

export class AnalysisResponseDto {
  rating: string;
  explanation: string;
  reasoningSteps: string[];
  sources: { title: string; url: string; source: string }[];
  verificationStatus: VerificationStatus;
  confidenceLevel?: ConfidenceLevel;
  confidenceScore?: number;
  verificationEvidence?: {
    sources: string[];
    supportingEvidence: string[];
    contradictingEvidence: string[];
    analysis: string;
  };
  verificationMetadata?: {
    modelUsed: string;
    processingTime: number;
    language: string;
    categories: string[];
  };

  constructor(
    rating: string,
    explanation: string,
    reasoningSteps: string[],
    sources: { title: string; url: string; source: string }[],
    verificationStatus: VerificationStatus,
    confidenceLevel?: ConfidenceLevel,
    confidenceScore?: number,
    verificationEvidence?: {
      sources: string[];
      supportingEvidence: string[];
      contradictingEvidence: string[];
      analysis: string;
    },
    verificationMetadata?: {
      modelUsed: string;
      processingTime: number;
      language: string;
      categories: string[];
    }
  ) {
    this.rating = rating;
    this.explanation = explanation;
    this.reasoningSteps = reasoningSteps;
    this.sources = sources;
    this.verificationStatus = verificationStatus;
    this.confidenceLevel = confidenceLevel;
    this.confidenceScore = confidenceScore;
    this.verificationEvidence = verificationEvidence;
    this.verificationMetadata = verificationMetadata;
  }
} 