import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FactCheckResponse } from '../../../domain/dtos/fact-check.dto';
import { TrustChainResponse } from '../../../domain/dtos/trust-chain.dto';
import { SocraticReasoningResponse } from '../../../domain/dtos/socratic-reasoning.dto';

export class AnalysisStatus {
  factCheck: 'fulfilled' | 'rejected';
  trustChain: 'fulfilled' | 'rejected';
  socratic: 'fulfilled' | 'rejected';
  timestamp: string;
}

export class SonarResponseDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FactCheckResponse)
  factCheck?: FactCheckResponse;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrustChainResponse)
  trustChain?: TrustChainResponse;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocraticReasoningResponse)
  socratic?: SocraticReasoningResponse;

  @IsObject()
  status: AnalysisStatus;
} 