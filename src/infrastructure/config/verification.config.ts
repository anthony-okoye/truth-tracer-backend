import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VerificationConfig {
  constructor(private configService: ConfigService) {}

  get confidenceWeights() {
    return {
      FACT_CHECK: this.configService.get<number>('CONFIDENCE_WEIGHT_FACT_CHECK', 0.35),
      TRUST_CHAIN: this.configService.get<number>('CONFIDENCE_WEIGHT_TRUST_CHAIN', 0.25),
      SOCRATIC_REASONING: this.configService.get<number>('CONFIDENCE_WEIGHT_SOCRATIC', 0.20),
      SOURCE_RELIABILITY: this.configService.get<number>('CONFIDENCE_WEIGHT_SOURCE', 0.15),
      EVIDENCE_CONSISTENCY: this.configService.get<number>('CONFIDENCE_WEIGHT_CONSISTENCY', 0.05)
    };
  }

  get reputableDomains(): string[] {
    const domains = this.configService.get<string>('REPUTABLE_DOMAINS', 
      'reuters.com,apnews.com,bbc.com,nytimes.com,washingtonpost.com,theguardian.com,nature.com,science.org,academic.edu,gov,edu,linkedin.com,twitter.com,facebook.com,instagram.com,reddit.com'
    );
    return domains.split(',').map(d => d.trim());
  }

  get socialMediaDomains(): string[] {
    return [
      'linkedin.com',
      'twitter.com',
      'facebook.com',
      'instagram.com',
      'reddit.com'
    ];
  }
} 