import { Injectable, Logger } from '@nestjs/common';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface TokenUsageMetrics {
  endpoint: string;
  usage: TokenUsage;
  maxTokens: number;
  timestamp: Date;
}

@Injectable()
export class TokenMonitorService {
  private readonly logger = new Logger(TokenMonitorService.name);
  private readonly metrics: TokenUsageMetrics[] = [];

  public recordTokenUsage(metrics: TokenUsageMetrics): void {
    this.metrics.push(metrics);
    this.logTokenUsage(metrics);
  }

  public getTokenUsageMetrics(): TokenUsageMetrics[] {
    return this.metrics;
  }

  public getAverageTokenUsage(): TokenUsage {
    if (this.metrics.length === 0) {
      return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    }

    return {
      promptTokens: this.calculateAverage('promptTokens'),
      completionTokens: this.calculateAverage('completionTokens'),
      totalTokens: this.calculateAverage('totalTokens')
    };
  }

  private calculateAverage(field: keyof TokenUsage): number {
    const sum = this.metrics.reduce((acc, metric) => acc + metric.usage[field], 0);
    return Math.round(sum / this.metrics.length);
  }

  private logTokenUsage(metrics: TokenUsageMetrics): void {
    const usagePercentage = (metrics.usage.completionTokens / metrics.maxTokens) * 100;
    
    this.logger.debug(`Token usage for ${metrics.endpoint}:`, {
      promptTokens: metrics.usage.promptTokens,
      completionTokens: metrics.usage.completionTokens,
      totalTokens: metrics.usage.totalTokens,
      maxTokens: metrics.maxTokens,
      usagePercentage: `${usagePercentage.toFixed(2)}%`
    });

    if (usagePercentage > 90) {
      this.logger.warn(`High token usage detected for ${metrics.endpoint}: ${usagePercentage.toFixed(2)}%`);
    }
  }
} 