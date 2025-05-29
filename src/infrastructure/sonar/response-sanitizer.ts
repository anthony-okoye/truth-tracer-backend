import { Injectable, Logger } from '@nestjs/common';
import { IResponseSanitizer, SanitizationResult } from '../../domain/interfaces/response-sanitizer.interface';

@Injectable()
export class SonarResponseSanitizer implements IResponseSanitizer {
  private readonly logger = new Logger(SonarResponseSanitizer.name);
  private static readonly JSON_BLOCK_REGEX = /```(?:json)?\s*([\s\S]*?)```/gi;
  private static readonly THINKING_BLOCK_REGEX = /<think>[\s\S]*?<\/think>/gi;
  private static readonly JSON_OBJECT_REGEX = /{[\s\S]*}/;

  sanitizeResponse<T>(response: string): SanitizationResult<T> {
    const steps: string[] = [];
    let cleanedResponse = response;

    try {
      // Step 1: If response is valid JSON, return directly
      if (this.isValidJSON(cleanedResponse)) {
        steps.push('Response was already valid JSON');
        return this.buildResult<T>(true, JSON.parse(cleanedResponse), response, steps);
      }

      // Step 2: Strip <think> blocks
      cleanedResponse = cleanedResponse.replace(SonarResponseSanitizer.THINKING_BLOCK_REGEX, '');
      steps.push('Removed <think> blocks');

      // Step 3: Attempt to extract all JSON blocks
      const jsonMatches = [...cleanedResponse.matchAll(SonarResponseSanitizer.JSON_BLOCK_REGEX)];
      if (jsonMatches.length > 0) {
        for (const match of jsonMatches) {
          const candidate = match[1].trim();
          if (this.isValidJSON(candidate)) {
            steps.push('Extracted and validated JSON from code block');
            return this.buildResult<T>(true, JSON.parse(candidate), response, steps);
          }
        }
        steps.push('Found JSON blocks but none valid');
      }

      // Step 4: Attempt to extract largest JSON-looking block
      const jsonObjectMatch = cleanedResponse.match(SonarResponseSanitizer.JSON_OBJECT_REGEX);
      if (jsonObjectMatch && this.isValidJSON(jsonObjectMatch[0])) {
        steps.push('Extracted valid JSON object from free text');
        return this.buildResult<T>(true, JSON.parse(jsonObjectMatch[0]), response, steps);
      }

      // Step 5: Final trim + retry parse
      cleanedResponse = cleanedResponse.trim();
      if (this.isValidJSON(cleanedResponse)) {
        steps.push('Validated JSON after final trim');
        return this.buildResult<T>(true, JSON.parse(cleanedResponse), response, steps);
      }

      throw new Error('Unable to sanitize response to valid JSON');

    } catch (error) {
      this.logger.debug('Response sanitization failed', {
        steps,
        error: error.message,
        originalResponse: response
      });

      return this.buildResult<T>(false, null, response, steps, error.message);
    }
  }

  private buildResult<T>(
    success: boolean,
    data: T | null,
    original: string,
    steps: string[],
    error: string | null = null
  ): SanitizationResult<T> {
    return {
      success,
      data,
      error,
      originalResponse: original,
      sanitizationSteps: steps
    };
  }

  public isValidJSON(input: string): boolean {
    try {
      JSON.parse(input);
      return true;
    } catch {
      return false;
    }
  }
}
