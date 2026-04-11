// src/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const EXERCISES_TO_SEED = [
  {
    name: 'Barbell Bench Press',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: ['TRICEPS', 'SHOULDERS'],
    equipment: 'BARBELL',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Incline Barbell Bench Press',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: ['TRICEPS', 'SHOULDERS'],
    equipment: 'BARBELL',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Decline Barbell Bench Press',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: ['TRICEPS'],
    equipment: 'BARBELL',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Close-Grip Bench Press',
    primaryMuscles: ['TRICEPS'],
    secondaryMuscles: ['CHEST', 'SHOULDERS'],
    equipment: 'BARBELL',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Dumbbell Bench Press',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: ['TRICEPS', 'SHOULDERS'],
    equipment: 'DUMBBELL',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Incline Dumbbell Press',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: ['TRICEPS', 'SHOULDERS'],
    equipment: 'DUMBBELL',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Dumbbell Flyes',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: [],
    equipment: 'DUMBBELL',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'Cable Crossover',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: [],
    equipment: 'CABLE',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'Cable Flyes',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: [],
    equipment: 'CABLE',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'Machine Chest Press',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: ['TRICEPS', 'SHOULDERS'],
    equipment: 'MACHINE',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Pec Deck',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: [],
    equipment: 'MACHINE',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'Smith Machine Bench Press',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: ['TRICEPS', 'SHOULDERS'],
    equipment: 'SMITH_MACHINE',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Push-Up',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: ['TRICEPS', 'SHOULDERS', 'ABS'],
    equipment: 'BODYWEIGHT',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Diamond Push-Up',
    primaryMuscles: ['TRICEPS'],
    secondaryMuscles: ['CHEST', 'SHOULDERS'],
    equipment: 'BODYWEIGHT',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Dips (Chest)',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: ['TRICEPS', 'SHOULDERS'],
    equipment: 'BODYWEIGHT',
    movementPattern: 'PUSH_VERTICAL',
    isCompound: true,
  },
  {
    name: 'Barbell Row',
    primaryMuscles: ['BACK'],
    secondaryMuscles: ['BICEPS', 'LATS'],
    equipment: 'BARBELL',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Pendlay Row',
    primaryMuscles: ['BACK'],
    secondaryMuscles: ['BICEPS', 'LATS'],
    equipment: 'BARBELL',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'T-Bar Row',
    primaryMuscles: ['BACK'],
    secondaryMuscles: ['BICEPS', 'LATS'],
    equipment: 'BARBELL',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Shrugs',
    primaryMuscles: ['TRAPS'],
    secondaryMuscles: [],
    equipment: 'BARBELL',
    movementPattern: 'PULL_VERTICAL',
    isCompound: false,
  },
  {
    name: 'Dumbbell Row',
    primaryMuscles: ['BACK'],
    secondaryMuscles: ['BICEPS', 'LATS'],
    equipment: 'DUMBBELL',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: true,
    isUnilateral: true,
  },
  {
    name: 'Incline Dumbbell Row',
    primaryMuscles: ['BACK'],
    secondaryMuscles: ['BICEPS', 'LATS'],
    equipment: 'DUMBBELL',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Dumbbell Pullover',
    primaryMuscles: ['LATS'],
    secondaryMuscles: ['CHEST', 'TRICEPS'],
    equipment: 'DUMBBELL',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Dumbbell Shrugs',
    primaryMuscles: ['TRAPS'],
    secondaryMuscles: [],
    equipment: 'DUMBBELL',
    movementPattern: 'PULL_VERTICAL',
    isCompound: false,
  },
  {
    name: 'Reverse Flyes',
    primaryMuscles: ['SHOULDERS'],
    secondaryMuscles: ['TRAPS'],
    equipment: 'DUMBBELL',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'Lat Pulldown',
    primaryMuscles: ['LATS'],
    secondaryMuscles: ['BICEPS'],
    equipment: 'CABLE',
    movementPattern: 'PULL_VERTICAL',
    isCompound: true,
  },
  {
    name: 'Wide-Grip Lat Pulldown',
    primaryMuscles: ['LATS'],
    secondaryMuscles: ['BICEPS'],
    equipment: 'CABLE',
    movementPattern: 'PULL_VERTICAL',
    isCompound: true,
  },
  {
    name: 'Close-Grip Lat Pulldown',
    primaryMuscles: ['LATS'],
    secondaryMuscles: ['BICEPS'],
    equipment: 'CABLE',
    movementPattern: 'PULL_VERTICAL',
    isCompound: true,
  },
  {
    name: 'Seated Cable Row',
    primaryMuscles: ['BACK'],
    secondaryMuscles: ['BICEPS', 'LATS'],
    equipment: 'CABLE',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Face Pull',
    primaryMuscles: ['TRAPS', 'SHOULDERS'],
    secondaryMuscles: [],
    equipment: 'CABLE',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'Lat Pulldown (Machine)',
    primaryMuscles: ['LATS'],
    secondaryMuscles: ['BICEPS'],
    equipment: 'MACHINE',
    movementPattern: 'PULL_VERTICAL',
    isCompound: true,
  },
  {
    name: 'Seated Row (Machine)',
    primaryMuscles: ['BACK'],
    secondaryMuscles: ['BICEPS', 'LATS'],
    equipment: 'MACHINE',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Machine Row',
    primaryMuscles: ['BACK'],
    secondaryMuscles: ['BICEPS', 'LATS'],
    equipment: 'MACHINE',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Pull-Up',
    primaryMuscles: ['LATS'],
    secondaryMuscles: ['BICEPS', 'BACK'],
    equipment: 'BODYWEIGHT',
    movementPattern: 'PULL_VERTICAL',
    isCompound: true,
  },
  {
    name: 'Chin-Up',
    primaryMuscles: ['LATS'],
    secondaryMuscles: ['BICEPS', 'BACK'],
    equipment: 'BODYWEIGHT',
    movementPattern: 'PULL_VERTICAL',
    isCompound: true,
  },
  {
    name: 'Wide-Grip Pull-Up',
    primaryMuscles: ['LATS'],
    secondaryMuscles: ['BACK', 'BICEPS'],
    equipment: 'BODYWEIGHT',
    movementPattern: 'PULL_VERTICAL',
    isCompound: true,
  },
  {
    name: 'Overhead Press',
    primaryMuscles: ['SHOULDERS'],
    secondaryMuscles: ['TRICEPS'],
    equipment: 'BARBELL',
    movementPattern: 'PUSH_VERTICAL',
    isCompound: true,
  },
  {
    name: 'Seated Overhead Press',
    primaryMuscles: ['SHOULDERS'],
    secondaryMuscles: ['TRICEPS'],
    equipment: 'BARBELL',
    movementPattern: 'PUSH_VERTICAL',
    isCompound: true,
  },
  {
    name: 'Dumbbell Shoulder Press',
    primaryMuscles: ['SHOULDERS'],
    secondaryMuscles: ['TRICEPS'],
    equipment: 'DUMBBELL',
    movementPattern: 'PUSH_VERTICAL',
    isCompound: true,
  },
  {
    name: 'Arnold Press',
    primaryMuscles: ['SHOULDERS'],
    secondaryMuscles: ['TRICEPS'],
    equipment: 'DUMBBELL',
    movementPattern: 'PUSH_VERTICAL',
    isCompound: true,
  },
  {
    name: 'Lateral Raise',
    primaryMuscles: ['SHOULDERS'],
    secondaryMuscles: [],
    equipment: 'DUMBBELL',
    movementPattern: 'PUSH_VERTICAL',
    isCompound: false,
  },
  {
    name: 'Front Raise',
    primaryMuscles: ['SHOULDERS'],
    secondaryMuscles: [],
    equipment: 'DUMBBELL',
    movementPattern: 'PUSH_VERTICAL',
    isCompound: false,
  },
  {
    name: 'Rear Delt Flyes',
    primaryMuscles: ['SHOULDERS'],
    secondaryMuscles: ['TRAPS'],
    equipment: 'DUMBBELL',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'Cable Lateral Raise',
    primaryMuscles: ['SHOULDERS'],
    secondaryMuscles: [],
    equipment: 'CABLE',
    movementPattern: 'PUSH_VERTICAL',
    isCompound: false,
  },
  {
    name: 'Machine Shoulder Press',
    primaryMuscles: ['SHOULDERS'],
    secondaryMuscles: ['TRICEPS'],
    equipment: 'MACHINE',
    movementPattern: 'PUSH_VERTICAL',
    isCompound: true,
  },
  {
    name: 'Barbell Curl',
    primaryMuscles: ['BICEPS'],
    secondaryMuscles: [],
    equipment: 'BARBELL',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'EZ Bar Curl',
    primaryMuscles: ['BICEPS'],
    secondaryMuscles: [],
    equipment: 'BARBELL',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'Dumbbell Curl',
    primaryMuscles: ['BICEPS'],
    secondaryMuscles: [],
    equipment: 'DUMBBELL',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'Hammer Curl',
    primaryMuscles: ['BICEPS'],
    secondaryMuscles: ['FOREARMS'],
    equipment: 'DUMBBELL',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'Preacher Curl',
    primaryMuscles: ['BICEPS'],
    secondaryMuscles: [],
    equipment: 'BARBELL',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'Incline Dumbbell Curl',
    primaryMuscles: ['BICEPS'],
    secondaryMuscles: [],
    equipment: 'DUMBBELL',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'Cable Curl',
    primaryMuscles: ['BICEPS'],
    secondaryMuscles: [],
    equipment: 'CABLE',
    movementPattern: 'PULL_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'Overhead Tricep Extension',
    primaryMuscles: ['TRICEPS'],
    secondaryMuscles: [],
    equipment: 'DUMBBELL',
    movementPattern: 'PUSH_VERTICAL',
    isCompound: false,
  },
  {
    name: 'Tricep Pushdown',
    primaryMuscles: ['TRICEPS'],
    secondaryMuscles: [],
    equipment: 'CABLE',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'Rope Pushdown',
    primaryMuscles: ['TRICEPS'],
    secondaryMuscles: [],
    equipment: 'CABLE',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'Skull Crushers',
    primaryMuscles: ['TRICEPS'],
    secondaryMuscles: [],
    equipment: 'BARBELL',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: false,
  },
  {
    name: 'Close-Grip Bench Press',
    primaryMuscles: ['TRICEPS'],
    secondaryMuscles: ['CHEST'],
    equipment: 'BARBELL',
    movementPattern: 'PUSH_HORIZONTAL',
    isCompound: true,
  },
  {
    name: 'Dips (Triceps)',
    primaryMuscles: ['TRICEPS'],
    secondaryMuscles: ['CHEST'],
    equipment: 'BODYWEIGHT',
    movementPattern: 'PUSH_VERTICAL',
    isCompound: true,
  },
  {
    name: 'Barbell Squat',
    primaryMuscles: ['QUADS', 'GLUTES'],
    secondaryMuscles: ['HAMSTRINGS'],
    equipment: 'BARBELL',
    movementPattern: 'SQUAT',
    isCompound: true,
  },
  {
    name: 'Front Squat',
    primaryMuscles: ['QUADS', 'GLUTES'],
    secondaryMuscles: ['ABS'],
    equipment: 'BARBELL',
    movementPattern: 'SQUAT',
    isCompound: true,
  },
  {
    name: 'Leg Press',
    primaryMuscles: ['QUADS', 'GLUTES'],
    secondaryMuscles: ['HAMSTRINGS'],
    equipment: 'MACHINE',
    movementPattern: 'SQUAT',
    isCompound: true,
  },
  {
    name: 'Hack Squat',
    primaryMuscles: ['QUADS'],
    secondaryMuscles: ['GLUTES'],
    equipment: 'MACHINE',
    movementPattern: 'SQUAT',
    isCompound: true,
  },
  {
    name: 'Goblet Squat',
    primaryMuscles: ['QUADS'],
    secondaryMuscles: ['GLUTES', 'ABS'],
    equipment: 'DUMBBELL',
    movementPattern: 'SQUAT',
    isCompound: true,
  },
  {
    name: 'Bulgarian Split Squat',
    primaryMuscles: ['QUADS'],
    secondaryMuscles: ['GLUTES'],
    equipment: 'DUMBBELL',
    movementPattern: 'LUNGE',
    isCompound: true,
    isUnilateral: true,
  },
  {
    name: 'Walking Lunge',
    primaryMuscles: ['QUADS'],
    secondaryMuscles: ['GLUTES'],
    equipment: 'DUMBBELL',
    movementPattern: 'LUNGE',
    isCompound: true,
  },
  {
    name: 'Leg Extension',
    primaryMuscles: ['QUADS'],
    secondaryMuscles: [],
    equipment: 'MACHINE',
    movementPattern: 'SQUAT',
    isCompound: false,
  },
  {
    name: 'Leg Curl',
    primaryMuscles: ['HAMSTRINGS'],
    secondaryMuscles: [],
    equipment: 'MACHINE',
    movementPattern: 'HINGE',
    isCompound: false,
  },
  {
    name: 'Seated Leg Curl',
    primaryMuscles: ['HAMSTRINGS'],
    secondaryMuscles: [],
    equipment: 'MACHINE',
    movementPattern: 'HINGE',
    isCompound: false,
  },
  {
    name: 'Romanian Deadlift',
    primaryMuscles: ['HAMSTRINGS', 'GLUTES'],
    secondaryMuscles: ['BACK'],
    equipment: 'BARBELL',
    movementPattern: 'HINGE',
    isCompound: true,
  },
  {
    name: 'Stiff Leg Deadlift',
    primaryMuscles: ['HAMSTRINGS'],
    secondaryMuscles: ['GLUTES', 'BACK'],
    equipment: 'BARBELL',
    movementPattern: 'HINGE',
    isCompound: true,
  },
  {
    name: 'Hip Thrust',
    primaryMuscles: ['GLUTES'],
    secondaryMuscles: ['HAMSTRINGS'],
    equipment: 'BARBELL',
    movementPattern: 'SQUAT',
    isCompound: true,
  },
  {
    name: 'Glute Bridge',
    primaryMuscles: ['GLUTES'],
    secondaryMuscles: ['HAMSTRINGS'],
    equipment: 'BODYWEIGHT',
    movementPattern: 'SQUAT',
    isCompound: false,
  },
  {
    name: 'Calf Raise',
    primaryMuscles: ['CALVES'],
    secondaryMuscles: [],
    equipment: 'MACHINE',
    movementPattern: 'CARDIO',
    isCompound: false,
  },
  {
    name: 'Seated Calf Raise',
    primaryMuscles: ['CALVES'],
    secondaryMuscles: [],
    equipment: 'MACHINE',
    movementPattern: 'CARDIO',
    isCompound: false,
  },
  {
    name: 'Leg Calf Raise',
    primaryMuscles: ['CALVES'],
    secondaryMuscles: [],
    equipment: 'BODYWEIGHT',
    movementPattern: 'CARDIO',
    isCompound: false,
  },
  {
    name: 'Plank',
    primaryMuscles: ['ABS'],
    secondaryMuscles: ['OBLIQUES'],
    equipment: 'BODYWEIGHT',
    movementPattern: 'CORE',
    isCompound: false,
  },
  {
    name: ' Crunches',
    primaryMuscles: ['ABS'],
    secondaryMuscles: [],
    equipment: 'BODYWEIGHT',
    movementPattern: 'CORE',
    isCompound: false,
  },
  {
    name: 'Leg Raise',
    primaryMuscles: ['ABS'],
    secondaryMuscles: [],
    equipment: 'BODYWEIGHT',
    movementPattern: 'CORE',
    isCompound: false,
  },
  {
    name: 'Hanging Leg Raise',
    primaryMuscles: ['ABS'],
    secondaryMuscles: [],
    equipment: 'BODYWEIGHT',
    movementPattern: 'CORE',
    isCompound: false,
  },
  {
    name: 'Cable Crunch',
    primaryMuscles: ['ABS'],
    secondaryMuscles: [],
    equipment: 'CABLE',
    movementPattern: 'CORE',
    isCompound: false,
  },
  {
    name: 'Ab Wheel Rollout',
    primaryMuscles: ['ABS'],
    secondaryMuscles: ['OBLIQUES'],
    equipment: 'OTHER',
    movementPattern: 'CORE',
    isCompound: false,
  },
  {
    name: 'Russian Twist',
    primaryMuscles: ['OBLIQUES'],
    secondaryMuscles: ['ABS'],
    equipment: 'BODYWEIGHT',
    movementPattern: 'CORE',
    isCompound: false,
  },
  {
    name: 'Dead Bug',
    primaryMuscles: ['ABS'],
    secondaryMuscles: [],
    equipment: 'BODYWEIGHT',
    movementPattern: 'CORE',
    isCompound: false,
  },
];

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected');

      const count = await this.exercise.count();
      if (count === 0) {
        this.logger.log('🌱 Seeding exercises...');
        for (const ex of EXERCISES_TO_SEED) {
          const slug = ex.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          await this.exercise.upsert({
            where: { slug },
            create: {
              name: ex.name,
              slug,
              primaryMuscles: ex.primaryMuscles as any,
              secondaryMuscles: ex.secondaryMuscles as any,
              equipment: ex.equipment as any,
              movementPattern: ex.movementPattern as any,
              isCompound: ex.isCompound,
              isActive: true,
            },
            update: {},
          });
        }
        this.logger.log(`✅ Seeded ${EXERCISES_TO_SEED.length} exercises`);
      } else {
        this.logger.log(`📊 ${count} exercises already in DB`);
      }

      if (process.env.NODE_ENV === 'development') {
        // @ts-expect-error: Prisma event typing
        this.$on('query', (e: { query: string; duration: number }) => {
          if (e.duration > 500) {
            this.logger.warn(`⚠️  Slow query (${e.duration}ms): ${e.query}`);
          }
        });
      }
    } catch (error) {
      this.logger.error('❌ Database connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  // Helper: transacción con retry automático
  async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 100): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error: unknown) {
        const isRetryable =
          error instanceof Error &&
          (error.message.includes('deadlock') || error.message.includes('connection'));

        if (i === retries - 1 || !isRetryable) throw error;
        await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
      }
    }
    throw new Error('Max retries reached');
  }
}
