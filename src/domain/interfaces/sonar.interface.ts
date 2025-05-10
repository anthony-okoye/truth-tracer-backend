import { Claim, ClaimRating } from '../entities/claim.entity';
import { TrustChain } from '../entities/trust-chain.entity';
import { SocraticReasoning } from '../entities/socratic-reasoning.entity';

export interface ISonarService {
  analyzeClaim(text: string): Promise<{
    rating: ClaimRating;
    explanation: string;
    sources: { title: string; url: string; source: string }[];
    reasoningSteps: string[];
  }>;

  traceTrustChain(claim: Claim): Promise<TrustChain>;
  
  generateSocraticReasoning(claim: Claim): Promise<SocraticReasoning>;
} 