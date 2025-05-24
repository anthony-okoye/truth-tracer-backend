import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClaimRepository } from './infrastructure/repositories/claim.repository';
import { VerificationRepository } from './infrastructure/repositories/verification.repository';
import { VerificationConfig } from './infrastructure/config/verification.config';
import { UrlContentExtractorService } from './infrastructure/services/url-content-extractor.service';
import { AIServicesModule } from './infrastructure/config/ai-services.module';
import { SonarModule } from './infrastructure/sonar/sonar.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AIServicesModule,
    SonarModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'truth_tracer',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ClaimRepository,
    VerificationRepository,
    VerificationConfig,
    UrlContentExtractorService
  ],
})
export class AppModule {}
