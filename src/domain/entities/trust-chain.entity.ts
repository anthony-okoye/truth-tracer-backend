export class SourceNode {
  constructor(
    public url: string,
    public title: string,
    public credibility: number,
    public timestamp: Date
  ) {}
}

export class TrustChain {
  constructor(
    public id: string,
    public claimId: string,
    public originalSource: string,
    public propagationPath: SourceNode[],
    public createdAt: Date,
    public updatedAt: Date
  ) {}
} 