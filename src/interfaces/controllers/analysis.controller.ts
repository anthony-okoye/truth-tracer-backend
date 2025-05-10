import { Controller, Post, Get, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { AnalyzeClaimUseCase } from '../../application/use-cases/analyze-claim.use-case';
import { AnalyzeClaimDto, AnalysisResponseDto } from '../dtos/analysis.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { User } from '../decorators/user.decorator';

@Controller('claims')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(private readonly analyzeClaimUseCase: AnalyzeClaimUseCase) {}

  @Post('analyze')
  async analyzeClaim(
    @Body() dto: AnalyzeClaimDto,
    @User() user: { id: string },
  ): Promise<AnalysisResponseDto> {
    try {
      this.logger.log(`Received analysis request from user ${user.id}: ${dto.input}`);
      
      const claim = await this.analyzeClaimUseCase.execute(dto.input, user.id);
      
      return new AnalysisResponseDto(
        claim.rating,
        claim.explanation,
        claim.reasoningSteps,
        claim.sources
      );
    } catch (error) {
      this.logger.error(`Error in analysis controller: ${error.message}`);
      throw error;
    }
  }

  @Get('socratic/:claimId')
  async getSocraticReasoning(
    @Param('claimId') claimId: string,
    @User() user: { id: string },
  ) {
    // Implementation for socratic reasoning endpoint
  }

  @Get('history')
  async getUserHistory(@User() user: { id: string }) {
    // Implementation for user history endpoint
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getAllClaims() {
    // Implementation for admin endpoint
  }
} 