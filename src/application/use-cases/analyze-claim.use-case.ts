import { Injectable, Logger } from '@nestjs/common';
import { Claim } from '../../domain/entities/claim.entity';
import { IFactCheckAI } from '../../domain/interfaces/ai-services.interface';
import { IClaimRepository } from '../../domain/interfaces/claim-repository.interface';
import { ITrustTraceAI } from '../../domain/interfaces/ai-services.interface';
import { ISocraticAI } from '../../domain/interfaces/ai-services.interface';

@Injectable()
export class AnalyzeClaimUseCase {
  private readonly logger = new Logger(AnalyzeClaimUseCase.name);

  constructor(
    private readonly factCheckAI: IFactCheckAI,
    private readonly trustTraceAI: ITrustTraceAI,
    private readonly socraticAI: ISocraticAI,
    private readonly claimRepository: IClaimRepository,
  ) {}

  async execute(text: string, userId: string): Promise<Claim> {
    try {
      this.logger.log(`Analyzing claim from user ${userId}: ${text}`);

      // 1. Perform fact checking
      const factCheckResult = await this.factCheckAI.analyzeClaim(text);

      // 2. Create initial claim
      const claim = new Claim(
        crypto.randomUUID(),
        text,
        {
          source: 'USER_SUBMISSION',
          timestamp: new Date(),
          userId,
          originalText: text,
        },
        factCheckResult.rating,
        factCheckResult.explanation,
        factCheckResult.sources,
        factCheckResult.reasoningSteps,
      );

      // 3. Trace trust chain
      const trustChain = await this.trustTraceAI.traceClaim(claim);
      claim.trustChain = trustChain;

      // 4. Generate socratic reasoning
      const socraticReasoning = await this.socraticAI.generateReasoning(claim);
      // Store socratic reasoning separately or attach to claim as needed

      // 5. Save claim to repository
      const savedClaim = await this.claimRepository.save(claim);

      this.logger.log(`Analysis completed for claim ${savedClaim.id}`);
      return savedClaim;
    } catch (error) {
      this.logger.error(`Error in analyze claim use case: ${error.message}`);
      throw error;
    }
  }
} 