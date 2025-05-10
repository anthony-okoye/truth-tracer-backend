export interface ReasoningNode {
  id: string;
  type: 'PREMISE' | 'EVIDENCE' | 'CONCLUSION' | 'QUESTION';
  content: string;
  children: string[]; // IDs of child nodes
}

export class SocraticReasoning {
  constructor(
    public readonly id: string,
    public readonly claimId: string,
    public readonly reasoningTree: ReasoningNode[],
    public readonly questions: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
} 