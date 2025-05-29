import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SonarClient } from './sonar.client';
import { SonarResponseSanitizer } from './response-sanitizer';
import { TokenMonitorService } from '../../domain/services/token-monitor.service';

export const SONAR_SERVICE = 'SONAR_SERVICE';

@Module({
  imports: [ConfigModule],
  providers: [
    SonarClient,
    SonarResponseSanitizer,
    TokenMonitorService,
    {
      provide: SONAR_SERVICE,
      useExisting: SonarClient
    }
  ],
  exports: [SonarClient, SONAR_SERVICE, TokenMonitorService]
})
export class SonarModule {} 