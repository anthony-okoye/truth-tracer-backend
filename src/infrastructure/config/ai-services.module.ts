import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SonarModule } from '../sonar/sonar.module';
import { SonarClient } from '../sonar/sonar.client';
import { ClaimVerificationService } from '../../domain/services/claim-verification.service';

@Module({
  imports: [
    ConfigModule,
    SonarModule
  ],
  providers: [
    {
      provide: 'IFactCheckAI',
      useExisting: SonarClient
    },
    {
      provide: 'ITrustTraceAI',
      useExisting: SonarClient
    },
    {
      provide: 'ISocraticAI',
      useExisting: SonarClient
    },
    ClaimVerificationService
  ],
  exports: ['IFactCheckAI', 'ITrustTraceAI', 'ISocraticAI', ClaimVerificationService]
})
export class AIServicesModule {} 