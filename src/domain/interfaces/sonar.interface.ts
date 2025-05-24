import { SonarResponseDto } from '../../infrastructure/sonar/dto/sonar-response.dto';

export interface ISonarService {
  /**
   * Analyzes a claim using multiple methods in parallel
   * @param claim The claim to analyze
   * @returns Promise<SonarResponseDto> The combined analysis results
   */
  analyzeClaim(claim: string): Promise<SonarResponseDto>;
} 