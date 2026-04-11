import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SupportService } from './support.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, SupportTicketStatus, SupportTicketPriority } from '@prisma/client';

@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('tickets')
  async createTicket(
    @Req() req: any,
    @Body()
    body: {
      subject: string;
      message: string;
      priority?: SupportTicketPriority;
      organizationId?: string;
    },
  ) {
    return this.supportService.createTicket(req.user.id, body);
  }

  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Get('tickets')
  @Roles(UserRole.GLOBAL_ADMIN)
  async findAllTickets() {
    return this.supportService.findAllTickets();
  }

  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Get('tickets/:id')
  async findOneTicket(@Param('id') id: string) {
    return this.supportService.findOneTicket(id);
  }

  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Post('tickets/:id/reply')
  async replyToTicket(@Param('id') id: string, @Req() req: any, @Body() body: { message: string }) {
    return this.supportService.replyToTicket(id, req.user.id, body.message);
  }

  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Put('tickets/:id/status')
  @Roles(UserRole.GLOBAL_ADMIN)
  async updateStatus(@Param('id') id: string, @Body() body: { status: SupportTicketStatus }) {
    return this.supportService.updateTicketStatus(id, body.status);
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('broadcast')
  @Roles(UserRole.GLOBAL_ADMIN)
  async createBroadcast(@Body() body: { title: string; message: string; type?: string }) {
    return this.supportService.createBroadcast(body.title, body.message, body.type);
  }

  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Get('stats')
  @Roles(UserRole.GLOBAL_ADMIN)
  async getStats() {
    return this.supportService.getRecentStats();
  }
}
