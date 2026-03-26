// src/modules/programs/programs.module.ts
import {
  Module,
  Injectable,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { z } from 'zod';

// ── DTOs ──────────────────────────────────────────────────────────────────────

const CreateProgramSchema = z.object({
  name: z.string().min(1).max(150),
  goal: z.string().max(100).optional(),
  weeks: z.number().int().min(1).max(52).optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
});
type CreateProgramDto = z.infer<typeof CreateProgramSchema>;

const UpdateProgramSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  goal: z.string().max(100).optional(),
  weeks: z.number().int().min(1).max(52).optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  isActive: z.boolean().optional(),
  startedAt: z.string().optional(),
});
type UpdateProgramDto = z.infer<typeof UpdateProgramSchema>;

const CreateRoutineSchema = z.object({
  programId: z.string().uuid(),
  name: z.string().min(1).max(150),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
});
type CreateRoutineDto = z.infer<typeof CreateRoutineSchema>;

const AddExerciseToRoutineSchema = z.object({
  routineId: z.string().uuid(),
  exerciseId: z.string().min(1),
  sortOrder: z.number().int().min(0).default(0),
  targetSets: z.number().int().min(1).max(20).optional(),
  targetReps: z.number().int().min(1).max(100).optional(),
  targetRir: z.number().int().min(0).max(10).optional(),
  restSeconds: z.number().int().min(0).max(600).optional(),
  notes: z.string().max(500).optional(),
});
type AddExerciseToRoutineDto = z.infer<typeof AddExerciseToRoutineSchema>;

