import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AnalyzeClaimUseCase } from './analyze-claim.use-case';
import { VerificationConfig } from '../../infrastructure/config/verification.config';
import { Claim, VerificationStatus, ClaimRating } from '../../domain/entities/claim.entity';

describe('AnalyzeClaimUseCase', () => {
  let useCase: AnalyzeClaimUseCase;
  let factCheckAI: any;
  let trustTraceAI: any;
  let socraticAI: any;
  let claimRepository: any;

  const mockFactCheckAI = {
    analyzeClaim: jest.fn()
  };

  const mockTrustTraceAI = {
    traceClaim: jest.fn()
  };

  const mockSocraticAI = {
    generateReasoning: jest.fn()
  };

  const mockClaimRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    find: jest.fn()
  };

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
        AnalyzeClaimUseCase,
        VerificationConfig,
        {
          provide: ConfigService,
          useValue: mockConfigService
        },
        {
          provide: 'IFactCheckAI',
          useValue: mockFactCheckAI
        },
        {
          provide: 'ITrustTraceAI',
          useValue: mockTrustTraceAI
        },
        {
          provide: 'ISocraticAI',
          useValue: mockSocraticAI
        },
        {
          provide: 'IClaimRepository',
          useValue: mockClaimRepository
        }
      ],
    }).compile();

    useCase = module.get<AnalyzeClaimUseCase>(AnalyzeClaimUseCase);
    factCheckAI = module.get('IFactCheckAI');
    trustTraceAI = module.get('ITrustTraceAI');
    socraticAI = module.get('ISocraticAI');
    claimRepository = module.get('IClaimRepository');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const mockText = 'This is a test claim';

    const mockFactCheckResult = {
      rating: 'TRUE' as ClaimRating,
      explanation: 'Test explanation',
      sources: [{
        url: 'https://test.com',
        source: 'https://test.com',
        title: 'Test Source',
        reliability: 'HIGH'
      }],
      reasoningSteps: ['Step 1', 'Step 2']
    };

    const mockTrustChainResult = {
      chain: [
        { url: 'https://test.com', title: 'Test Source', credibility: 80 }
      ],
      confidence: 0.8
    };

    const mockSocraticResult = {
      reasoning: 'Test reasoning',
      questions: ['Question 1'],
      conclusions: ['Conclusion 1']
    };

    it('should process text input successfully', async () => {
      // Mock initial claim save
      const mockInitialClaim = new Claim(
        'test-id',
        mockText,
        {
          source: 'USER_SUBMISSION',
          timestamp: new Date(),
          userId: 'system',
          originalText: mockText
        },
        'UNVERIFIABLE' as ClaimRating,
        '',
        [],
        [],
        undefined,
        VerificationStatus.IN_PROGRESS
      );
      mockClaimRepository.save.mockResolvedValueOnce(mockInitialClaim);

      // Mock AI services
      mockFactCheckAI.analyzeClaim.mockResolvedValueOnce(mockFactCheckResult);
      mockTrustTraceAI.traceClaim.mockResolvedValueOnce(mockTrustChainResult);
      mockSocraticAI.generateReasoning.mockResolvedValueOnce(mockSocraticResult);

      // Mock final claim save
      const mockFinalClaim = new Claim(
        'test-id',
        mockText,
        mockInitialClaim.metadata,
        mockFactCheckResult.rating,
        mockFactCheckResult.explanation,
        mockFactCheckResult.sources,
        mockFactCheckResult.reasoningSteps,
        undefined,
        VerificationStatus.COMPLETED
      );
      mockClaimRepository.save.mockResolvedValueOnce(mockFinalClaim);

      const result = await useCase.execute(mockText);

      expect(result).toBeDefined();
      expect(result.verificationStatus).toBe(VerificationStatus.COMPLETED);
      expect(result.rating).toBe(mockFactCheckResult.rating);
    });

    it('should handle fact check failure', async () => {
      // Mock initial claim save
      const mockInitialClaim = new Claim(
        'test-id',
        mockText,
        {
          source: 'USER_SUBMISSION',
          timestamp: new Date(),
          userId: 'system',
          originalText: mockText
        },
        'UNVERIFIABLE' as ClaimRating,
        '',
        [],
        [],
        undefined,
        VerificationStatus.IN_PROGRESS
      );
      mockClaimRepository.save.mockResolvedValueOnce(mockInitialClaim);

      // Mock fact check failure
      mockFactCheckAI.analyzeClaim.mockResolvedValueOnce(null);

      // Mock the failed claim save
      const mockFailedClaim = new Claim(
        'test-id',
        mockText,
        mockInitialClaim.metadata,
        'UNVERIFIABLE' as ClaimRating,
        'Verification failed: Fact check analysis failed',
        [],
        [],
        undefined,
        VerificationStatus.FAILED
      );
      mockClaimRepository.save.mockResolvedValueOnce(mockFailedClaim);

      const result = await useCase.execute(mockText);

      expect(result).toBeDefined();
      expect(result.verificationStatus).toBe(VerificationStatus.FAILED);
      expect(result.rating).toBe('UNVERIFIABLE');
      expect(result.explanation).toContain('Verification failed');
    });
  });
}); 