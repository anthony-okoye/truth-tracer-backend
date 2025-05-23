import { Verification } from '../models/verification.model';
import { VerificationPrompt } from './chat-template.interface';

export interface IVerificationService {
  verifyClaim(prompt: VerificationPrompt): Promise<Verification>;
  getVerificationStatus(id: string): Promise<Verification>;
  cancelVerification(id: string): Promise<void>;
  getVerificationHistory(filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    confidenceLevel?: string;
  }): Promise<Verification[]>;
}

export interface IVerificationRepository {
  create(verification: Partial<Verification>): Promise<Verification>;
  findById(id: string): Promise<Verification>;
  update(id: string, data: Partial<Verification>): Promise<Verification>;
  delete(id: string): Promise<void>;
  find(filters: any): Promise<Verification[]>;
} 