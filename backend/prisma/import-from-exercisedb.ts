// prisma/import-from-exercisedb.ts
/**
 * Import exercises from ExerciseDB (RapidAPI) to Prisma database
 *
 * Run with: node node_modules/ts-node/dist/bin.js -r tsconfig-paths/register prisma/import-from-exercisedb.ts
 */

import {
  PrismaClient,
  MuscleGroup,
  Equipment,
  MovementPattern,
  ExerciseType,
} from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const EXERCISE_DB_BASE = 'https://exercisedb.p.rapidapi.com';
const API_KEY = process.env.EXERCISE_DB_API_KEY;
const HOST = 'exercisedb.p.rapidapi.com';

const HEADERS = {
  'x-rapidapi-key': API_KEY || '',
  'x-rapidapi-host': HOST,
};

interface ExerciseDBExercise {
  id: string;
  name: string;
  bodyPart: string;
  bodyPart2: string;
  target: string;
  equipment: string;
  gifUrl: string;
  instructions: string[];
  secondaryMuscles: string[];
  primaryMuscles: string[];
}

const VALID_MUSCLE_GROUPS: MuscleGroup[] = [
  'CHEST',
  'BACK',
  'SHOULDERS',
  'BICEPS',
  'TRICEPS',
  'QUADS',
  'HAMSTRINGS',
  'GLUTES',
  'CALVES',
  'ABS',
  'OBLIQUES',
  'TRAPS',
  'LATS',
  'FULL_BODY',
];

const VALID_EQUIPMENT: Equipment[] = [
  'BARBELL',
  'DUMBBELL',
  'CABLE',
  'MACHINE',
  'BODYWEIGHT',
  'KETTLEBELL',
  'RESISTANCE_BAND',
  'SMITH_MACHINE',
  'OTHER',
];

const VALID_MOVEMENT: MovementPattern[] = [
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
];

const BODY_PART_MAP: Record<string, MuscleGroup[]> = {
  chest: ['CHEST'],
  back: ['LATS'],
  shoulders: ['SHOULDERS'],
  'upper arms': ['BICEPS', 'TRICEPS'],
  'upper legs': ['QUADS', 'HAMSTRINGS', 'GLUTES'],
  'lower legs': ['CALVES'],
  waist: ['ABS', 'OBLIQUES'],
  cardio: ['FULL_BODY'],
};

const EQUIPMENT_MAP: Record<string, Equipment> = {
  barbell: 'BARBELL',
  dumbbell: 'DUMBBELL',
  cable: 'CABLE',
  machine: 'MACHINE',
  'body weight': 'BODYWEIGHT',
  'smith machine': 'SMITH_MACHINE',
  kettlebell: 'KETTLEBELL',
  'resistance band': 'RESISTANCE_BAND',
  none: 'OTHER',
  'ezy curlbar': 'OTHER',
  'assisted bodyweight': 'BODYWEIGHT',
  'lever machine': 'MACHINE',
  'sled machine': 'MACHINE',
  'weight lifted body weight': 'BODYWEIGHT',
};

const EXERCISE_DB_MUSCLE_MAP: Record<string, MuscleGroup> = {
  pectorals: 'CHEST',
  anterior_delt: 'SHOULDERS',
  posterior_delt: 'SHOULDERS',
  deltoids: 'SHOULDERS',
  delts: 'SHOULDERS',
  biceps: 'BICEPS',
  triceps: 'TRICEPS',
  forearms: 'FOREARMS',
  quadriceps: 'QUADS',
  quads: 'QUADS',
  hamstrings: 'HAMSTRINGS',
  glutes: 'GLUTES',
  calf_raising: 'CALVES',
  abs: 'ABS',
  obliques: 'OBLIQUES',
  trapezius: 'TRAPS',
  traps: 'TRAPS',
  lats: 'LATS',
  lat: 'LATS',
  serratus_anterior: 'SHOULDERS',
  spine: 'BACK',
  'upper back': 'BACK',
  'lower back': 'BACK',
  kardashian: 'GLUTES',
  gastrocnemius: 'CALVES',
  soleus: 'CALVES',
};

function normalizeMuscle(muscle: string): MuscleGroup | null {
  const key = muscle.toLowerCase().replace(' ', '_');
  return EXERCISE_DB_MUSCLE_MAP[key] || null;
}

function isValidMuscleGroup(muscles: string[]): muscles is MuscleGroup[] {
  return muscles.every((m) => VALID_MUSCLE_GROUPS.includes(m as MuscleGroup));
}

function mapBodyPartToMuscles(bodyPart: string): MuscleGroup[] {
  return BODY_PART_MAP[bodyPart.toLowerCase()] || ['CHEST'];
}

function mapEquipment(equipment: string): Equipment {
  const key = equipment.toLowerCase().trim();
  return EQUIPMENT_MAP[key] || 'BARBELL';
}

