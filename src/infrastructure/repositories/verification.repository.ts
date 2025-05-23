import { Injectable } from '@nestjs/common';
import { IVerificationRepository } from '../../domain/interfaces/verification-service.interface';
import { Verification, VerificationStatus } from '../../domain/models/verification.model';

@Injectable()
export class VerificationRepository implements IVerificationRepository {
  private verifications: Verification[] = [];

  async create(verification: Partial<Verification>): Promise<Verification> {
    const newVerification = new Verification();
    Object.assign(newVerification, {
      id: crypto.randomUUID(),
      claim: verification.claim || '',
      context: verification.context || '',
      status: verification.status || VerificationStatus.PENDING,
      confidenceLevel: verification.confidenceLevel,
      confidenceScore: verification.confidenceScore,
      evidence: verification.evidence,
      metadata: verification.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.verifications.push(newVerification);
    return newVerification;
  }

  async findById(id: string): Promise<Verification> {
    const verification = this.verifications.find(v => v.id === id);
    if (!verification) {
      throw new Error(`Verification with ID ${id} not found`);
    }
    return verification;
  }

  async update(id: string, data: Partial<Verification>): Promise<Verification> {
    const index = this.verifications.findIndex(v => v.id === id);
    if (index === -1) {
      throw new Error(`Verification with ID ${id} not found`);
    }
    this.verifications[index] = {
      ...this.verifications[index],
      ...data,
      updatedAt: new Date()
    };
    return this.verifications[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.verifications.findIndex(v => v.id === id);
    if (index === -1) {
      throw new Error(`Verification with ID ${id} not found`);
    }
    this.verifications.splice(index, 1);
  }

  async find(filters: any): Promise<Verification[]> {
    return this.verifications.filter(verification => {
      if (filters?.startDate && verification.createdAt < filters.startDate) return false;
      if (filters?.endDate && verification.createdAt > filters.endDate) return false;
      if (filters?.status && verification.status !== filters.status) return false;
      if (filters?.confidenceLevel && verification.confidenceLevel !== filters.confidenceLevel) return false;
      return true;
    });
  }
} 