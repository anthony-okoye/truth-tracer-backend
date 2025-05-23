import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum VerificationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum ConfidenceLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

@Entity('verifications')
export class Verification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  claim: string;

  @Column('text')
  context?: string;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING
  })
  status: VerificationStatus;

  @Column({
    type: 'enum',
    enum: ConfidenceLevel,
    nullable: true
  })
  confidenceLevel?: ConfidenceLevel;

  @Column('float', { nullable: true })
  confidenceScore?: number;

  @Column('jsonb', { nullable: true })
  evidence: {
    sources: string[];
    supportingEvidence: string[];
    contradictingEvidence: string[];
    analysis: string;
  };

  @Column('jsonb', { nullable: true })
  metadata: {
    modelUsed: string;
    processingTime: number;
    language: string;
    categories: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 