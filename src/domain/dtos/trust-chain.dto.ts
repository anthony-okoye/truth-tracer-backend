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

export class Source {
  @ApiProperty({ description: 'Name of the source' })
  name: string;

  @ApiProperty({ description: 'URL of the source' })
  url: string;

  @ApiProperty({ description: 'Reliability score of the source (0-1)' })
  reliability: number;
}

export class TrustChainResponse {
  @ApiProperty({ description: 'Whether the claim has a verifiable trust chain' })
  hasTrustChain: boolean;

  @ApiProperty({ description: 'Confidence score in the trust chain analysis (0-1)' })
  confidence: number;

  @ApiProperty({ description: 'List of sources in the trust chain', type: [Source] })
  sources: Source[];

  @ApiProperty({ description: 'Detailed explanation of the trust chain analysis' })
  explanation: string;

  @ApiProperty({ description: 'List of gaps or weaknesses in the trust chain' })
  gaps: string[];

  @ApiProperty({ description: 'Additional context about the trust chain analysis' })
  context: string;

  @ValidateNested()
  @Type(() => OriginalSource)
  originalSource: OriginalSource;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropagationNode)
  @IsOptional()
  propagationPath?: PropagationNode[];
} 