import { Controller, Post, Get, Body, Param, UseGuards, Logger, Query } from '@nestjs/common';
import { AnalyzeClaimUseCase } from '../../application/use-cases/analyze-claim.use-case';
import { AnalyzeClaimDto, AnalysisResponseDto } from '../dtos/analysis.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { User } from '../decorators/user.decorator';
import { Claim, VerificationStatus } from '../../domain/entities/claim.entity';

@Controller('claims')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(private readonly analyzeClaimUseCase: AnalyzeClaimUseCase) {}

  @Post('analyze')
  async analyzeClaim(
    @Body() dto: AnalyzeClaimDto,
  ): Promise<AnalysisResponseDto> {
    try {
      this.logger.log(`Received analysis request: ${dto.input}`);
      
      const claim = await this.analyzeClaimUseCase.execute(dto.input);
      
      return new AnalysisResponseDto(
        claim.rating,
        claim.explanation,
        claim.reasoningSteps,
        claim.sources,
        claim.verificationStatus,
        claim.confidenceLevel,
        claim.confidenceScore,
        claim.verificationEvidence,
        claim.verificationMetadata
      );
    } catch (error) {
      this.logger.error(`Error in analysis controller: ${error.message}`);
      throw error;
    }
  }

  @Get('status/:claimId')
  async getClaimStatus(
    @Param('claimId') claimId: string,
  ): Promise<Claim> {
    return this.analyzeClaimUseCase.getClaimStatus(claimId);
  }

  @Get('history')
  async getClaimHistory(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: VerificationStatus,
    @Query('confidenceLevel') confidenceLevel?: string,
  ): Promise<Claim[]> {
    return this.analyzeClaimUseCase.getClaimHistory({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
      confidenceLevel
    });
  }

  @Get('socratic/:claimId')
  async getSocraticReasoning(
    @Param('claimId') claimId: string,
  ): Promise<any> {
    return this.analyzeClaimUseCase.getSocraticReasoning(claimId);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getAllClaims() {
    // Implementation for admin endpoint
  }
} 