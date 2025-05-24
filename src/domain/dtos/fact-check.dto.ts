import { IsString, IsEnum, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum FactCheckVerdict {
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  MISLEADING = 'MISLEADING',
  UNVERIFIABLE = 'UNVERIFIABLE'
}

export enum SourceReliability {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export class Source {
  @ApiProperty({
    description: 'Title of the source',
    example: 'NASA Official Website'
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'URL of the source',
    example: 'https://www.nasa.gov'
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'Reliability rating of the source',
    enum: SourceReliability,
    example: SourceReliability.HIGH
  })
  @IsEnum(SourceReliability)
  reliability: SourceReliability;
}

export class FactCheckResponse {
  @ApiProperty({
    description: 'The verdict of the fact check',
    enum: FactCheckVerdict,
    example: FactCheckVerdict.FALSE
  })
  @IsEnum(FactCheckVerdict)
  verdict: FactCheckVerdict;

  @ApiProperty({
    description: 'Confidence score of the verification (0-1)',
    example: 0.95
  })
  confidence: number;

  @ApiProperty({
    description: 'Explanation of the verification result',
    example: 'The claim is false. Scientific evidence overwhelmingly supports that the Earth is spherical.'
  })
  @IsString()
  explanation: string;

  @ApiProperty({
    description: 'Sources used for verification',
    type: [Source]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Source)
  sources: Source[];

  @ApiProperty({
    description: 'Additional context or notes about the verification',
    example: 'This claim is a common conspiracy theory that has been debunked multiple times.'
  })
  @IsString()
  @IsOptional()
  notes?: string;
} 