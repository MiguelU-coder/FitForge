// src/modules/exercises/exercises.module.ts
// Ejercicios globales + custom del usuario, con búsqueda y filtros

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
  Res,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { HttpService, HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../shared/redis.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { z } from 'zod';
import * as sharp from 'sharp';
import { Prisma } from '@prisma/client';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export const CreateExerciseSchema = z.object({
  name: z.string().min(2).max(150).trim(),
  primaryMuscles: z
    .array(
      z.enum([
        'CHEST',
        'BACK',
        'SHOULDERS',
        'BICEPS',
        'TRICEPS',
        'FOREARMS',
        'QUADS',
        'HAMSTRINGS',
        'GLUTES',
        'CALVES',
        'ABS',
        'OBLIQUES',
        'TRAPS',
        'LATS',
        'FULL_BODY',
      ]),
    )
    .min(1),
  secondaryMuscles: z
    .array(
      z.enum([
        'CHEST',
        'BACK',
        'SHOULDERS',
        'BICEPS',
        'TRICEPS',
        'FOREARMS',
        'QUADS',
        'HAMSTRINGS',
        'GLUTES',
        'CALVES',
        'ABS',
        'OBLIQUES',
        'TRAPS',
        'LATS',
        'FULL_BODY',
      ]),
    )
    .default([]),
  equipment: z
    .enum([
      'BARBELL',
      'DUMBBELL',
      'CABLE',
      'MACHINE',
      'BODYWEIGHT',
      'KETTLEBELL',
      'RESISTANCE_BAND',
      'SMITH_MACHINE',
      'OTHER',
    ])
    .optional(),
  movementPattern: z
    .enum([
      'PUSH_HORIZONTAL',
      'PUSH_VERTICAL',
      'PULL_HORIZONTAL',
      'PULL_VERTICAL',
      'HINGE',
      'SQUAT',
      'LUNGE',
      'CARRY',
      'CORE',
      'CARDIO',
    ])
    .optional(),
  isUnilateral: z.boolean().default(false),
  instructions: z.string().max(2000).optional(),
  videoUrl: z.string().url().optional(),
});
export type CreateExerciseDto = z.infer<typeof CreateExerciseSchema>;

export const ExerciseFiltersSchema = z.object({
  search: z.string().max(100).optional(),
  muscle: z.string().optional(),
  equipment: z.string().optional(),
  isCustom: z.enum(['true', 'false']).optional(),
  useExternal: z.enum(['true', 'false']).optional(),
  organizationId: z.string().uuid().optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(200)).default('20'),
});
export type ExerciseFiltersDto = z.infer<typeof ExerciseFiltersSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const EXERCISE_DB_MUSCLE_MAP: Record<string, string> = {
  abs: 'ABS',
  adductors: 'QUADS',
  biceps: 'BICEPS',
  calves: 'CALVES',
  'cardiovascular system': 'FULL_BODY',
  delts: 'SHOULDERS',
  forearms: 'FOREARMS',
  glutes: 'GLUTES',
  hamstrings: 'HAMSTRINGS',
  lats: 'LATS',
  'levator scapulae': 'TRAPS',
  pectorals: 'CHEST',
  quads: 'QUADS',
  'serratus anterior': 'CHEST',
  spine: 'BACK',
  traps: 'TRAPS',
  triceps: 'TRICEPS',
  'upper back': 'BACK',
};

