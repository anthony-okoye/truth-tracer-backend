import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async checkHealth() {
    // Check DB
    let dbStatus = 'ok';
    try {
      await this.connection.query('SELECT 1');
    } catch {
      dbStatus = 'error';
    }

    // Check Sonar
    let sonarStatus = 'ok';
    try {
      const sonarUrl = this.configService.get<string>('SONAR_API_URL') ?? '';
      const sonarKey = this.configService.get<string>('SONAR_API_KEY') ?? '';
      await axios.post(
        sonarUrl + '/analyze',
        {
          query: 'health check',
          mode: 'deep_research',
          include_reasoning: false,
          include_sources: false,
        },
        {
          headers: {
            'Authorization': `Bearer ${sonarKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 3000,
        }
      );
    } catch {
      sonarStatus = 'error';
    }

    return {
      status: dbStatus === 'ok' && sonarStatus === 'ok' ? 'ok' : 'error',
      database: dbStatus,
      sonar: sonarStatus,
    };
  }
} 