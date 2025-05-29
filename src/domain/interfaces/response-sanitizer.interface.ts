export interface SanitizationResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
  originalResponse: string;
  sanitizationSteps: string[];
}

export interface IResponseSanitizer {
  sanitizeResponse<T>(response: string): SanitizationResult<T>;
  isValidJSON(str: string): boolean;
} 