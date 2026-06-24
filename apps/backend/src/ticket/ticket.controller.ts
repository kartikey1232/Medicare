import { Controller, Post, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { CreateTicketSchema, CreateTicketInput, TicketStatusType, TicketPriorityType, MedicalCategoryType, UserRole } from '@medidesk/shared';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Tickets')
@UseGuards(AuthGuard, RolesGuard)
@Controller('tickets')
export class TicketController {
  constructor(private ticketService: TicketService) {}

  @Post()
  @Roles(UserRole.PATIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new medical ticket (Patient portal)' })
  async create(@Body() body: any, @CurrentUser() user: any) {
    const parsed = CreateTicketSchema.parse(body) as CreateTicketInput;
    return this.ticketService.createTicket(user.id, parsed);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({ summary: 'List tickets with dynamic query filters' })
  async getTickets(
    @Query('status') status: TicketStatusType,
    @Query('doctorId') doctorId: string,
    @Query('patientId') patientId: string,
    @Query('category') category: MedicalCategoryType,
    @Query('severity') severity: TicketPriorityType,
    @CurrentUser() user: any,
  ) {
    // Patients can only see their own tickets, Doctors can only see their assigned tickets
    const queryFilters: any = { status, doctorId, category, severity };
    if (user.role === UserRole.PATIENT) {
      queryFilters.patientId = user.patient?.id;
    } else if (user.role === UserRole.DOCTOR) {
      queryFilters.doctorId = user.doctor?.id;
      queryFilters.patientId = patientId;
    } else {
      queryFilters.patientId = patientId;
    }
    return this.ticketService.getTickets(queryFilters);
  }

  @Get('doctors')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'List all registered doctors for assignment' })
  async listDoctors() {
    return this.ticketService.listDoctors();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve comprehensive ticket details (Chat, History, AI Predictions)' })
  async getTicket(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ticketService.getTicketById(id, user.role);
  }

  @Put(':id/assign')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign a ticket to a licensed specialist' })
  async assign(
    @Param('id') id: string,
    @Body('doctorId') doctorId: string,
    @CurrentUser() user: any,
  ) {
    return this.ticketService.assignTicket(id, doctorId, user.id);
  }

  @Put(':id/status')
  @Roles(UserRole.MODERATOR, UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update ticket status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TicketStatusType,
    @CurrentUser() user: any,
  ) {
    return this.ticketService.updateStatus(id, status, user.id);
  }

  @Put(':id/severity')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Adjust ticket triage severity rating' })
  async updateSeverity(
    @Param('id') id: string,
    @Body('severity') severity: TicketPriorityType,
    @CurrentUser() user: any,
  ) {
    return this.ticketService.updateSeverity(id, severity, user.id);
  }

  @Post(':id/notes')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a private/clinical doctor note to a ticket' })
  async addNote(
    @Param('id') id: string,
    @Body('note') note: string,
    @Body('isPrivate') isPrivate: boolean,
    @CurrentUser() user: any,
  ) {
    return this.ticketService.addDoctorNote(id, user.id, note, isPrivate);
  }

  @Post('merge')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Merge a duplicate ticket into a primary case file' })
  async merge(
    @Body('primaryTicketId') primaryTicketId: string,
    @Body('duplicateTicketId') duplicateTicketId: string,
    @CurrentUser() user: any,
  ) {
    return this.ticketService.mergeTickets(primaryTicketId, duplicateTicketId, user.id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add a message to the ticket conversation' })
  async addMessage(
    @Param('id') id: string,
    @Body('message') message: string,
    @Body('voiceUrl') voiceUrl: string,
    @CurrentUser() user: any,
  ) {
    return this.ticketService.addMessage(id, user.id, message, voiceUrl);
  }
}
