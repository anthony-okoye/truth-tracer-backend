import { Claim } from '../entities/claim.entity';
import { TrustChain } from '../entities/trust-chain.entity';
import { SocraticReasoning } from '../entities/socratic-reasoning.entity';

export interface FactCheckResult {
  rating: string;
  explanation: string;
  sources: { title: string; url: string; source: string }[];
  reasoningSteps: string[];
  categories?: string[];
}

export interface TrustChainResult {
  chain: any[]; // Define specific type based on your trust chain structure
  confidence: number;
}

export interface SocraticReasoningResult {
  reasoning: string;
  questions: string[];
  conclusions: string[];
}

export interface IFactCheckAI {
  analyzeClaim(text: string): Promise<FactCheckResult>;
}

export interface ITrustTraceAI {
  traceClaim(claim: Claim): Promise<TrustChainResult>;
}

export interface ISocraticAI {
  generateReasoning(claim: Claim): Promise<SocraticReasoningResult>;
} 