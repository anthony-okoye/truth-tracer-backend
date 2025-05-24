export enum AnalysisModel {
  QUICK = 'sonar',
  DETAILED = 'sonar-pro'
}

export class ClaimAnalysisDto {
  input: string;
  modelType: AnalysisModel;
  analysisType: 'fact-check' | 'trust-chain' | 'socratic';
} 