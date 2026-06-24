import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { RegisterInput, LoginInput } from '@medidesk/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(input.password);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: input.role,
        },
      });

      if (input.role === 'PATIENT') {
        await tx.patient.create({
          data: {
            userId: user.id,
            name: input.name,
            age: input.age ?? 30,
            gender: input.gender ?? 'Unknown',
            medicalHistory: input.medicalHistory,
          },
        });
      } else if (input.role === 'DOCTOR') {
        await tx.doctor.create({
          data: {
            userId: user.id,
            name: input.name,
            specialization: input.specialization ?? 'General Medicine',
          },
        });
      } else if (input.role === 'MODERATOR') {
        await tx.moderator.create({
          data: {
            userId: user.id,
            name: input.name,
          },
        });
      }

      return { id: user.id, email: user.email, role: user.role };
    });
  }

  async login(input: LoginInput, ip?: string, device?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: {
        patient: true,
        doctor: true,
        moderator: true,
      },
    });

    if (!user || user.isSuspended) {
      throw new UnauthorizedException('Invalid credentials or account suspended');
    }

    const passwordValid = await argon2.verify(user.passwordHash, input.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    // Save refresh token session in DB
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        ip,
        device,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Write audit log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        resource: 'auth',
        ip,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.patient?.name || user.doctor?.name || user.moderator?.name || 'Admin',
      },
      accessToken,
      refreshToken,
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.session.deleteMany({
      where: { refreshToken },
    });
    return { success: true };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_SECRET || 'fallback_secret_key_medidesk_2026',
      });

      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session expired');
      }

      const newPayload = { sub: payload.sub, email: payload.email, role: payload.role };
      const accessToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: '15m',
      });

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
