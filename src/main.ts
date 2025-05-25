import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SonarExceptionFilter } from './common/filters/sonar-exception.filter';
import { SonarValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Set global prefix
  app.setGlobalPrefix('truth-tracer');
  
  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
    new SonarValidationPipe()
  );

  // Global filters
  app.useGlobalFilters(new SonarExceptionFilter());

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Truth Tracer API')
    .setDescription('API for analyzing and verifying claims using multiple methods')
    .setVersion('1.0')
    .addTag('claims', 'Claim analysis endpoints')
    .addBearerAuth()
    .addServer('/truth-tracer')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
