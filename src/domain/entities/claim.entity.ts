import { Citation } from './analysis.entity';
import { TrustChain } from './trust-chain.entity';

export type ClaimRating = 'TRUE' | 'FALSE' | 'MISLEADING' | 'UNVERIFIABLE';

export enum VerificationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum ConfidenceLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export interface ClaimMetadata {
  source: string;
  timestamp: Date;
  userId: string;
  originalText: string;
  url?: string;
  verificationLevel?: 'quick' | 'standard' | 'comprehensive';
  language?: string;
}

export interface VerificationEvidence {
  sources: string[];
  supportingEvidence: string[];
  contradictingEvidence: string[];
  analysis: string;
}

export interface VerificationMetadata {
  modelUsed: string;
  processingTime: number;
  language: string;
  categories: string[];
}

export class Claim {
  constructor(
    public readonly id: string,
    public readonly text: string,
    public readonly metadata: ClaimMetadata,
    public readonly rating: ClaimRating,
    public readonly explanation: string,
    public readonly sources: Citation[],
    public readonly reasoningSteps: string[],
    public readonly trustChain?: TrustChain,
    public readonly verificationStatus: VerificationStatus = VerificationStatus.PENDING,
    public readonly confidenceLevel?: ConfidenceLevel,
    public readonly confidenceScore?: number,
    public readonly verificationEvidence?: VerificationEvidence,
    public readonly verificationMetadata?: VerificationMetadata,
  ) {}
} 