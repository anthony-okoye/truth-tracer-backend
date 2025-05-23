import { Injectable } from '@nestjs/common';
import { FactCheckResult, TrustChainResult, SocraticReasoningResult } from '../interfaces/ai-services.interface';

@Injectable()
export class ClaimVerificationService {
  calculateConfidenceScore(
    factCheckConfidence: number,
    trustChainConfidence: number,
    socraticConfidence: number
  ): number {
    return (
      factCheckConfidence * 0.4 +
      trustChainConfidence * 0.3 +
      socraticConfidence * 0.3
    );
  }

  getConfidenceFromFactCheck(result: FactCheckResult): number {
    const ratingMap: { [key: string]: number } = {
      'true': 1.0,
      'mostly_true': 0.8,
      'partially_true': 0.6,
      'mostly_false': 0.4,
      'false': 0.2,
      'unverified': 0.0
    };
    return ratingMap[result.rating.toLowerCase()] || 0.5;
  }

  getConfidenceFromSocratic(result: SocraticReasoningResult): number {
    const conclusionCount = result.conclusions.length;
    const questionCount = result.questions.length;
    return Math.min(0.5 + (conclusionCount * 0.1) + (questionCount * 0.05), 1.0);
  }

  generateExplanation(
    factCheckResult: FactCheckResult,
    trustChainResult: TrustChainResult,
    socraticResult: SocraticReasoningResult
  ): string {
    return `
      Fact Check: ${factCheckResult.explanation}
      Trust Chain: ${trustChainResult.chain.length > 0 ? 'Trust chain verified' : 'No trust chain found'}
      Reasoning: ${socraticResult.reasoning}
    `.trim();
  }
} 