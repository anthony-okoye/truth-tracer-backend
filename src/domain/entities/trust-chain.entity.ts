export interface SourceNode {
  id: string;
  type: 'SOCIAL_MEDIA' | 'NEWS' | 'BLOG' | 'YOUTUBE' | 'OTHER';
  url: string;
  credibility: number; // 0-100
  timestamp: Date;
}

export class TrustChain {
  constructor(
    public readonly id: string,
    public readonly claimId: string,
    public readonly originalSource: SourceNode,
    public readonly propagationPath: SourceNode[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
} 