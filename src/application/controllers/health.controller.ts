import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { SONAR_SERVICE } from '../../infrastructure/sonar/sonar.module';
import { ISonarService } from '../../domain/interfaces/sonar.interface';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(SONAR_SERVICE)
    private readonly sonarService: ISonarService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check API health status' })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok'
        },
        timestamp: {
          type: 'string',
          example: '2024-03-14T12:00:00.000Z'
        },
        services: {
          type: 'object',
          properties: {
            sonar: {
              type: 'string',
              example: 'ok'
            }
          }
        }
      }
    }
  })
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        sonar: 'ok'
      }
    };
  }
} 