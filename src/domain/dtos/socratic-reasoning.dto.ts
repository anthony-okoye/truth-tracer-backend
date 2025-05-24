import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReasoningStep {
  @IsString()
  question: string;

  @IsString()
  analysis: string;

  @IsString()
  evidence: string;

  @IsString()
  implications: string;
}

export class Conclusion {
  @IsString()
  logicalValidity: string;

  @IsString()
  keyFlaws: string;

  @IsString()
  strengths: string;

  @IsString()
  recommendations: string;
}

export class SocraticReasoningResponse {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReasoningStep)
  reasoningSteps: ReasoningStep[];

  @ValidateNested()
  @Type(() => Conclusion)
  @ApiProperty({
    description: 'The main conclusion reached through Socratic reasoning',
    example: 'The claim lacks scientific evidence and contradicts established facts.'
  })
  conclusion: Conclusion;

  @ApiProperty({
    description: 'Confidence score of the Socratic analysis (0-1)',
    example: 0.9
  })
  confidence: number;

  @ApiProperty({
    description: 'List of questions raised during the analysis',
    example: [
      'What evidence supports the claim?',
      'How does this claim align with scientific consensus?'
    ]
  })
  questions: string[];

  @ApiProperty({
    description: 'Key assumptions identified in the claim',
    example: ['NASA has the capability to hide such information']
  })
  assumptions: string[];

  @ApiProperty({
    description: 'Logical fallacies identified in the claim',
    example: ['Appeal to authority', 'False dichotomy']
  })
  fallacies?: string[];

  @ApiProperty({
    description: 'Additional insights from the Socratic analysis',
    example: 'The claim relies heavily on conspiracy theories rather than verifiable evidence.'
  })
  insights?: string;
} 