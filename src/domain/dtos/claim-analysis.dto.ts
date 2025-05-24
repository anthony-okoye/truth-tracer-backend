import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export enum AnalysisModel {
  QUICK = 'sonar',
  DETAILED = 'sonar-pro'
}

export class ClaimAnalysisDto {
  @ApiProperty({
    description: 'The claim to be analyzed',
    example: 'The Earth is flat and NASA has been hiding this fact for decades.',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  claim: string;
  modelType: AnalysisModel;
  analysisType: 'fact-check' | 'trust-chain' | 'socratic';
} 