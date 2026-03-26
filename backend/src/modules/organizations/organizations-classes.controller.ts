import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../database/prisma.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationClassesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id/classes')
  async getClasses(
    @Param('id') organizationId: string,
    @Request() req: any,
  ) {
    const classes = await this.prisma.gymClass.findMany({
      where: { organizationId },
      include: {
        trainer: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        schedules: true,
        _count: {
          select: { schedules: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: classes.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        capacity: c.capacity,
        durationMinutes: c.durationMinutes,
        isActive: c.isActive,
        trainer: c.trainer,
        schedulesCount: c._count.schedules,
        schedules: c.schedules,
        createdAt: c.createdAt,
      })),
    };
  }

  @Get(':id/classes/:classId')
  async getClassDetails(
    @Param('id') organizationId: string,
    @Param('classId') classId: string,
    @Request() req: any,
  ) {
    const gymClass = await this.prisma.gymClass.findFirst({
      where: { id: classId, organizationId },
      include: {
        trainer: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        schedules: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    if (!gymClass) {
      return { success: false, message: 'Class not found' };
    }

    return {
      success: true,
      data: gymClass,
    };
  }

  @Post(':id/classes')
  async createClass(
    @Param('id') organizationId: string,
    @Body()
    body: {
      name: string;
      description?: string;
      trainerId?: string;
      capacity?: number;
      durationMinutes?: number;
      schedules?: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        room?: string;
      }[];
    },
    @Request() req: any,
  ) {
    const gymClass = await this.prisma.gymClass.create({
      data: {
        organizationId,
        name: body.name,
        description: body.description,
        trainerId: body.trainerId,
        capacity: body.capacity || 20,
        durationMinutes: body.durationMinutes || 60,
      },
    });

    // Create schedules if provided
    if (body.schedules && body.schedules.length > 0) {
      await this.prisma.classSchedule.createMany({
        data: body.schedules.map((s) => ({
          classId: gymClass.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room,
        })),
      });
    }

    return {
      success: true,
      data: gymClass,
    };
  }

  @Patch(':id/classes/:classId')
  async updateClass(
    @Param('id') organizationId: string,
    @Param('classId') classId: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      trainerId?: string;
      capacity?: number;
      durationMinutes?: number;
      isActive?: boolean;
    },
    @Request() req: any,
  ) {
    const gymClass = await this.prisma.gymClass.update({
      where: { id: classId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.trainerId && { trainerId: body.trainerId }),
        ...(body.capacity && { capacity: body.capacity }),
        ...(body.durationMinutes && { durationMinutes: body.durationMinutes }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return {
      success: true,
      data: gymClass,
    };
  }

  @Delete(':id/classes/:classId')
  async deleteClass(
    @Param('id') organizationId: string,
    @Param('classId') classId: string,
    @Request() req: any,
  ) {
    await this.prisma.gymClass.update({
      where: { id: classId },
      data: { isActive: false },
    });

    return { success: true };
  }

  @Post(':id/classes/:classId/schedules')
  async addSchedule(
    @Param('id') organizationId: string,
    @Param('classId') classId: string,
    @Body()
    body: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      room?: string;
    },
    @Request() req: any,
  ) {
    const schedule = await this.prisma.classSchedule.create({
      data: {
        classId,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        room: body.room,
      },
    });

    return {
      success: true,
      data: schedule,
    };
  }

  @Delete(':id/classes/:classId/schedules/:scheduleId')
  async removeSchedule(
    @Param('id') organizationId: string,
    @Param('classId') classId: string,
    @Param('scheduleId') scheduleId: string,
    @Request() req: any,
  ) {
    await this.prisma.classSchedule.delete({
      where: { id: scheduleId },
    });

    return { success: true };
  }

  @Get(':id/trainers')
  async getTrainers(
    @Param('id') organizationId: string,
    @Request() req: any,
  ) {
    const trainers = await this.prisma.userOrganization.findMany({
      where: {
        organizationId,
        role: 'TRAINER',
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            phoneNumber: true,
          },
        },
      },
    });

    return {
      success: true,
      data: trainers.map((t) => ({
        id: t.user.id,
        displayName: t.user.displayName,
        email: t.user.email,
        avatarUrl: t.user.avatarUrl,
        phoneNumber: t.user.phoneNumber,
      })),
    };
  }
}