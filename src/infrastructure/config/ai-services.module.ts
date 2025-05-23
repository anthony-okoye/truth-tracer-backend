import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SonarClient } from '../sonar/sonar.client';
import { ClaimVerificationService } from '../../domain/services/claim-verification.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'IFactCheckAI',
      useClass: SonarClient
    },
    {
      provide: 'ITrustTraceAI',
      useClass: SonarClient
    },
    {
      provide: 'ISocraticAI',
      useClass: SonarClient
    },
    SonarClient,
    ClaimVerificationService
  ],
  exports: ['IFactCheckAI', 'ITrustTraceAI', 'ISocraticAI', SonarClient, ClaimVerificationService]
})
export class AIServicesModule {} 