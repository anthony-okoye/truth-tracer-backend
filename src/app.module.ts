import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisController } from './interfaces/controllers/analysis.controller';
import { AnalyzeClaimUseCase } from './application/use-cases/analyze-claim.use-case';
import { SonarClient } from './infrastructure/sonar/sonar.client';
import { getDatabaseConfig } from './infrastructure/config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService) => getDatabaseConfig(configService),
      inject: [ConfigService],
    }),
  ],
  controllers: [AnalysisController],
  providers: [
    AnalyzeClaimUseCase,
    {
      provide: 'ISonarService',
      useClass: SonarClient,
    },
  ],
})
export class AppModule {}
