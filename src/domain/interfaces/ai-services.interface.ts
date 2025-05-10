import { Claim, ClaimRating } from '../entities/claim.entity';
import { TrustChain } from '../entities/trust-chain.entity';
import { SocraticReasoning } from '../entities/socratic-reasoning.entity';

export interface IFactCheckAI {
  analyzeClaim(text: string): Promise<{
    rating: ClaimRating;
    explanation: string;
    sources: { title: string; url: string; source: string }[];
    reasoningSteps: string[];
  }>;
}

export interface ITrustTraceAI {
  traceClaim(claim: Claim): Promise<TrustChain>;
}

export interface ISocraticAI {
  generateReasoning(claim: Claim): Promise<SocraticReasoning>;
} 