import { SonarResponseDto } from '../../infrastructure/sonar/dto/sonar-response.dto';

export interface ISonarService {
  analyzeClaim(claim: string): Promise<SonarResponseDto>;
} 