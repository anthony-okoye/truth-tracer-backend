import { Inject, Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Claim, VerificationStatus, ConfidenceLevel, ClaimRating } from '../../domain/entities/claim.entity';
import { IFactCheckAI, FactCheckResult, TrustChainResult, SocraticReasoningResult } from '../../domain/interfaces/ai-services.interface';
import { IClaimRepository } from '../../domain/interfaces/claim-repository.interface';
import { ITrustTraceAI } from '../../domain/interfaces/ai-services.interface';
import { ISocraticAI } from '../../domain/interfaces/ai-services.interface';
import { TrustChain, SourceNode } from '../../domain/entities/trust-chain.entity';
import { VerificationConfig } from '../../infrastructure/config/verification.config';
import { UrlContentExtractorService } from '../../infrastructure/services/url-content-extractor.service';

@Injectable()
export class AnalyzeClaimUseCase {
  private readonly logger = new Logger(AnalyzeClaimUseCase.name);

  constructor(
    @Inject('IFactCheckAI') private readonly factCheckAI: IFactCheckAI,
    @Inject('ITrustTraceAI') private readonly trustTraceAI: ITrustTraceAI,
    @Inject('ISocraticAI') private readonly socraticAI: ISocraticAI,
    @Inject('IClaimRepository') private readonly claimRepository: IClaimRepository,
    private readonly verificationConfig: VerificationConfig,
    private readonly urlContentExtractor: UrlContentExtractorService
  ) {}

