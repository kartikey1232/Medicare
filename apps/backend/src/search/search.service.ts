import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Global full-text search across tickets, patients, and doctors.
   * In production, replace Prisma `contains` queries with Elasticsearch
   * multi-match queries against the `medidesk_tickets` and `medidesk_patients`
   * indices for sub-second performance at scale.
   */
  async globalSearch(query: string) {
    const q = query.trim();
    if (!q) return { tickets: [], patients: [], doctors: [] };

    const [tickets, patients, doctors] = await Promise.all([
      // Search tickets by title, description, ticket number, tags
      this.prisma.ticket.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { ticketNumber: { contains: q, mode: 'insensitive' } },
            { tags: { some: { tag: { contains: q, mode: 'insensitive' } } } },
          ],
        },
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          status: true,
          severity: true,
          category: true,
          patient: { select: { name: true } },
        },
        take: 10,
      }),

      // Search patients by name
      this.prisma.patient.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        select: { id: true, name: true, age: true, gender: true },
        take: 5,
      }),

      // Search doctors by name or specialization
      this.prisma.doctor.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { specialization: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, specialization: true },
        take: 5,
      }),
    ]);

    return { tickets, patients, doctors };
  }

  /**
   * Index a ticket into Elasticsearch (stub — wires to real ES client
   * when ELASTICSEARCH_NODE env var is set)
   */
  async indexTicket(ticket: any) {
    const esNode = process.env.ELASTICSEARCH_NODE;
    if (!esNode) return; // Gracefully skip if ES not configured

    try {
      await fetch(`${esNode}/medidesk_tickets/_doc/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          status: ticket.status,
          severity: ticket.severity,
          createdAt: ticket.createdAt,
        }),
      });
    } catch (err) {
      // Non-fatal — log and continue
      console.error('[Search] ES indexing failed:', err);
    }
  }
}
