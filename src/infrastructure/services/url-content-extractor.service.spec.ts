import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UrlContentExtractorService } from './url-content-extractor.service';
import { VerificationConfig } from '../config/verification.config';

describe('UrlContentExtractorService', () => {
  let service: UrlContentExtractorService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: any) => {
      const config = {
        CONFIDENCE_WEIGHT_FACT_CHECK: 0.35,
        CONFIDENCE_WEIGHT_TRUST_CHAIN: 0.25,
        CONFIDENCE_WEIGHT_SOCRATIC: 0.20,
        CONFIDENCE_WEIGHT_SOURCE: 0.15,
        CONFIDENCE_WEIGHT_CONSISTENCY: 0.05,
        REPUTABLE_DOMAINS: 'reuters.com,apnews.com,bbc.com,nytimes.com,washingtonpost.com,theguardian.com,nature.com,science.org,academic.edu,gov,edu,linkedin.com,twitter.com,facebook.com,instagram.com,reddit.com'
      };
      return config[key] || defaultValue;
    })
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlContentExtractorService,
        VerificationConfig,
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ],
    }).compile();

    service = module.get<UrlContentExtractorService>(UrlContentExtractorService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractContent', () => {
    it('should identify social media URLs', async () => {
      const twitterUrl = 'https://twitter.com/user/status/123456789';
      const linkedinUrl = 'https://linkedin.com/post/123456789';
      const facebookUrl = 'https://facebook.com/post/123456789';
      const instagramUrl = 'https://instagram.com/p/123456789';
      const redditUrl = 'https://reddit.com/r/subreddit/comments/123456789';

      await expect(service.extractContent(twitterUrl)).rejects.toThrow('Twitter content extraction not implemented');
      await expect(service.extractContent(linkedinUrl)).rejects.toThrow('LinkedIn content extraction not implemented');
      await expect(service.extractContent(facebookUrl)).rejects.toThrow('Facebook content extraction not implemented');
      await expect(service.extractContent(instagramUrl)).rejects.toThrow('Instagram content extraction not implemented');
      await expect(service.extractContent(redditUrl)).rejects.toThrow('Reddit content extraction not implemented');
    });

    it('should handle invalid URLs', async () => {
      const invalidUrl = 'not-a-valid-url';
      await expect(service.extractContent(invalidUrl)).rejects.toThrow();
    });

    it('should handle non-social media URLs', async () => {
      const newsUrl = 'https://reuters.com/article/123456789';
      await expect(service.extractContent(newsUrl)).rejects.toThrow('Web page content extraction not implemented');
    });
  });
}); 