  async execute(input: string): Promise<Claim> {
    try {
      this.logger.log(`Analyzing input: ${input}`);

      // Determine if input is URL or text
      const isUrl = this.isValidUrl(input);
      const text = isUrl ? await this.extractTextFromUrl(input) : input;

      // Create initial claim with pending verification
      const claim = new Claim(
        crypto.randomUUID(),
        text,
        {
          source: isUrl ? 'URL_SUBMISSION' : 'USER_SUBMISSION',
          timestamp: new Date(),
          userId: 'system',
          originalText: text,
          url: isUrl ? input : undefined
        },
        'UNVERIFIABLE' as ClaimRating,
        '',
        [],
        [],
        undefined,
        VerificationStatus.IN_PROGRESS
      );

      // Save initial claim
      const savedClaim = await this.claimRepository.save(claim);

      try {
        // 1. Perform fact checking
        const factCheckResult = await this.factCheckAI.analyzeClaim(text);
        if (!factCheckResult) {
          throw new InternalServerErrorException('Fact check analysis failed');
        }

        // 2. Create trust chain
        const trustChainResult = await this.trustTraceAI.traceClaim(savedClaim);
        if (!trustChainResult) {
          throw new InternalServerErrorException('Trust chain generation failed');
        }

        // Convert TrustChainResult to TrustChain
        const trustChain = new TrustChain(
          crypto.randomUUID(),
          savedClaim.id,
          trustChainResult.chain[0]?.url || input,
          trustChainResult.chain.map(node => new SourceNode(
            node.url,
            node.title,
            node.credibility || 50,
            node.timestamp || new Date()
          )),
          new Date(),
          new Date()
        );

        // 3. Generate socratic reasoning
        const socraticReasoning = await this.socraticAI.generateReasoning(savedClaim);
        if (!socraticReasoning) {
          throw new InternalServerErrorException('Socratic reasoning generation failed');
        }

        // 4. Calculate confidence score based on all results
        const confidenceScore = this.calculateConfidenceScore(
          factCheckResult,
          trustChainResult,
          socraticReasoning
        );

        // 5. Update claim with all results
        const updatedClaim = new Claim(
          savedClaim.id,
          text,
          savedClaim.metadata,
          factCheckResult.rating as ClaimRating,
          factCheckResult.explanation,
          factCheckResult.sources,
          factCheckResult.reasoningSteps,
          trustChain,
          VerificationStatus.COMPLETED,
          this.calculateConfidenceLevel(confidenceScore),
          confidenceScore,
          {
            sources: factCheckResult.sources.map(s => s.url),
            supportingEvidence: factCheckResult.reasoningSteps,
            contradictingEvidence: [], // To be implemented based on fact check results
            analysis: socraticReasoning.reasoning
          },
          {
            modelUsed: 'combined_ai_system',
            processingTime: Date.now() - savedClaim.metadata.timestamp.getTime(),
            language: 'en',
            categories: factCheckResult.categories || []
          }
        );

        // 6. Save final claim
        return await this.claimRepository.save(updatedClaim);
      } catch (error) {
        this.logger.error(`Error during claim analysis: ${error.message}`);
        // Update claim status to failed
        const failedClaim = new Claim(
          savedClaim.id,
          text,
          savedClaim.metadata,
          'UNVERIFIABLE' as ClaimRating,
          `Verification failed: ${error.message}`,
          [],
          [],
          undefined,
          VerificationStatus.FAILED
        );
        return await this.claimRepository.save(failedClaim);
      }
    } catch (error) {
      this.logger.error(`Error in analyze claim use case: ${error.message}`);
      throw new InternalServerErrorException(`Failed to process claim: ${error.message}`);
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private async extractTextFromUrl(url: string): Promise<string> {
    return await this.urlContentExtractor.extractContent(url);
  }

  private calculateConfidenceScore(
    factCheckResult: FactCheckResult,
    trustChain: TrustChainResult,
    socraticReasoning: SocraticReasoningResult
  ): number {
    try {
      const weights = this.verificationConfig.confidenceWeights;

      // 1. Fact Check Score
      const factCheckScore = this.calculateFactCheckScore(factCheckResult);

      // 2. Trust Chain Score
      const trustChainScore = this.calculateTrustChainScore(trustChain);

      // 3. Socratic Reasoning Score
      const socraticScore = this.calculateSocraticScore(socraticReasoning);

      // 4. Source Reliability Score
      const sourceScore = this.calculateSourceReliabilityScore(factCheckResult.sources);

      // 5. Evidence Consistency Score
      const consistencyScore = this.calculateEvidenceConsistencyScore(
        factCheckResult,
        trustChain,
        socraticReasoning
      );

      // Calculate weighted average
      const finalScore = (
        factCheckScore * weights.FACT_CHECK +
        trustChainScore * weights.TRUST_CHAIN +
        socraticScore * weights.SOCRATIC_REASONING +
        sourceScore * weights.SOURCE_RELIABILITY +
        consistencyScore * weights.EVIDENCE_CONSISTENCY
      );

      this.logger.debug(`Confidence score components:
        Fact Check: ${factCheckScore}
        Trust Chain: ${trustChainScore}
        Socratic: ${socraticScore}
        Source: ${sourceScore}
        Consistency: ${consistencyScore}
        Final Score: ${finalScore}
      `);

      return Math.min(Math.max(finalScore, 0), 1);
    } catch (error) {
      this.logger.error(`Error calculating confidence score: ${error.message}`);
      return 0.5;
    }
  }

  private isReputableDomain(domain: string): boolean {
    return this.verificationConfig.reputableDomains.some(d => domain.includes(d));
  }

  async getClaimStatus(claimId: string): Promise<Claim> {
    const claim = await this.claimRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }
    return claim;
  }

  async getClaimHistory(filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: VerificationStatus;
    confidenceLevel?: string;
  }): Promise<Claim[]> {
    try {
      return await this.claimRepository.find(filters);
    } catch (error) {
      this.logger.error(`Error fetching claim history: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch claim history');
    }
  }

  async getSocraticReasoning(claimId: string): Promise<string> {
    const claim = await this.getClaimStatus(claimId);
    if (!claim.verificationEvidence?.analysis) {
      throw new NotFoundException(`Socratic reasoning not found for claim ${claimId}`);
    }
    return claim.verificationEvidence.analysis;
  }

  private calculateFactCheckScore(result: FactCheckResult): number {
    // Convert rating to numeric score
    const ratingScores = {
      'TRUE': 1.0,
      'FALSE': 0.0,
      'MISLEADING': 0.3,
      'UNVERIFIABLE': 0.5
    };

    const baseScore = ratingScores[result.rating as ClaimRating] || 0.5;

    // Adjust score based on explanation quality and reasoning steps
    const explanationQuality = this.assessTextQuality(result.explanation);
    const reasoningQuality = result.reasoningSteps.length > 0 
      ? result.reasoningSteps.reduce((acc, step) => acc + this.assessTextQuality(step), 0) / result.reasoningSteps.length
      : 0.5;

    return (baseScore * 0.6 + explanationQuality * 0.2 + reasoningQuality * 0.2);
  }

  private calculateTrustChainScore(trustChain: TrustChainResult): number {
    if (!trustChain.chain || trustChain.chain.length === 0) {
      return 0.5; // Neutral score for no trust chain
    }

    // Calculate average credibility of sources in the chain
    const sourceCredibility = trustChain.chain.reduce((acc, source) => {
      return acc + (source.credibility || 50) / 100;
    }, 0) / trustChain.chain.length;

    // Consider chain length and complexity
    const chainComplexity = Math.min(trustChain.chain.length / 5, 1);

    return (sourceCredibility * 0.7 + chainComplexity * 0.3);
  }

  private calculateSocraticScore(reasoning: SocraticReasoningResult): number {
    if (!reasoning.questions || !reasoning.conclusions) {
      return 0.5;
    }

    // Assess quality of questions and conclusions
    const questionQuality = reasoning.questions.length > 0
      ? reasoning.questions.reduce((acc, q) => acc + this.assessTextQuality(q), 0) / reasoning.questions.length
      : 0.5;

    const conclusionQuality = reasoning.conclusions.length > 0
      ? reasoning.conclusions.reduce((acc, c) => acc + this.assessTextQuality(c), 0) / reasoning.conclusions.length
      : 0.5;

    // Consider reasoning depth
    const reasoningDepth = this.assessTextQuality(reasoning.reasoning);

    return (questionQuality * 0.3 + conclusionQuality * 0.3 + reasoningDepth * 0.4);
  }

  private calculateSourceReliabilityScore(sources: { title: string; url: string; source: string }[]): number {
    if (!sources || sources.length === 0) {
      return 0.3; // Low score for no sources
    }

    // Assess source quality based on domain and type
    const sourceScores = sources.map(source => {
      const domain = new URL(source.url).hostname;
      const isReputable = this.isReputableDomain(domain);
      const hasTitle = source.title && source.title.length > 0;
      return (isReputable ? 0.8 : 0.4) * (hasTitle ? 1 : 0.8);
    });

    return sourceScores.reduce((acc, score) => acc + score, 0) / sources.length;
  }

  private calculateEvidenceConsistencyScore(
    factCheck: FactCheckResult,
    trustChain: TrustChainResult,
    socratic: SocraticReasoningResult
  ): number {
    // Check for consistency between different analysis components
    const consistencyChecks = [
      this.checkRatingConsistency(factCheck.rating, trustChain.confidence),
      this.checkSourceConsistency(factCheck.sources, trustChain.chain),
      this.checkReasoningConsistency(factCheck.reasoningSteps, socratic.reasoning)
    ];

    return consistencyChecks.reduce((acc, check) => acc + check, 0) / consistencyChecks.length;
  }

  private assessTextQuality(text: string): number {
    if (!text) return 0.5;
    
    // Basic quality metrics
    const length = text.length;
    const hasStructure = /[.!?]/.test(text);
    const hasDetails = /[0-9]/.test(text) || /[A-Z]/.test(text);
    
    let score = 0.5;
    if (length > 100) score += 0.2;
    if (hasStructure) score += 0.15;
    if (hasDetails) score += 0.15;
    
    return Math.min(score, 1);
  }

  private checkRatingConsistency(rating: string, trustConfidence: number): number {
    const ratingScores = {
      'TRUE': 1.0,
      'FALSE': 0.0,
      'MISLEADING': 0.3,
      'UNVERIFIABLE': 0.5
    };

    const ratingScore = ratingScores[rating as ClaimRating] || 0.5;
    return 1 - Math.abs(ratingScore - trustConfidence);
  }

  private checkSourceConsistency(
    factCheckSources: { url: string }[],
    trustChainSources: any[]
  ): number {
    if (!factCheckSources.length || !trustChainSources.length) return 0.5;

    const factCheckUrls = new Set(factCheckSources.map(s => s.url));
    const trustChainUrls = new Set(trustChainSources.map(s => s.url));

    const intersection = new Set([...factCheckUrls].filter(x => trustChainUrls.has(x)));
    const union = new Set([...factCheckUrls, ...trustChainUrls]);

    return intersection.size / union.size;
  }

  private checkReasoningConsistency(
    factCheckSteps: string[],
    socraticReasoning: string
  ): number {
    if (!factCheckSteps.length || !socraticReasoning) return 0.5;

    // Check for common keywords and concepts
    const factCheckKeywords = new Set(
      factCheckSteps.flatMap(step => 
        step.toLowerCase().split(/\W+/).filter(word => word.length > 3)
      )
    );

    const socraticKeywords = new Set(
      socraticReasoning.toLowerCase().split(/\W+/).filter(word => word.length > 3)
    );

    const intersection = new Set([...factCheckKeywords].filter(x => socraticKeywords.has(x)));
    const union = new Set([...factCheckKeywords, ...socraticKeywords]);

    return intersection.size / union.size;
  }

  private calculateConfidenceLevel(score: number): ConfidenceLevel {
    if (score >= 0.9) return ConfidenceLevel.VERY_HIGH;
    if (score >= 0.7) return ConfidenceLevel.HIGH;
    if (score >= 0.5) return ConfidenceLevel.MEDIUM;
    if (score >= 0.3) return ConfidenceLevel.LOW;
    return ConfidenceLevel.VERY_LOW;
  }
} 