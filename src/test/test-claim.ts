import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SONAR_SERVICE } from '../infrastructure/sonar/sonar.module';
import { ISonarService } from '../domain/interfaces/sonar.interface';
import { Logger } from '@nestjs/common';
import { ClaimVerificationService } from '../domain/services/claim-verification.service';

async function testClaim() {
  const logger = new Logger('TestClaim');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const sonarService = app.get<ISonarService>(SONAR_SERVICE);
    const claimVerificationService = app.get(ClaimVerificationService);

    // Test claim text
    const testClaim = "The Earth is flat and NASA has been hiding this fact for decades.";

    logger.log('Starting claim analysis...');
    logger.log(`Test claim: "${testClaim}"`);

    const result = await sonarService.analyzeClaim(testClaim);

    logger.log('\nAnalysis Results:');
    logger.log('----------------');

    // Fact Check Results
    if (result.factCheck) {
      logger.log('\nFact Check:');
      logger.log(`Verdict: ${result.factCheck.verdict}`);
      logger.log(`Explanation: ${result.factCheck.explanation}`);
      if (result.factCheck.sources?.length > 0) {
        logger.log('\nSources:');
        result.factCheck.sources.forEach((source, index) => {
          logger.log(`${index + 1}. ${source.title} (${source.url}) - ${source.reliability}`);
        });
      }
    }

    // Trust Chain Results
    if (result.trustChain) {
      logger.log('\nTrust Chain:');
      logger.log(`Has Trust Chain: ${result.trustChain.hasTrustChain}`);
      logger.log(`Confidence: ${result.trustChain.confidence}`);
      logger.log(`Explanation: ${result.trustChain.explanation}`);
      
      if (result.trustChain.sources?.length > 0) {
        logger.log('\nSources:');
        result.trustChain.sources.forEach((source, index) => {
          logger.log(`${index + 1}. ${source.name} (${source.url}) - Reliability: ${source.reliability}`);
        });
      }

      if (result.trustChain.gaps?.length > 0) {
        logger.log('\nGaps:');
        result.trustChain.gaps.forEach((gap, index) => {
          logger.log(`${index + 1}. ${gap}`);
        });
      }

      logger.log(`\nContext: ${result.trustChain.context}`);
    }

    // Socratic Reasoning Results
    if (result.socratic) {
      logger.log('\nSocratic Reasoning:');
      if (result.socratic.reasoningSteps?.length > 0) {
        logger.log('\nReasoning Steps:');
        result.socratic.reasoningSteps.forEach((step, index) => {
          logger.log(`\n${index + 1}. Question: ${step.question}`);
          logger.log(`   Analysis: ${step.analysis}`);
          logger.log(`   Evidence: ${step.evidence}`);
          logger.log(`   Implications: ${step.implications}`);
        });
      }

      if (result.socratic.conclusion) {
        logger.log('\nConclusion:');
        logger.log(`Logical Validity: ${result.socratic.conclusion.logicalValidity}`);
        logger.log(`Key Flaws: ${result.socratic.conclusion.keyFlaws}`);
        logger.log(`Strengths: ${result.socratic.conclusion.strengths}`);
        logger.log(`Recommendations: ${result.socratic.conclusion.recommendations}`);
      }
    }

    // Status Information
    logger.log('\nAnalysis Status:');
    logger.log(`Fact Check: ${result.status.factCheck}`);
    logger.log(`Trust Chain: ${result.status.trustChain}`);
    logger.log(`Socratic: ${result.status.socratic}`);
    logger.log(`Timestamp: ${result.status.timestamp}`);

  } catch (error) {
    logger.error('Error during claim analysis:', error);
  } finally {
    await app.close();
  }
}

// Run the test
testClaim().catch(console.error); 