import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAction(
    userId: string,
    action: string,
    entityType: string,
    entityId?: string,
    payload?: any,
    ipAddress?: string,
    userAgent?: string,
    statusCode: number = 200,
    isError: boolean = false,
  ) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        payload,
        ipAddress,
        userAgent,
        statusCode,
        isError,
      },
    });
  }

  async findAllLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { displayName: true, email: true } },
      },
      take: 100, // Limit for performance
    });
  }
}