const EXERCISE_DB_EQUIPMENT_MAP: Record<string, string> = {
  barbell: 'BARBELL',
  dumbbell: 'DUMBBELL',
  cable: 'CABLE',
  'lever machine': 'MACHINE',
  'body weight': 'BODYWEIGHT',
  kettlebell: 'KETTLEBELL',
  'resistance band': 'RESISTANCE_BAND',
  'smith machine': 'SMITH_MACHINE',
};

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ExercisesService {
  private readonly CACHE_TTL = 24 * 60 * 60; // 24h

  private curatedExercises: any[] | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private getCuratedExercises(): any[] {
    if (this.curatedExercises) return this.curatedExercises;

    const fs = require('fs');
    const path = require('path');
    try {
      const filePath = path.join(
        process.cwd(),
        'src',
        'common',
        'constants',
        'curated_exercises.json',
      );
      const fileContent = fs.readFileSync(filePath, 'utf8');
      this.curatedExercises = JSON.parse(fileContent);
      return this.curatedExercises || [];
    } catch (e) {
      console.error('Curated exercises json not found', e);
      return [];
    }
  }

  async findAll(userId: string, filters: ExerciseFiltersDto): Promise<unknown> {
    const { search, muscle, equipment, isCustom, useExternal, page, limit } = filters;

    // ── EXTERNAL SEARCH (ExerciseDB) ──────────────────────────────────────────
    if (useExternal === 'true') {
      return this.findAllExternal(filters);
    }

    // ── LOCAL SEARCH (Prisma) ──────────────────────────────────────────────────
    const skip = (page - 1) * limit;
    const cacheKey = `exercises:list:${userId}:${JSON.stringify(filters)}`;
    const isGlobalSearch = !search && !muscle && !equipment && !isCustom;

    if (isGlobalSearch) {
      const cached = await this.redis.getJson(cacheKey);
      if (cached) return cached;
    }

    // Construir where clause
    const where: any = {
      isActive: true,
      OR: [
        { createdBy: null, organizationId: null }, // Globales
        { createdBy: userId }, // Tuyos
      ],
    };

    if (filters.organizationId) {
      where.OR.push({ organizationId: filters.organizationId });
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (muscle) {
      where.primaryMuscles = { has: muscle as never };
    }
    if (equipment) {
      where.equipment = equipment as never;
    }
    if (isCustom !== undefined) {
      where.isCustom = isCustom === 'true';
      if (isCustom === 'true') {
        where.createdBy = userId;
      }
    }

    const [exercises, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isCustom: 'asc' }, // Globales primero
          { name: 'asc' },
        ],
        select: {
          id: true,
          name: true,
          primaryMuscles: true,
          secondaryMuscles: true,
          equipment: true,
          movementPattern: true,
          isUnilateral: true,
          isCustom: true,
          imageUrl: true,
        },
      }),
      this.prisma.exercise.count({ where }),
    ]);

    const result = {
      exercises,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    if (isGlobalSearch) {
      await this.redis.setJson(cacheKey, result, this.CACHE_TTL);
    }

    return result;
  }

  async findAllExternal(filters: ExerciseFiltersDto): Promise<unknown> {
    const { search, muscle, equipment } = filters;

    // Usar caché en memoria
    const curatedData = this.getCuratedExercises();

    // Filtrar in-memory (rápido para 100 items)
    let filtered = curatedData;

    if (search) {
      const s = search.toLowerCase().trim();
      filtered = filtered.filter(
        (ex) =>
          (ex.fitforgeName && ex.fitforgeName.toLowerCase().includes(s)) ||
          (ex.name && ex.name.toLowerCase().includes(s)),
      );
    }

    if (muscle) {
      filtered = filtered.filter((ex) => ex.fitforgeMuscle === muscle);
    }

    if (equipment) {
      const reverseEqMap: Record<string, string> = Object.entries(EXERCISE_DB_EQUIPMENT_MAP).reduce<
        Record<string, string>
      >((acc, [k, v]) => {
        acc[v] = k;
        return acc;
      }, {});
      const eqTarget = reverseEqMap[equipment] || equipment.toLowerCase();

      filtered = filtered.filter((ex) => {
        const equipmentsArray = ex.equipments || (ex.equipment ? [ex.equipment] : []);
        return equipmentsArray.some((eq: string) => eq.toLowerCase() === eqTarget);
      });
    }

    // Mapearlo a nuestro DTO estándar de Frontend
    const exercises = filtered.map((ex) => {
      const exerciseId = ex.exerciseId || ex.id;
      const primaryMuscleStr =
        ex.targetMuscles && ex.targetMuscles.length > 0 ? ex.targetMuscles[0] : ex.target;
      const equipmentStr =
        ex.equipments && ex.equipments.length > 0 ? ex.equipments[0] : ex.equipment;

      return {
        id: `ext_${exerciseId}`,
        name:
          ex.fitforgeName ||
          ex.name
            .split(' ')
            .map((w: string) => w[0].toUpperCase() + w.substring(1))
            .join(' '),
        primaryMuscles: [
          ex.fitforgeMuscle || EXERCISE_DB_MUSCLE_MAP[primaryMuscleStr] || 'FULL_BODY',
        ],
        secondaryMuscles:
          ex.secondaryMuscles?.map((m: string) => EXERCISE_DB_MUSCLE_MAP[m] || 'FULL_BODY') || [],
        equipment: EXERCISE_DB_EQUIPMENT_MAP[equipmentStr] || 'OTHER',
        imageUrl: `/api/v1/exercises/image/${exerciseId}`,
        isCustom: false,
        isExternal: true,
      };
    });

    const limit = 100;
    return {
      exercises: exercises.slice(0, limit),
      total: exercises.length,
      page: 1,
      limit,
      totalPages: 1,
    };
  }

  async searchExternal(query: string): Promise<unknown> {
    return this.findAllExternal({ search: query } as any);
  }

  async streamExerciseImage(exerciseId: string): Promise<Buffer> {
    const imageCacheKey = `exercise:image:webp:${exerciseId}`;

    // ── 1. Intentar caché webp estático en Redis (base64) ────────────────────
    const cachedB64 = await this.redis.getJson<string>(imageCacheKey);
    if (cachedB64) {
      return Buffer.from(cachedB64, 'base64');
    }

    try {
      // ── 2. Ensamblar la URL estática (ahorra peticiones y evita Rate Limit 429)
      const gifUrl = `https://static.exercisedb.dev/media/${exerciseId}.gif`;

      // ── 3. Fetch binario del GIF ──────────────────────────────────────────
      const { data: imageData } = await lastValueFrom(
        this.http.get(gifUrl, {
          responseType: 'arraybuffer',
        }),
      );

      // ── 4. Convertir GIF a WEBP estático (primer frame) con sharp ─────────
      const webpBuffer = await sharp(Buffer.from(imageData))
        .resize({ width: 400 }) // Redimensionar para ahorrar ancho de banda
        .webp({ quality: 80 }) // Calidad estática buena
        .toBuffer();

      const b64 = webpBuffer.toString('base64');

      // ── 5. Cachear en Redis indefinidamente (el frame 0 no cambiará) ───────
      await this.redis.setJson(imageCacheKey, b64, 30 * 24 * 60 * 60); // 30 días

      return webpBuffer;
    } catch (error: any) {
      console.error(`Error streaming statc exercise image [${exerciseId}]:`, error.message);
      throw new NotFoundException('Exercise static image not available');
    }
  }

  async debugExternal(): Promise<unknown> {
    try {
      const { data: responseBody } = await lastValueFrom(
        this.http.get('https://exercisedb.dev/api/v1/exercises?limit=1'),
      );

      const raw = responseBody?.data?.[0];
      return {
        fields: raw ? Object.keys(raw) : [],
        sample: raw,
      };
    } catch (error: any) {
      return { error: error.message, response: error.response?.data };
    }
  }

  async findOne(id: string, userId: string): Promise<unknown> {
    const exercise = await this.prisma.exercise.findFirst({
      where: {
        id,
        isActive: true,
        OR: [{ createdBy: null }, { createdBy: userId }],
      },
    });

    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  async createCustom(
    userId: string,
    dto: CreateExerciseDto,
    organizationId?: string,
  ): Promise<unknown> {
    const exercise = await this.prisma.exercise.create({
      data: {
        createdBy: userId,
        organizationId,
        name: dto.name,
        primaryMuscles: dto.primaryMuscles,
        secondaryMuscles: dto.secondaryMuscles,
        equipment: dto.equipment,
        movementPattern: dto.movementPattern,
        isUnilateral: dto.isUnilateral,
        instructions: dto.instructions,
        videoUrl: dto.videoUrl,
        isCustom: true,
      },
    });

    return exercise;
  }

  async updateCustom(
    userId: string,
    exerciseId: string,
    dto: Partial<CreateExerciseDto>,
  ): Promise<unknown> {
    // Solo el creador puede editar
    const exercise = await this.prisma.exercise.findFirst({
      where: { id: exerciseId, createdBy: userId, isCustom: true },
    });
    if (!exercise) throw new NotFoundException('Custom exercise not found');

    return this.prisma.exercise.update({
      where: { id: exerciseId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.primaryMuscles && { primaryMuscles: dto.primaryMuscles }),
        ...(dto.secondaryMuscles && { secondaryMuscles: dto.secondaryMuscles }),
        ...(dto.equipment && { equipment: dto.equipment }),
        ...(dto.instructions && { instructions: dto.instructions }),
      },
    });
  }

  async deleteCustom(userId: string, exerciseId: string): Promise<{ deleted: boolean }> {
    const exercise = await this.prisma.exercise.findFirst({
      where: { id: exerciseId, createdBy: userId, isCustom: true },
    });
    if (!exercise) throw new NotFoundException('Custom exercise not found');

    // Soft delete — no borrar si tiene historial
    await this.prisma.exercise.update({
      where: { id: exerciseId },
      data: { isActive: false },
    });

    return { deleted: true };
  }

  async importOrUpdateExternalExercise(externalId: string): Promise<string> {
    // 1. Check if already exists in DB
    const existing = await this.prisma.exercise.findUnique({
      where: { externalId },
    });
    if (existing) return existing.id;

    // 2. Load curated data
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(
      process.cwd(),
      'src',
      'common',
      'constants',
      'curated_exercises.json',
    );
    const curatedData: any[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const ex = curatedData.find((d) => d.exerciseId === externalId);

    if (!ex) throw new NotFoundException(`External exercise ${externalId} not found`);

    // 3. Map
    const primaryMuscleStr = ex.targetMuscles?.[0] || ex.target;
    const secondaryMuscles =
      ex.secondaryMuscles?.map((m: string) => EXERCISE_DB_MUSCLE_MAP[m] || 'FULL_BODY') || [];
    const equipmentStr = ex.equipments?.[0] || ex.equipment;

    // 4. Create
    const newExercise = await this.prisma.exercise.create({
      data: {
        externalId,
        name: ex.fitforgeName || ex.name,
        primaryMuscles: [
          ex.fitforgeMuscle || EXERCISE_DB_MUSCLE_MAP[primaryMuscleStr] || 'FULL_BODY',
        ],
        secondaryMuscles,
        equipment: (EXERCISE_DB_EQUIPMENT_MAP[equipmentStr] as any) || 'OTHER',
        instructions: ex.instructions?.join('\n') || '',
        imageUrl: `/api/v1/exercises/image/${externalId}`,
        isCustom: false,
      },
    });

    return newExercise.id;
  }
}

