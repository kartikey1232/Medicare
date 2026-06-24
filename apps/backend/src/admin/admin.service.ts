import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@medidesk/shared';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Users ───────────────────────────────────────────────
  async listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isSuspended: true,
        createdAt: true,
        patient: { select: { name: true } },
        doctor: { select: { name: true, specialization: true } },
        moderator: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async suspendUser(userId: string, requesterId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: requesterId,
        action: 'USER_SUSPENDED',
        resource: 'user',
        resourceId: userId,
        changes: JSON.stringify({ isSuspended: true }),
      },
    });

    return updated;
  }

  async reactivateUser(userId: string, requesterId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended: false },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: requesterId,
        action: 'USER_REACTIVATED',
        resource: 'user',
        resourceId: userId,
        changes: JSON.stringify({ isSuspended: false }),
      },
    });

    return updated;
  }

  async updateUserRole(userId: string, role: UserRole, requesterId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: requesterId,
        action: 'ROLE_CHANGED',
        resource: 'user',
        resourceId: userId,
        changes: JSON.stringify({ oldRole: user.role, newRole: role }),
      },
    });

    return updated;
  }

  // ─── Doctors ─────────────────────────────────────────────
  async listDoctors() {
    return this.prisma.doctor.findMany({
      include: {
        user: { select: { email: true, isSuspended: true } },
        _count: { select: { tickets: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  // ─── Audit Logs ──────────────────────────────────────────
  async getAuditLogs(limit = 100) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, role: true } },
      },
    });
  }
}
