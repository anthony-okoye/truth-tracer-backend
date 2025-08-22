import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIServicesModule } from './infrastructure/config/ai-services.module';
import { SonarModule } from './infrastructure/sonar/sonar.module';
import { ClaimAnalysisController } from './application/controllers/claim-analysis.controller';
import { HealthController } from './application/controllers/health.controller';
import { RequestTimingMiddleware } from './common/middleware/request-timing.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AIServicesModule,
    SonarModule,
  ],
  controllers: [ClaimAnalysisController, HealthController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestTimingMiddleware)
      .forRoutes('*');
  }
}