const UpdateRoutineItemSchema = z.object({
  targetSets: z.number().int().min(1).max(20).optional(),
  targetReps: z.number().int().min(1).max(100).optional(),
  targetRir: z.number().int().min(0).max(10).optional(),
  restSeconds: z.number().int().min(0).max(600).optional(),
  sortOrder: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
});
type UpdateRoutineItemDto = z.infer<typeof UpdateRoutineItemSchema>;

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ProgramsService {
  private readonly logger = new Logger(ProgramsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Programs ────────────────────────────────────────────────────────────────

  async createProgram(userId: string, dto: CreateProgramDto, organizationId?: string) {
    return this.prisma.program.create({
      data: {
        userId,
        organizationId,
        name: dto.name,
        goal: dto.goal,
        weeks: dto.weeks,
        daysPerWeek: dto.daysPerWeek,
      },
    });
  }

  async getPrograms(userId: string, includeActive: boolean = true, organizationId?: string) {
    const where: any = organizationId ? { organizationId } : { userId };
    if (!includeActive && !organizationId) {
      delete where.isActive;
    }

    return this.prisma.program.findMany({
      where,
      include: {
        routines: {
          orderBy: { sortOrder: 'asc' },
          include: {
            routineItems: {
              orderBy: { sortOrder: 'asc' },
              include: {
                exercise: {
                  select: { id: true, name: true, primaryMuscles: true, equipment: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProgram(userId: string, programId: string, organizationId?: string) {
    const where: any = organizationId 
      ? { id: programId, organizationId } 
      : { id: programId, userId };

    const program = await this.prisma.program.findFirst({
      where,
      include: {
        routines: {
          orderBy: { sortOrder: 'asc' },
          include: {
            routineItems: {
              orderBy: { sortOrder: 'asc' },
              include: {
                exercise: {
                  select: { id: true, name: true, primaryMuscles: true, equipment: true },
                },
              },
            },
          },
        },
      },
    });

    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  async updateProgram(userId: string, programId: string, dto: UpdateProgramDto) {
    const program = await this.prisma.program.findFirst({
      where: { id: programId, userId },
    });

    if (!program) throw new NotFoundException('Program not found');

    return this.prisma.program.update({
      where: { id: programId },
      data: {
        ...dto,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined,
      },
    });
  }

  async deleteProgram(userId: string, programId: string) {
    const program = await this.prisma.program.findFirst({
      where: { id: programId, userId },
    });

    if (!program) throw new NotFoundException('Program not found');

    await this.prisma.program.delete({ where: { id: programId } });
    return { deleted: true };
  }

  async activateProgram(userId: string, programId: string) {
    // Deactivate all other programs first
    await this.prisma.program.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Activate the selected program
    return this.prisma.program.update({
      where: { id: programId },
      data: { isActive: true, startedAt: new Date() },
    });
  }

  // ── Routines ───────────────────────────────────────────────────────────────

  async createRoutine(userId: string, dto: CreateRoutineDto) {
    // Verify program belongs to user
    const program = await this.prisma.program.findFirst({
      where: { id: dto.programId, userId },
    });

    if (!program) throw new NotFoundException('Program not found');

    // Get max sort order
    const maxOrder = await this.prisma.routine.findFirst({
      where: { programId: dto.programId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return this.prisma.routine.create({
      data: {
        programId: dto.programId,
        userId,
        name: dto.name,
        dayOfWeek: dto.dayOfWeek,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
    });
  }

  async getRoutines(userId: string, programId: string) {
    return this.prisma.routine.findMany({
      where: { programId, userId },
      orderBy: { sortOrder: 'asc' },
      include: {
        routineItems: {
          orderBy: { sortOrder: 'asc' },
          include: {
            exercise: {
              select: { id: true, name: true, primaryMuscles: true, equipment: true },
            },
          },
        },
      },
    });
  }

  async deleteRoutine(userId: string, routineId: string) {
    const routine = await this.prisma.routine.findFirst({
      where: { id: routineId, userId },
    });

    if (!routine) throw new NotFoundException('Routine not found');

    await this.prisma.routine.delete({ where: { id: routineId } });
    return { deleted: true };
  }

  // ── Routine Items ─────────────────────────────────────────────────────────

  async addExerciseToRoutine(userId: string, dto: AddExerciseToRoutineDto) {
    // Verify routine belongs to user
    const routine = await this.prisma.routine.findFirst({
      where: { id: dto.routineId, userId },
    });

    if (!routine) throw new NotFoundException('Routine not found');

    // Get max sort order
    const maxOrder = await this.prisma.routineItem.findFirst({
      where: { routineId: dto.routineId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return this.prisma.routineItem.create({
      data: {
        routineId: dto.routineId,
        exerciseId: dto.exerciseId,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
        targetSets: dto.targetSets,
        targetReps: dto.targetReps,
        targetRir: dto.targetRir,
        restSeconds: dto.restSeconds,
        notes: dto.notes,
      },
      include: {
        exercise: {
          select: { id: true, name: true, primaryMuscles: true, equipment: true },
        },
      },
    });
  }

  async updateRoutineItem(userId: string, itemId: string, dto: UpdateRoutineItemDto) {
    const item = await this.prisma.routineItem.findFirst({
      where: {
        id: itemId,
        routine: { userId },
      },
    });

    if (!item) throw new NotFoundException('Routine item not found');

    return this.prisma.routineItem.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async removeExerciseFromRoutine(userId: string, itemId: string) {
    const item = await this.prisma.routineItem.findFirst({
      where: {
        id: itemId,
        routine: { userId },
      },
    });

    if (!item) throw new NotFoundException('Routine item not found');

    await this.prisma.routineItem.delete({ where: { id: itemId } });
    return { deleted: true };
  }
}

// ── Controller ────────────────────────────────────────────────────────────────

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  // Programs
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createProgram(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateProgramSchema)) dto: CreateProgramDto,
  ) {
    return this.programsService.createProgram(user.id, dto);
  }

  @Get()
  getPrograms(
    @CurrentUser() user: AuthUser, 
    @Query('includeActive') includeActive?: string,
    @Query('organizationId') organizationId?: string
  ) {
    // If organizationId is provided, check if user belongs to it
    const targetOrgId = organizationId;
    if (targetOrgId && !user.organizations.some(o => o.id === targetOrgId)) {
      throw new NotFoundException('Organization not found or access denied');
    }

    return this.programsService.getPrograms(user.id, includeActive !== 'false', targetOrgId);
  }

  @Get(':id')
  getProgram(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.programsService.getProgram(user.id, id);
  }

  @Patch(':id')
  updateProgram(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateProgramSchema)) dto: UpdateProgramDto,
  ) {
    return this.programsService.updateProgram(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProgram(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.programsService.deleteProgram(user.id, id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  activateProgram(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.programsService.activateProgram(user.id, id);
  }

  // Routines
  @Post('routines')
  @HttpCode(HttpStatus.CREATED)
  createRoutine(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateRoutineSchema)) dto: CreateRoutineDto,
  ) {
    return this.programsService.createRoutine(user.id, dto);
  }

  @Get('routines/:programId')
  getRoutines(@CurrentUser() user: AuthUser, @Param('programId', ParseUUIDPipe) programId: string) {
    return this.programsService.getRoutines(user.id, programId);
  }

  @Delete('routines/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRoutine(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.programsService.deleteRoutine(user.id, id);
  }

  // Routine Items
  @Post('routine-items')
  @HttpCode(HttpStatus.CREATED)
  addExerciseToRoutine(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(AddExerciseToRoutineSchema)) dto: AddExerciseToRoutineDto,
  ) {
    return this.programsService.addExerciseToRoutine(user.id, dto);
  }

  @Patch('routine-items/:id')
  updateRoutineItem(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateRoutineItemSchema)) dto: UpdateRoutineItemDto,
  ) {
    return this.programsService.updateRoutineItem(user.id, id, dto);
  }

  @Delete('routine-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeExerciseFromRoutine(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.programsService.removeExerciseFromRoutine(user.id, id);
  }
}

// ── Module ────────────────────────────────────────────────────────────────────

@Module({
  controllers: [ProgramsController],
  providers: [ProgramsService],
  exports: [ProgramsService],
})
export class ProgramsModule {}
