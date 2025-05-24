import { Controller, Post, Body, UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ISonarService } from '../../domain/interfaces/sonar.interface';
import { SonarResponseDto } from '../../infrastructure/sonar/dto/sonar-response.dto';
import { SONAR_SERVICE } from '../../infrastructure/sonar/sonar.module';

@Controller('claim-analysis')
@UseGuards(JwtAuthGuard)
export class ClaimAnalysisController {
  constructor(
    @Inject(SONAR_SERVICE)
    private readonly sonarService: ISonarService
  ) {}

  @Post('analyze')
  async analyzeClaim(@Body('claim') claim: string): Promise<SonarResponseDto> {
    return this.sonarService.analyzeClaim(claim);
  }
} 