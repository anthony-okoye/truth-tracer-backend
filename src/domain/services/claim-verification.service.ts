import { Injectable } from '@nestjs/common';
import { SonarResponseDto } from '../../infrastructure/sonar/dto/sonar-response.dto';

@Injectable()
export class ClaimVerificationService {
  calculateConfidenceScore(result: SonarResponseDto): number {
    const weights = {
      factCheck: 0.4,
      trustChain: 0.3,
      socratic: 0.3
    };

    let totalWeight = 0;
    let weightedSum = 0;

    // Fact Check Confidence
    if (result.factCheck) {
      const factCheckConfidence = this.getFactCheckConfidence(result.factCheck);
      weightedSum += factCheckConfidence * weights.factCheck;
      totalWeight += weights.factCheck;
    }

    // Trust Chain Confidence
    if (result.trustChain) {
      const trustChainConfidence = this.getTrustChainConfidence(result.trustChain);
      weightedSum += trustChainConfidence * weights.trustChain;
      totalWeight += weights.trustChain;
    }

    // Socratic Reasoning Confidence
    if (result.socratic) {
      const socraticConfidence = this.getSocraticConfidence(result.socratic);
      weightedSum += socraticConfidence * weights.socratic;
      totalWeight += weights.socratic;
    }

    // Normalize by total weight of available methods
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private getFactCheckConfidence(factCheck: any): number {
    const ratingMap: { [key: string]: number } = {
      'TRUE': 1.0,
      'FALSE': 0.0,
      'MISLEADING': 0.3,
      'UNVERIFIABLE': 0.5
    };
    return ratingMap[factCheck.verdict] || 0.5;
  }

  private getTrustChainConfidence(trustChain: any): number {
    if (!trustChain.originalSource || !trustChain.propagationPath) {
      return 0.5;
    }

    const sourceCredibility = this.getCredibilityScore(trustChain.originalSource.credibility);
    const pathCredibility = trustChain.propagationPath.length > 0
      ? trustChain.propagationPath.reduce((acc, node) => 
          acc + this.getCredibilityScore(node.credibility), 0) / trustChain.propagationPath.length
      : 0.5;

    return (sourceCredibility * 0.6 + pathCredibility * 0.4);
  }

  private getSocraticConfidence(socratic: any): number {
    if (!socratic.reasoningSteps || !socratic.conclusion) {
      return 0.5;
    }

    const stepCount = socratic.reasoningSteps.length;
    const hasConclusion = socratic.conclusion.logicalValidity !== undefined;
    const hasFlaws = socratic.conclusion.keyFlaws !== undefined;
    const hasStrengths = socratic.conclusion.strengths !== undefined;

    return Math.min(0.5 + (stepCount * 0.1) + (hasConclusion ? 0.1 : 0) + 
      (hasFlaws ? 0.1 : 0) + (hasStrengths ? 0.1 : 0), 1.0);
  }

  private getCredibilityScore(credibility: string): number {
    const scoreMap: { [key: string]: number } = {
      'High': 1.0,
      'Medium': 0.6,
      'Low': 0.2
    };
    return scoreMap[credibility] || 0.5;
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
      parts.push(`Trust Chain: ${result.trustChain.originalSource.context}`);
      if (result.trustChain.propagationPath?.length > 0) {
        parts.push('Propagation:');
        result.trustChain.propagationPath.forEach(node => {
          parts.push(`- ${node.type} (${node.credibility}): ${node.modifications}`);
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
      isVerified: confidenceScore >= 0.7,
      confidenceScore,
      explanation
    };
  }
} 