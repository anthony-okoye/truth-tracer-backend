import { IsString, IsEnum, IsArray, ValidateNested, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum SourceCredibility {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum SourceType {
  SOCIAL_MEDIA = 'social media',
  NEWS = 'news',
  ACADEMIC = 'academic',
  GOVERNMENT = 'government',
  REFERENCE = 'reference'
}

export class OriginalSource {
  @IsString()
  url: string;

  @IsEnum(SourceType)
  type: SourceType;

  @IsEnum(SourceCredibility)
  credibility: SourceCredibility;

  @IsDateString()
  timestamp: string;

  @IsString()
  context: string;
}

export class PropagationNode {
  @IsString()
  url: string;

  @IsEnum(SourceType)
  type: SourceType;

  @IsEnum(SourceCredibility)
  credibility: SourceCredibility;

  @IsDateString()
  timestamp: string;

  @IsString()
  modifications: string;

  @IsString()
  reach: string;
}

export class TrustChainResponse {
  @ApiProperty({
    description: 'Whether the claim has a verifiable trust chain',
    example: true
  })
  hasTrustChain: boolean;

  @ApiProperty({
    description: 'Confidence score of the trust chain analysis (0-1)',
    example: 0.85
  })
  confidence: number;

  @ApiProperty({
    description: 'List of sources in the trust chain',
    example: [
      {
        name: 'NASA Official Website',
        url: 'https://www.nasa.gov',
        reliability: 0.95
      }
    ]
  })
  sources: Array<{
    name: string;
    url: string;
    reliability: number;
  }>;

  @ApiProperty({
    description: 'Explanation of the trust chain analysis',
    example: 'The claim can be traced through multiple reliable sources.'
  })
  explanation: string;

  @ApiProperty({
    description: 'Gaps or weaknesses in the trust chain',
    example: ['Some sources are not directly accessible']
  })
  gaps?: string[];

  @ApiProperty({
    description: 'Additional context about the trust chain analysis',
    example: 'The claim has been verified by multiple independent sources.'
  })
  context?: string;

  @ValidateNested()
  @Type(() => OriginalSource)
  originalSource: OriginalSource;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropagationNode)
  @IsOptional()
  propagationPath?: PropagationNode[];
} 