export type ClaimRating = 'TRUE' | 'FALSE' | 'MISLEADING' | 'UNVERIFIABLE';

export interface ClaimMetadata {
  source: string;
  timestamp: Date;
  userId: string;
  originalText: string;
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
  ) {}
} 