function inferMovementPattern(target: string, equipment: string, name: string): MovementPattern {
  const t = target.toLowerCase();
  const n = name.toLowerCase();

  if (n.includes('press') || t.includes('press') || n.includes('push')) {
    if (n.includes('overhead') || n.includes('shoulder press') || t.includes('deltoid')) {
      return 'PUSH_VERTICAL';
    }
    return 'PUSH_HORIZONTAL';
  }
  if (n.includes('row') || n.includes('pull') || t.includes('pull') || n.includes('curl')) {
    if (n.includes('lat pulldown') || n.includes('pull-up') || n.includes('chin')) {
      return 'PULL_VERTICAL';
    }
    return 'PULL_HORIZONTAL';
  }
  if (n.includes('squat') || n.includes('leg press') || n.includes('hip thrust')) {
    return 'SQUAT';
  }
  if (n.includes('deadlift') || n.includes('hinge')) {
    return 'HINGE';
  }
  if (n.includes('lunge') || n.includes('step-up')) {
    return 'LUNGE';
  }
  if (
    n.includes('crunch') ||
    n.includes('sit-up') ||
    n.includes('plank') ||
    n.includes('ab') ||
    t.includes('abs')
  ) {
    return 'CORE';
  }
  if (n.includes('calves') || n.includes('raise') || t.includes('calves')) {
    return 'CARDIO';
  }
  if (n.includes('carry') || n.includes('walk')) {
    return 'CARRY';
  }
  return 'PUSH_HORIZONTAL';
}

function inferExerciseType(target: string, name: string): ExerciseType {
  const t = target.toLowerCase();
  const n = name.toLowerCase();
  const compoundTargets = [
    'pectoral',
    'lat',
    'quadricep',
    'deltoid',
    'gluteus',
    'trapezius',
    'back',
  ];
  const isolationTargets = ['curl', 'fly', 'raise', 'extension', ' crunch'];

  if (isolationTargets.some((i) => n.includes(i))) {
    return 'ISOLATION';
  }
  if (compoundTargets.some((ct) => t.includes(ct))) {
    return 'COMPOUND';
  }
  return 'ISOLATION';
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchExercisesByBodyPart(bodyPart: string): Promise<ExerciseDBExercise[]> {
  try {
    const response = await axios.get(`${EXERCISE_DB_BASE}/exercises/bodyPart/${bodyPart}`, {
      headers: HEADERS,
      params: { limit: 1000, offset: 0 },
    });
    return response.data || [];
  } catch (error) {
    console.error(`Error fetching ${bodyPart}:`, error);
    return [];
  }
}

async function importExercises(): Promise<void> {
  if (!API_KEY) {
    console.error('ERROR: EXERCISE_DB_API_KEY not set in environment');
    process.exit(1);
  }

  const bodyParts = [
    'chest',
    'back',
    'shoulders',
    'upper arms',
    'upper legs',
    'lower legs',
    'waist',
  ];

  console.log('Starting import from ExerciseDB...');

  let allExercises: ExerciseDBExercise[] = [];

  for (const bodyPart of bodyParts) {
    console.log(`Fetching ${bodyPart}...`);
    const exercises = await fetchExercisesByBodyPart(bodyPart);
    allExercises = [...allExercises, ...exercises];
    console.log(`  Found ${exercises.length} exercises for ${bodyPart}`);
  }

  console.log(`Total exercises fetched: ${allExercises.length}`);

  const exerciseMap = new Map<string, ExerciseDBExercise>();
  for (const ex of allExercises) {
    const key = ex.name.toLowerCase().trim();
    if (!exerciseMap.has(key)) {
      exerciseMap.set(key, ex);
    }
  }

  console.log(`Unique exercises: ${exerciseMap.size}`);

  let imported = 0;
  let skipped = 0;

  for (const [_, ex] of exerciseMap) {
    try {
      let primaryMusclesRaw: MuscleGroup[] = [];

      if (ex.primaryMuscles?.length > 0) {
        const mapped = ex.primaryMuscles
          .map(normalizeMuscle)
          .filter((m): m is MuscleGroup => m !== null);
        if (mapped.length > 0) {
          primaryMusclesRaw = mapped;
        }
      }

      if (primaryMusclesRaw.length === 0) {
        primaryMusclesRaw = mapBodyPartToMuscles(ex.bodyPart);
      }

      const secondaryMusclesRaw: MuscleGroup[] = [];
      if (ex.secondaryMuscles?.length > 0) {
        const mapped = ex.secondaryMuscles
          .map(normalizeMuscle)
          .filter((m): m is MuscleGroup => m !== null);
        secondaryMusclesRaw.push(...mapped);
      }

      const validPrimary = primaryMusclesRaw.filter((m) => VALID_MUSCLE_GROUPS.includes(m));
      const validSecondary = secondaryMusclesRaw.filter((m) => VALID_MUSCLE_GROUPS.includes(m));

      if (validPrimary.length === 0) {
        validPrimary.push('CHEST');
      }

      const equipment = mapEquipment(ex.equipment);
      const movementPattern = inferMovementPattern(ex.target, equipment, ex.name);
      const exerciseType = inferExerciseType(ex.target, ex.name);

      const slug = createSlug(ex.name);

      await prisma.exercise.upsert({
        where: { slug },
        create: {
          name: ex.name,
          slug,
          primaryMuscles: validPrimary,
          secondaryMuscles: validSecondary,
          equipment,
          movementPattern,
          exerciseType,
          isCompound: exerciseType === 'COMPOUND',
          externalId: ex.id,
          instructions: ex.instructions?.join('\n') || null,
          videoUrl: ex.gifUrl || null,
          isActive: true,
        },
        update: {
          primaryMuscles: validPrimary,
          secondaryMuscles: validSecondary,
          equipment,
          movementPattern,
          exerciseType,
          isCompound: exerciseType === 'COMPOUND',
          externalId: ex.id,
          instructions: ex.instructions?.join('\n') || null,
          videoUrl: ex.gifUrl || null,
        },
      });

      imported++;
    } catch (error) {
      console.error(`Error importing ${ex.name}:`, error);
      skipped++;
    }
  }

  console.log(`Import complete: ${imported} imported, ${skipped} skipped`);
}

importExercises()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('Fatal error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
