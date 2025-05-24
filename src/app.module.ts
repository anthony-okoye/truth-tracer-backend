import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
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
