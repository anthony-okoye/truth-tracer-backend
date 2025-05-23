export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
}

export interface ChatTemplate {
  system: {
    role: 'system';
    content: string;
    constraints: string[];
    capabilities: string[];
  };
  user: ChatMessage;
  assistant: ChatMessage & {
    confidence: number;
    sources?: string[];
  };
}

export interface VerificationPrompt {
  claim: string;
  context?: string;
  language?: string;
  verificationLevel?: 'quick' | 'standard' | 'comprehensive';
  additionalContext?: Record<string, any>;
} 