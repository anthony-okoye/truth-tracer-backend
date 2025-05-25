import { Injectable } from '@nestjs/common';
import { SonarResponseDto } from '../../infrastructure/sonar/dto/sonar-response.dto';
import { 
  VERIFICATION_WEIGHTS, 
  CONFIDENCE_THRESHOLDS,
  SOCRATIC_SCORING,
  CREDIBILITY_SCORES,
  VERDICT_SCORES
} from '../../common/constants/verification.constants';
import { FactCheckResponse } from '../dtos/fact-check.dto';
import { TrustChainResponse } from '../dtos/trust-chain.dto';
import { SocraticReasoningResponse } from '../dtos/socratic-reasoning.dto';

@Injectable()
export class ClaimVerificationService {
  calculateConfidenceScore(result: SonarResponseDto): number {
    let totalWeight = 0;
    let weightedSum = 0;

    // Fact Check Confidence
    if (result.factCheck) {
      const factCheckConfidence = this.getFactCheckConfidence(result.factCheck);
      weightedSum += factCheckConfidence * VERIFICATION_WEIGHTS.FACT_CHECK;
      totalWeight += VERIFICATION_WEIGHTS.FACT_CHECK;
    }

    // Trust Chain Confidence
    if (result.trustChain) {
      const trustChainConfidence = this.getTrustChainConfidence(result.trustChain);
      weightedSum += trustChainConfidence * VERIFICATION_WEIGHTS.TRUST_CHAIN;
      totalWeight += VERIFICATION_WEIGHTS.TRUST_CHAIN;
    }

    // Socratic Reasoning Confidence
    if (result.socratic) {
      const socraticConfidence = this.getSocraticConfidence(result.socratic);
      weightedSum += socraticConfidence * VERIFICATION_WEIGHTS.SOCRATIC;
      totalWeight += VERIFICATION_WEIGHTS.SOCRATIC;
    }

    // Normalize by total weight of available methods
    return totalWeight > 0 ? weightedSum / totalWeight : CONFIDENCE_THRESHOLDS.MINIMUM;
  }

  private getFactCheckConfidence(factCheck: FactCheckResponse): number {
    return VERDICT_SCORES[factCheck.verdict] || VERDICT_SCORES.DEFAULT;
  }

  private getTrustChainConfidence(trustChain: TrustChainResponse): number {
    if (!trustChain.hasTrustChain) {
      return CONFIDENCE_THRESHOLDS.DEFAULT;
    }

    const sourceReliability = trustChain.sources.length > 0
      ? trustChain.sources.reduce((acc, source) => acc + source.reliability, 0) / trustChain.sources.length
      : CONFIDENCE_THRESHOLDS.DEFAULT;

    return Math.min(sourceReliability, CONFIDENCE_THRESHOLDS.MAXIMUM);
  }

  private getSocraticConfidence(socratic: SocraticReasoningResponse): number {
    if (!socratic.reasoningSteps || !socratic.conclusion) {
      return CONFIDENCE_THRESHOLDS.DEFAULT;
    }

    const stepCount = socratic.reasoningSteps.length;
    const hasConclusion = socratic.conclusion.logicalValidity !== undefined;
    const hasFlaws = socratic.conclusion.keyFlaws !== undefined;
    const hasStrengths = socratic.conclusion.strengths !== undefined;

    const score = SOCRATIC_SCORING.BASE_SCORE +
      (stepCount * SOCRATIC_SCORING.STEP_INCREMENT) +
      (hasConclusion ? SOCRATIC_SCORING.CONCLUSION_BONUS : 0) +
      (hasFlaws ? SOCRATIC_SCORING.FLAWS_BONUS : 0) +
      (hasStrengths ? SOCRATIC_SCORING.STRENGTHS_BONUS : 0);

    return Math.min(score, CONFIDENCE_THRESHOLDS.MAXIMUM);
  }

  generateExplanation(result: SonarResponseDto): string {
    const parts: string[] = [];

    if (result.factCheck) {
      parts.push(`Fact Check: ${result.factCheck.explanation}`);
      if (result.factCheck.sources?.length > 0) {
        parts.push('Sources:');
        result.factCheck.sources.forEach(source => {
          parts.push(`- ${source.title} (${source.reliability})`);
        });
      }
    }

    if (result.trustChain) {
      parts.push(`Trust Chain: ${result.trustChain.explanation}`);
      if (result.trustChain.sources?.length > 0) {
        parts.push('Sources:');
        result.trustChain.sources.forEach(source => {
          parts.push(`- ${source.name} (${source.reliability})`);
        });
      }
      if (result.trustChain.gaps?.length > 0) {
        parts.push('Gaps:');
        result.trustChain.gaps.forEach(gap => {
          parts.push(`- ${gap}`);
        });
      }
    }

    if (result.socratic) {
      parts.push('Socratic Analysis:');
      if (result.socratic.reasoningSteps?.length > 0) {
        result.socratic.reasoningSteps.forEach(step => {
          parts.push(`- Q: ${step.question}`);
          parts.push(`  A: ${step.analysis}`);
        });
      }
      if (result.socratic.conclusion) {
        parts.push(`Conclusion: ${result.socratic.conclusion.logicalValidity}`);
      }
    }

    return parts.join('\n');
  }

  getVerificationStatus(result: SonarResponseDto): {
    isVerified: boolean;
    confidenceScore: number;
    explanation: string;
  } {
    const confidenceScore = this.calculateConfidenceScore(result);
    const explanation = this.generateExplanation(result);

    return {
      isVerified: confidenceScore >= CONFIDENCE_THRESHOLDS.VERIFIED,
      confidenceScore,
      explanation
    };
  }
} 