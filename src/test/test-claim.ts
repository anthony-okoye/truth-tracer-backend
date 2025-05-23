import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SonarClient } from '../infrastructure/sonar/sonar.client';
import { Logger } from '@nestjs/common';

async function testClaim() {
  const logger = new Logger('TestClaim');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const sonarClient = app.get(SonarClient);

    // Test claim text
    const testClaim = "The Earth is flat and NASA has been hiding this fact for decades.";

    logger.log('Starting claim analysis...');
    logger.log(`Test claim: "${testClaim}"`);

    const result = await sonarClient.verifyClaim(testClaim);

    logger.log('\nAnalysis Results:');
    logger.log('----------------');
    logger.log(`Verified: ${result.isVerified}`);
    logger.log(`Confidence Score: ${result.confidenceScore}`);
    logger.log('\nExplanation:');
    logger.log(result.explanation);
    
    if (result.sources && result.sources.length > 0) {
      logger.log('\nSources:');
      result.sources.forEach((source, index) => {
        logger.log(`${index + 1}. ${source}`);
      });
    }

  } catch (error) {
    logger.error('Error during claim analysis:', error);
  } finally {
    await app.close();
  }
}

// Run the test
testClaim().catch(console.error); 