import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SONAR_SERVICE } from '../../infrastructure/sonar/sonar.module';
import { ISonarService } from '../../domain/interfaces/sonar.interface';
import { ClaimAnalysisDto } from '../../domain/dtos/claim-analysis.dto';
import { SonarResponseDto } from '../../infrastructure/sonar/dto/sonar-response.dto';

@ApiTags('claims')
@ApiBearerAuth()
@Controller('claims')
export class ClaimAnalysisController {
  constructor(
    @Inject(SONAR_SERVICE)
    private readonly sonarService: ISonarService
  ) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze a claim using multiple verification methods' })
  @ApiResponse({
    status: 200,
    description: 'The claim has been successfully analyzed',
    type: SonarResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid claim provided'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during analysis'
  })
  async analyzeClaim(@Body() claimDto: ClaimAnalysisDto): Promise<SonarResponseDto> {
    return this.sonarService.analyzeClaim(claimDto.claim);
  }
} 