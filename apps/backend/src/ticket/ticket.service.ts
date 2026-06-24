import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateTicketInput, TicketStatusType, TicketPriorityType, MedicalCategoryType } from '@medidesk/shared';
import { UserRole } from '@medidesk/shared';

@Injectable()
export class TicketService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async createTicket(userId: string, input: CreateTicketInput) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
    });
    if (!patient) {
      throw new NotFoundException('Patient record not found');
    }

    // Call AI Service to auto-analyze description
    const aiAnalysis = await this.aiService.analyzeQuery(input.description);

    const ticketNumber = `MD-${Math.floor(100000 + Math.random() * 900000)}`;

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          ticketNumber,
          title: input.title,
          description: input.description,
          category: input.category,
          status: 'OPEN',
          priority: 'MEDIUM',
          severity: aiAnalysis.predictedSeverity as any,
          patientId: patient.id,
          attachments: {
            create: input.attachments?.map(att => ({
              url: att.url,
              filename: att.filename,
              mimetype: att.mimetype,
              size: att.size,
              isVirusScanned: true,
              scanResult: 'SAFE',
            })) || [],
          },
        },
      });

      // Save AI analysis results
      await tx.aiPrediction.create({
        data: {
          ticketId: ticket.id,
          extractedSymptoms: JSON.stringify(aiAnalysis.extractedSymptoms),
          predictedCategory: aiAnalysis.predictedCategory,
          predictedSeverity: aiAnalysis.predictedSeverity,
          suggestedResponse: aiAnalysis.suggestedResponse,
        },
      });

      // Log ticket creation in history
      await tx.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          changedBy: userId,
          action: 'TICKET_CREATED',
          details: JSON.stringify({
            message: 'Ticket raised by patient',
            aiTriageSeverity: aiAnalysis.predictedSeverity,
            aiTriageCategory: aiAnalysis.predictedCategory,
          }),
        },
      });

      // Index tags
      for (const symptom of aiAnalysis.extractedSymptoms) {
        await tx.ticketTag.create({
          data: {
            ticketId: ticket.id,
            tag: symptom,
          },
        }).catch(() => {}); // ignore duplicates
      }

      return ticket;
    });
  }

  async getTickets(filters: {
    status?: TicketStatusType;
    doctorId?: string;
    moderatorId?: string;
    patientId?: string;
    category?: MedicalCategoryType;
    severity?: TicketPriorityType;
  }) {
    return this.prisma.ticket.findMany({
      where: {
        status: filters.status as any,
        doctorId: filters.doctorId,
        moderatorId: filters.moderatorId,
        patientId: filters.patientId,
        category: filters.category as any,
        severity: filters.severity as any,
      },
      include: {
        patient: true,
        doctor: true,
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTicketById(id: string, requesterRole: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        attachments: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
        doctorNotes: {
          orderBy: { createdAt: 'desc' },
        },
        aiPrediction: true,
        tags: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Deserialize extractedSymptoms in aiPrediction if present
    if (ticket.aiPrediction) {
      const prediction = ticket.aiPrediction as any;
      try {
        prediction.extractedSymptoms = JSON.parse(prediction.extractedSymptoms);
      } catch {
        prediction.extractedSymptoms = prediction.extractedSymptoms ? prediction.extractedSymptoms.split(',') : [];
      }
    }

    // Hide clinical doctorNotes and raw AI drafts if the patient requests
    if (requesterRole === UserRole.PATIENT) {
      ticket.doctorNotes = [];
      if (ticket.aiPrediction) {
        ticket.aiPrediction.suggestedResponse = 'Hidden (Requires clinical evaluation)';
      }
    }

    return ticket;
  }

  async assignTicket(ticketId: string, doctorId: string, moderatorUserId: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const moderator = await this.prisma.moderator.findUnique({ where: { userId: moderatorUserId } });
    const moderatorId = moderator?.id || null;

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          doctorId,
          moderatorId,
          status: 'ASSIGNED',
        },
      });

      await tx.ticketHistory.create({
        data: {
          ticketId,
          changedBy: moderatorUserId,
          action: 'ASSIGNED_DOCTOR',
          details: JSON.stringify({ doctorId, doctorName: doctor.name }),
        },
      });

      return ticket;
    });
  }

  async updateStatus(ticketId: string, status: TicketStatusType, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const resolvedAt = status === 'RESOLVED' ? new Date() : null;

      const ticket = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: status as any,
          ...(resolvedAt ? { resolvedAt } : {}),
        },
      });

      await tx.ticketHistory.create({
        data: {
          ticketId,
          changedBy: userId,
          action: 'STATUS_CHANGE',
          details: JSON.stringify({ status }),
        },
      });

      return ticket;
    });
  }

  async updateSeverity(ticketId: string, severity: TicketPriorityType, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.update({
        where: { id: ticketId },
        data: { severity: severity as any },
      });

      await tx.ticketHistory.create({
        data: {
          ticketId,
          changedBy: userId,
          action: 'SEVERITY_CHANGE',
          details: JSON.stringify({ severity }),
        },
      });

      return ticket;
    });
  }

  async addDoctorNote(ticketId: string, doctorUserId: string, note: string, isPrivate: boolean) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: doctorUserId },
    });
    if (!doctor) throw new NotFoundException('Doctor record not found');

    return this.prisma.doctorNote.create({
      data: {
        ticketId,
        doctorId: doctor.id,
        note,
        isPrivate,
      },
    });
  }

  async mergeTickets(primaryTicketId: string, duplicateTicketId: string, moderatorUserId: string) {
    if (primaryTicketId === duplicateTicketId) {
      throw new BadRequestException('Cannot merge a ticket into itself');
    }

    return this.prisma.$transaction(async (tx) => {
      const primary = await tx.ticket.findUnique({ where: { id: primaryTicketId } });
      const duplicate = await tx.ticket.findUnique({ where: { id: duplicateTicketId } });

      if (!primary || !duplicate) {
        throw new NotFoundException('One or both tickets do not exist');
      }

      // Close duplicate ticket
      await tx.ticket.update({
        where: { id: duplicateTicketId },
        data: {
          status: 'CLOSED',
        },
      });

      // Log link inside both histories
      await tx.ticketHistory.create({
        data: {
          ticketId: primaryTicketId,
          changedBy: moderatorUserId,
          action: 'TICKET_MERGED_PRIMARY',
          details: JSON.stringify({
            mergedDuplicateTicketId: duplicateTicketId,
            mergedTicketNumber: duplicate.ticketNumber,
          }),
        },
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: duplicateTicketId,
          changedBy: moderatorUserId,
          action: 'TICKET_MERGED_DUPLICATE',
          details: JSON.stringify({
            mergedIntoPrimaryTicketId: primaryTicketId,
            primaryTicketNumber: primary.ticketNumber,
          }),
        },
      });

      return primary;
    });
  }

  async addMessage(ticketId: string, senderId: string, message: string, voiceUrl?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: senderId } });
    if (!user) throw new NotFoundException('Sender not found');

    return this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId,
        senderRole: user.role,
        message,
        voiceUrl,
      },
    });
  }
}
