// prisma/seed-from-exercisedb.ts
/**
 * Seed exercises from ExerciseDB
 * Run locally: node node_modules/ts-node/dist/bin.js -r tsconfig-paths/register prisma/seed-from-exercisedb.ts
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const EXERCISE_DB_BASE = 'https://exercisedb.p.rapidapi.com';
const API_KEY = process.env.EXERCISE_DB_API_KEY || process.env.EXERCISE_DB_API_KEY;
const HOST = 'exercisedb.p.rapidapi.com';

const HEADERS = {
  'x-rapidapi-key': API_KEY || '',
  'x-rapidapi-host': HOST,
};

const BODY_PARTS = [
  'chest',
  'back',
  'shoulders',
  'upper arms',
  'upper legs',
  'lower legs',
  'waist',
];

const MUSCLE_MAP: Record<string, string> = {
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
  abs: 'ABS',
  obliques: 'OBLIQUES',
  trapezius: 'TRAPS',
  traps: 'TRAPS',
  lats: 'LATS',
  lat: 'LATS',
  serratus_anterior: 'SHOULDERS',
  spine: 'BACK',
  upper_back: 'BACK',
  lower_back: 'BACK',
  gastrocnemius: 'CALVES',
  soleus: 'CALVES',
};

const EQUIPMENT_MAP: Record<string, string> = {
  barbell: 'BARBELL',
  dumbbell: 'DUMBBELL',
  cable: 'CABLE',
  machine: 'MACHINE',
  'body weight': 'BODYWEIGHT',
  'smith machine': 'SMITH_MACHINE',
  kettlebell: 'KETTLEBELL',
  'resistance band': 'RESISTANCE_BAND',
  none: 'OTHER',
  'assisted bodyweight': 'BODYWEIGHT',
};

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeMuscle(muscle: string): string | null {
  const key = muscle.toLowerCase().replace(' ', '_');
  return MUSCLE_MAP[key] || null;
}

function mapEquipment(equipment: string): string {
  const key = equipment.toLowerCase().trim();
  return EQUIPMENT_MAP[key] || 'OTHER';
}

function inferMovementPattern(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('press') || n.includes('push')) {
    return n.includes('overhead') || n.includes('shoulder press')
      ? 'PUSH_VERTICAL'
      : 'PUSH_HORIZONTAL';
  }
  if (n.includes('row') || n.includes('pull') || n.includes('curl')) {
    return n.includes('lat pulldown') || n.includes('pull-up')
      ? 'PULL_VERTICAL'
      : 'PULL_HORIZONTAL';
  }
  if (n.includes('squat') || n.includes('leg press')) return 'SQUAT';
  if (n.includes('deadlift') || n.includes('hinge')) return 'HINGE';
  if (n.includes('lunge') || n.includes('step')) return 'LUNGE';
  if (n.includes('crunch') || n.includes('plank') || n.includes('ab')) return 'CORE';
  if (n.includes('calves') || n.includes('raise')) return 'CARDIO';
  return 'PUSH_HORIZONTAL';
}

function inferExerciseType(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('curl') || n.includes('fly') || n.includes('raise') || n.includes('extension'))
    return 'ISOLATION';
  if (n.includes('press') || n.includes('row') || n.includes('squat') || n.includes('deadlift'))
    return 'COMPOUND';
  return 'ISOLATION';
}

async function fetchExercises(bodyPart: string): Promise<any[]> {
  try {
    const resp = await axios.get(`${EXERCISE_DB_BASE}/exercises/bodyPart/${bodyPart}`, {
      headers: HEADERS,
      params: { limit: 1000, offset: 0 },
    });
    return resp.data || [];
  } catch {
    return [];
  }
}

async function seed(): Promise<void> {
  if (!API_KEY) {
    console.log('EXERCISE_DB_API_KEY not set, skipping seed');
    await prisma.$disconnect();
    return;
  }

  console.log('Seeding exercises from ExerciseDB...');
  let all: any[] = [];

  for (const bp of BODY_PARTS) {
    console.log(`Fetching ${bp}...`);
    const ex = await fetchExercises(bp);
    all = [...all, ...ex];
    console.log(`  Got ${ex.length}`);
  }

  const seen = new Map<string, any>();
  for (const ex of all) {
    const key = ex.name.toLowerCase().trim();
    if (!seen.has(key)) seen.set(key, ex);
  }
  console.log(`Unique: ${seen.size}`);

  let imported = 0;
  for (const [_, ex] of seen) {
    try {
      const primary = (ex.primaryMuscles || []).map(normalizeMuscle).filter(Boolean);
      const secondary = (ex.secondaryMuscles || []).map(normalizeMuscle).filter(Boolean);

      if (!primary.length) {
        primary.push('CHEST');
      }

      const slug = createSlug(ex.name);
      await prisma.exercise.upsert({
        where: { slug },
        create: {
          name: ex.name,
          slug,
          primaryMuscles: primary as any,
          secondaryMuscles: secondary as any,
          equipment: mapEquipment(ex.equipment) as any,
          movementPattern: inferMovementPattern(ex.name) as any,
          exerciseType: inferExerciseType(ex.name) as any,
          isCompound: inferExerciseType(ex.name) === 'COMPOUND',
          externalId: ex.id,
          instructions: ex.instructions?.join('\n') || null,
          videoUrl: ex.gifUrl || null,
          isActive: true,
        },
        update: {
          primaryMuscles: primary as any,
          secondaryMuscles: secondary as any,
          equipment: mapEquipment(ex.equipment) as any,
          movementPattern: inferMovementPattern(ex.name) as any,
          exerciseType: inferExerciseType(ex.name) as any,
          isCompound: inferExerciseType(ex.name) === 'COMPOUND',
        },
      });
      imported++;
    } catch {
      imported++;
    }
  }

  console.log(`Seeded ${imported} exercises`);
  await prisma.$disconnect();
}

seed();