// ── Controller ────────────────────────────────────────────────────────────────

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  // GET /exercises?search=bench&muscle=CHEST&equipment=BARBELL&page=1&limit=20
  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(ExerciseFiltersSchema)) filters: ExerciseFiltersDto,
  ): Promise<unknown> {
    return this.exercisesService.findAll(user.id, filters);
  }

  // GET /exercises/debug/external — debug de respuesta raw de ExerciseDB
  @Get('debug/external')
  debugExternal(): Promise<unknown> {
    return this.exercisesService.debugExternal();
  }

  // GET /exercises/:id
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<unknown> {
    return this.exercisesService.findOne(id, user.id);
  }

  // POST /exercises — crear ejercicio custom
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createCustom(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateExerciseSchema)) dto: CreateExerciseDto,
    @Query('organizationId') organizationId?: string,
  ): Promise<unknown> {
    // If organizationId is provided, check if user belongs to it and has permission
    if (organizationId && !user.organizations.some((o) => o.id === organizationId)) {
      throw new NotFoundException('Organization not found or access denied');
    }
    return this.exercisesService.createCustom(user.id, dto, organizationId);
  }

  // PATCH /exercises/:id
  @Patch(':id')
  updateCustom(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(CreateExerciseSchema.partial())) dto: Partial<CreateExerciseDto>,
  ): Promise<unknown> {
    return this.exercisesService.updateCustom(user.id, id, dto);
  }

  // GET /exercises/image/:exerciseId — proxy público para WebP estático
  @Public()
  @Get('image/:exerciseId')
  async streamImage(@Param('exerciseId') exerciseId: string, @Res() res: Response): Promise<void> {
    try {
      const buffer = await this.exercisesService.streamExerciseImage(exerciseId);
      res.set('Content-Type', 'image/webp');
      res.set('Cache-Control', 'public, max-age=604800'); // 7 días cache browser
      res.send(buffer);
    } catch {
      // Si no se puede obtener la imagen, devolver 404 sin exponer detalles
      res.status(404).send();
    }
  }

  // DELETE /exercises/:id
  @Delete(':id')
  deleteCustom(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ deleted: boolean }> {
    return this.exercisesService.deleteCustom(user.id, id);
  }
}

// ── Module ────────────────────────────────────────────────────────────────────

@Module({
  imports: [HttpModule],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService],
})
export class ExercisesModule {}
