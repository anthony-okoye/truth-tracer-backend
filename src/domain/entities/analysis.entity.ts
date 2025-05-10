export type VerdictStatus = 'true' | 'false' | 'uncertain';

export interface Citation {
  title: string;
  url: string;
  source: string;
}

export class Analysis {
  constructor(
    public readonly status: VerdictStatus,
    public readonly reasoning: string,
    public readonly explanationChain: string[],
    public readonly citations: Citation[],
  ) {}
} 