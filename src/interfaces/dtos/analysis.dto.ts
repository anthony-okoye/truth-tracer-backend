import { IsString, IsNotEmpty } from 'class-validator';
import { Analysis } from '../../domain/entities/analysis.entity';

export class AnalyzeClaimDto {
  @IsString()
  @IsNotEmpty()
  input: string;
}

export class AnalysisResponseDto implements Analysis {
  constructor(
    public readonly status: 'true' | 'false' | 'uncertain',
    public readonly reasoning: string,
    public readonly explanationChain: string[],
    public readonly citations: { title: string; url: string; source: string }[],
  ) {}
} 