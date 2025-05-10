import { Claim } from '../entities/claim.entity';

export interface IClaimRepository {
  save(claim: Claim): Promise<Claim>;
  findById(id: string): Promise<Claim | null>;
  findByUserId(userId: string): Promise<Claim[]>;
  findAll(): Promise<Claim[]>;
  update(id: string, claim: Partial<Claim>): Promise<Claim>;
  delete(id: string): Promise<void>;
} 