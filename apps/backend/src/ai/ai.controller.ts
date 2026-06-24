import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('AI-Triage')
@UseGuards(AuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('analyze')
  @Roles(UserRole.DOCTOR, UserRole.MODERATOR, UserRole.ADMIN, UserRole.PATIENT)
  @ApiOperation({ summary: 'Analyze clinical symptoms and return category, severity, and risk assessment tags' })
  async analyze(@Body('text') text: string) {
    return this.aiService.analyzeQuery(text || '');
  }

  @Get('similar/:ticketId')
  @Roles(UserRole.DOCTOR, UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Search for vector-similar resolved medical tickets' })
  async getSimilar(@Param('ticketId') ticketId: string) {
    return this.aiService.getSimilarTickets(ticketId);
  }
}
