import { Injectable } from '@nestjs/common';
import { IClaimRepository } from '../../domain/interfaces/claim-repository.interface';
import { Claim, VerificationStatus } from '../../domain/entities/claim.entity';

@Injectable()
export class ClaimRepository implements IClaimRepository {
  private claims: Claim[] = [];

  async save(claim: Claim): Promise<Claim> {
    this.claims.push(claim);
    return claim;
  }

  async findById(id: string): Promise<Claim | null> {
    return this.claims.find(c => c.id === id) || null;
  }

  async find(filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: VerificationStatus;
    confidenceLevel?: string;
  }): Promise<Claim[]> {
    return this.claims.filter(claim => {
      if (filters?.startDate && claim.metadata.timestamp < filters.startDate) return false;
      if (filters?.endDate && claim.metadata.timestamp > filters.endDate) return false;
      if (filters?.status && claim.verificationStatus !== filters.status) return false;
      if (filters?.confidenceLevel && claim.confidenceLevel !== filters.confidenceLevel) return false;
      return true;
    });
  }

  async findByUserId(userId: string): Promise<Claim[]> {
    return this.claims.filter(c => c.metadata.userId === userId);
  }

  async findAll(): Promise<Claim[]> {
    return [...this.claims];
  }

  async update(id: string, claim: Partial<Claim>): Promise<Claim> {
    const idx = this.claims.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Claim not found');
    this.claims[idx] = { ...this.claims[idx], ...claim };
    return this.claims[idx];
  }

  async delete(id: string): Promise<void> {
    this.claims = this.claims.filter(c => c.id !== id);
  }
} 