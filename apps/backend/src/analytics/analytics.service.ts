import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardAnalytics() {
    const totalTickets = await this.prisma.ticket.count();
    const resolvedTickets = await this.prisma.ticket.count({ where: { status: 'RESOLVED' } });
    const openTickets = await this.prisma.ticket.count({ where: { status: 'OPEN' } });
    const assignedTickets = await this.prisma.ticket.count({ where: { status: 'ASSIGNED' } });

    // Doctor workload metrics
    const doctorWorkloadRaw = await this.prisma.ticket.groupBy({
      by: ['doctorId'],
      _count: {
        id: true,
      },
      where: {
        status: { in: ['ASSIGNED', 'IN_REVIEW'] },
        doctorId: { not: null },
      },
    });

    const doctors = await this.prisma.doctor.findMany();
    const doctorWorkload = doctorWorkloadRaw.map(dw => {
      const doc = doctors.find(d => d.id === dw.doctorId);
      return {
        doctorName: doc ? doc.name : 'Unknown Doctor',
        activeTickets: dw._count.id,
      };
    });

    // Ticket category spread
    const categorySpreadRaw = await this.prisma.ticket.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });

    const categorySpread = categorySpreadRaw.map(cs => ({
      category: cs.category,
      count: cs._count.id,
    }));

    // Monthly ticket metrics (Mock trend analysis)
    const ticketTrends = [
      { month: 'Jan', tickets: 45, resolved: 38 },
      { month: 'Feb', tickets: 55, resolved: 48 },
      { month: 'Mar', tickets: 80, resolved: 65 },
      { month: 'Apr', tickets: 95, resolved: 85 },
      { month: 'May', tickets: 120, resolved: 100 },
      { month: 'Jun', tickets: 150, resolved: 130 },
    ];

    // User growth metrics
    const userGrowth = [
      { month: 'Jan', users: 200 },
      { month: 'Feb', users: 250 },
      { month: 'Mar', users: 320 },
      { month: 'Apr', users: 400 },
      { month: 'May', users: 510 },
      { month: 'Jun', users: 650 },
    ];

    return {
      cards: {
        totalTickets,
        resolvedTickets,
        openTickets,
        assignedTickets,
      },
      doctorWorkload,
      categorySpread,
      ticketTrends,
      userGrowth,
    };
  }
}
