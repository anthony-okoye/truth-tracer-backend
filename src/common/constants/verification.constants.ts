export const VERIFICATION_WEIGHTS = {
  FACT_CHECK: 0.4,
  TRUST_CHAIN: 0.3,
  SOCRATIC: 0.3
} as const;

export const CONFIDENCE_THRESHOLDS = {
  VERIFIED: 0.7,
  MINIMUM: 0.0,
  MAXIMUM: 1.0,
  DEFAULT: 0.5
} as const;

export const SOCRATIC_SCORING = {
  BASE_SCORE: 0.5,
  STEP_INCREMENT: 0.1,
  CONCLUSION_BONUS: 0.1,
  FLAWS_BONUS: 0.1,
  STRENGTHS_BONUS: 0.1
} as const;

export const CREDIBILITY_SCORES = {
  HIGH: 1.0,
  MEDIUM: 0.6,
  LOW: 0.2,
  DEFAULT: 0.5
} as const;

export const VERDICT_SCORES = {
  TRUE: 1.0,
  FALSE: 0.0,
  MISLEADING: 0.3,
  UNVERIFIABLE: 0.5,
  DEFAULT: 0.5
} as const; 