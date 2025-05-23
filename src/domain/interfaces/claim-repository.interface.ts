import { Claim, VerificationStatus } from '../entities/claim.entity';

export interface IClaimRepository {
  save(claim: Claim): Promise<Claim>;
  findById(id: string): Promise<Claim | null>;
  find(filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: VerificationStatus;
    confidenceLevel?: string;
  }): Promise<Claim[]>;
  delete(id: string): Promise<void>;
} 