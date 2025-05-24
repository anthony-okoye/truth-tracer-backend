import { AnalysisModel } from '../../../domain/dtos/claim-analysis.dto';

export interface ModelConfig {
  model: string;
  max_tokens: number;
  temperature: number;
}

export class ModelSelectionStrategy {
  static getConfig(type: AnalysisModel): ModelConfig {
    return {
      model: type,
      max_tokens: type === AnalysisModel.QUICK ? 500 : 1000,
      temperature: 0.1
    };
  }
} 