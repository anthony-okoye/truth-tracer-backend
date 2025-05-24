export interface SonarResponseDto {
  factCheck: any | null;
  trustChain: any | null;
  socratic: any | null;
  status: {
    factCheck: 'fulfilled' | 'rejected';
    trustChain: 'fulfilled' | 'rejected';
    socratic: 'fulfilled' | 'rejected';
    timestamp: string;
  };
} 