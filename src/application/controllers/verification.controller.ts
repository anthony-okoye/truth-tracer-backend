import { Controller, Post, Get, Body, Param, Delete, Query } from '@nestjs/common';
import { VerificationService } from '../services/verification.service';
import { VerificationPrompt } from '../../domain/interfaces/chat-template.interface';
import { Verification } from '../../domain/models/verification.model';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post()
  async verifyClaim(@Body() prompt: VerificationPrompt): Promise<Verification> {
    return this.verificationService.verifyClaim(prompt);
  }

  @Get(':id')
  async getVerificationStatus(@Param('id') id: string): Promise<Verification> {
    return this.verificationService.getVerificationStatus(id);
  }

  @Delete(':id')
  async cancelVerification(@Param('id') id: string): Promise<void> {
    return this.verificationService.cancelVerification(id);
  }

  @Get()
  async getVerificationHistory(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('confidenceLevel') confidenceLevel?: string
  ): Promise<Verification[]> {
    return this.verificationService.getVerificationHistory({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
      confidenceLevel
    });
  }
} 