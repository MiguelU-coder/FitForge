import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SupportTicketStatus, SupportTicketPriority } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createTicket(userId: string, data: { subject: string; message: string; priority?: SupportTicketPriority; organizationId?: string }) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject: data.subject,
        message: data.message,
        priority: data.priority || SupportTicketPriority.MEDIUM,
        organizationId: data.organizationId,
      },
      include: {
        user: { select: { displayName: true, email: true } }
      }
    });
  }

  async findAllTickets() {
    return this.prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { displayName: true, email: true } },
        _count: { select: { replies: true } }
      }
    });
  }

  async findOneTicket(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { displayName: true, email: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { displayName: true, email: true } } }
        }
      }
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async replyToTicket(ticketId: string, userId: string, message: string) {
    const reply = await this.prisma.ticketReply.create({
      data: {
        ticketId,
        userId,
        message,
      },
    });

    // Update ticket status to IN_PROGRESS if it was OPEN
    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: SupportTicketStatus.IN_PROGRESS }
    });

    return reply;
  }

  async updateTicketStatus(id: string, status: SupportTicketStatus) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: { status }
    });
  }

  async createBroadcast(title: string, message: string, type: string = 'info') {
    return this.prisma.notification.create({
      data: {
        title,
        message,
        type,
        userId: null, // null means global
      }
    });
  }

  async getRecentStats() {
    const [total, open, resolved] = await Promise.all([
      this.prisma.supportTicket.count(),
      this.prisma.supportTicket.count({ where: { status: SupportTicketStatus.OPEN } }),
      this.prisma.supportTicket.count({ where: { status: SupportTicketStatus.RESOLVED } }),
    ]);

    return { total, open, resolved };
  }
}
