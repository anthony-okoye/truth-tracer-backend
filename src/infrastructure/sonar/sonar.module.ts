import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SonarClient } from './sonar.client';
import { ClaimVerificationService } from '../../domain/services/claim-verification.service';

export const SONAR_SERVICE = 'SONAR_SERVICE';

@Module({
  imports: [ConfigModule],
  providers: [
    ClaimVerificationService,
    {
      provide: SONAR_SERVICE,
      useClass: SonarClient
    }
  ],
  exports: [SONAR_SERVICE]
})
export class SonarModule {} 