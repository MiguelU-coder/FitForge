// prisma/seed.ts
// Ejecutar: npx ts-node prisma/seed.ts
// O via package.json: npm run db:seed

import { PrismaClient, Equipment, MovementPattern } from '@prisma/client';

const prisma = new PrismaClient();

const exercises = [
  // ── PECHO ────────────────────────────────────────────────────────────────
  {
    name: 'Bench Press (Barbell)',
    slug: 'bench-press-barbell',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: ['TRICEPS', 'SHOULDERS'],
    equipment: 'BARBELL' as Equipment,
    movementPattern: 'PUSH_HORIZONTAL' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Incline Bench Press (Barbell)',
    slug: 'incline-bench-press-barbell',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: ['TRICEPS', 'SHOULDERS'],
    equipment: 'BARBELL' as Equipment,
    movementPattern: 'PUSH_HORIZONTAL' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Dumbbell Fly',
    slug: 'dumbbell-fly',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: [],
    equipment: 'DUMBBELL' as Equipment,
    movementPattern: 'PUSH_HORIZONTAL' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Cable Fly (Low to High)',
    slug: 'cable-fly-low-high',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: [],
    equipment: 'CABLE' as Equipment,
    movementPattern: 'PUSH_HORIZONTAL' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Push-up',
    slug: 'push-up',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: ['TRICEPS', 'SHOULDERS'],
    equipment: 'BODYWEIGHT' as Equipment,
    movementPattern: 'PUSH_HORIZONTAL' as MovementPattern,
    isUnilateral: false,
  },

  // ── ESPALDA ───────────────────────────────────────────────────────────────
  {
    name: 'Deadlift (Conventional)',
    slug: 'deadlift-conventional',
    primaryMuscles: ['BACK', 'HAMSTRINGS'],
    secondaryMuscles: ['GLUTES', 'TRAPS', 'FOREARMS'],
    equipment: 'BARBELL' as Equipment,
    movementPattern: 'HINGE' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Barbell Row',
    slug: 'barbell-row',
    primaryMuscles: ['BACK', 'LATS'],
    secondaryMuscles: ['BICEPS', 'TRAPS'],
    equipment: 'BARBELL' as Equipment,
    movementPattern: 'PULL_HORIZONTAL' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Pull-up',
    slug: 'pull-up',
    primaryMuscles: ['LATS', 'BACK'],
    secondaryMuscles: ['BICEPS'],
    equipment: 'BODYWEIGHT' as Equipment,
    movementPattern: 'PULL_VERTICAL' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Lat Pulldown',
    slug: 'lat-pulldown',
    primaryMuscles: ['LATS'],
    secondaryMuscles: ['BICEPS', 'BACK'],
    equipment: 'CABLE' as Equipment,
    movementPattern: 'PULL_VERTICAL' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Seated Cable Row',
    slug: 'seated-cable-row',
    primaryMuscles: ['BACK', 'LATS'],
    secondaryMuscles: ['BICEPS'],
    equipment: 'CABLE' as Equipment,
    movementPattern: 'PULL_HORIZONTAL' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Single Arm Dumbbell Row',
    slug: 'single-arm-dumbbell-row',
    primaryMuscles: ['LATS', 'BACK'],
    secondaryMuscles: ['BICEPS'],
    equipment: 'DUMBBELL' as Equipment,
    movementPattern: 'PULL_HORIZONTAL' as MovementPattern,
    isUnilateral: true,
  },

  // ── HOMBROS ───────────────────────────────────────────────────────────────
  {
    name: 'Overhead Press (Barbell)',
    slug: 'overhead-press-barbell',
    primaryMuscles: ['SHOULDERS'],
    secondaryMuscles: ['TRICEPS', 'TRAPS'],
    equipment: 'BARBELL' as Equipment,
    movementPattern: 'PUSH_VERTICAL' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Dumbbell Lateral Raise',
    slug: 'dumbbell-lateral-raise',
    primaryMuscles: ['SHOULDERS'],
    secondaryMuscles: [],
    equipment: 'DUMBBELL' as Equipment,
    movementPattern: 'PUSH_VERTICAL' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Cable Lateral Raise',
    slug: 'cable-lateral-raise',
    primaryMuscles: ['SHOULDERS'],
    secondaryMuscles: [],
    equipment: 'CABLE' as Equipment,
    movementPattern: 'PUSH_VERTICAL' as MovementPattern,
    isUnilateral: true,
  },
  {
    name: 'Face Pull',
    slug: 'face-pull',
    primaryMuscles: ['SHOULDERS', 'TRAPS'],
    secondaryMuscles: ['BACK'],
    equipment: 'CABLE' as Equipment,
    movementPattern: 'PULL_HORIZONTAL' as MovementPattern,
    isUnilateral: false,
  },

  // ── BÍCEPS ────────────────────────────────────────────────────────────────
  {
    name: 'Barbell Curl',
    slug: 'barbell-curl',
    primaryMuscles: ['BICEPS'],
    secondaryMuscles: ['FOREARMS'],
    equipment: 'BARBELL' as Equipment,
    movementPattern: 'PULL_VERTICAL' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Dumbbell Curl',
    slug: 'dumbbell-curl',
    primaryMuscles: ['BICEPS'],
    secondaryMuscles: ['FOREARMS'],
    equipment: 'DUMBBELL' as Equipment,
    movementPattern: 'PULL_VERTICAL' as MovementPattern,
    isUnilateral: true,
  },
  {
    name: 'Incline Dumbbell Curl',
    slug: 'incline-dumbbell-curl',
    primaryMuscles: ['BICEPS'],
    secondaryMuscles: [],
    equipment: 'DUMBBELL' as Equipment,
    movementPattern: 'PULL_VERTICAL' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Cable Curl',
    slug: 'cable-curl',
    primaryMuscles: ['BICEPS'],
    secondaryMuscles: [],
    equipment: 'CABLE' as Equipment,
    movementPattern: 'PULL_VERTICAL' as MovementPattern,
    isUnilateral: false,
  },

  // ── TRÍCEPS ───────────────────────────────────────────────────────────────
  {
    name: 'Tricep Pushdown (Cable)',
    slug: 'tricep-pushdown-cable',
    primaryMuscles: ['TRICEPS'],
    secondaryMuscles: [],
    equipment: 'CABLE' as Equipment,
    movementPattern: 'PUSH_VERTICAL' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Overhead Tricep Extension (Cable)',
    slug: 'overhead-tricep-extension-cable',
    primaryMuscles: ['TRICEPS'],
    secondaryMuscles: [],
    equipment: 'CABLE' as Equipment,
    movementPattern: 'PUSH_VERTICAL' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Skull Crusher',
    slug: 'skull-crusher',
    primaryMuscles: ['TRICEPS'],
    secondaryMuscles: [],
    equipment: 'BARBELL' as Equipment,
    movementPattern: 'PUSH_HORIZONTAL' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Dip (Tricep)',
    slug: 'dip-tricep',
    primaryMuscles: ['TRICEPS'],
    secondaryMuscles: ['CHEST', 'SHOULDERS'],
    equipment: 'BODYWEIGHT' as Equipment,
    movementPattern: 'PUSH_VERTICAL' as MovementPattern,
    isUnilateral: false,
  },

  // ── PIERNAS ───────────────────────────────────────────────────────────────
  {
    name: 'Squat (Barbell)',
    slug: 'squat-barbell',
    primaryMuscles: ['QUADS'],
    secondaryMuscles: ['GLUTES', 'HAMSTRINGS'],
    equipment: 'BARBELL' as Equipment,
    movementPattern: 'SQUAT' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Romanian Deadlift',
    slug: 'romanian-deadlift',
    primaryMuscles: ['HAMSTRINGS', 'GLUTES'],
    secondaryMuscles: ['BACK'],
    equipment: 'BARBELL' as Equipment,
    movementPattern: 'HINGE' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Leg Press',
    slug: 'leg-press',
    primaryMuscles: ['QUADS'],
    secondaryMuscles: ['GLUTES', 'HAMSTRINGS'],
    equipment: 'MACHINE' as Equipment,
    movementPattern: 'SQUAT' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Leg Curl (Machine)',
    slug: 'leg-curl-machine',
    primaryMuscles: ['HAMSTRINGS'],
    secondaryMuscles: [],
    equipment: 'MACHINE' as Equipment,
    movementPattern: 'HINGE' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Leg Extension (Machine)',
    slug: 'leg-extension-machine',
    primaryMuscles: ['QUADS'],
    secondaryMuscles: [],
    equipment: 'MACHINE' as Equipment,
    movementPattern: 'SQUAT' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Bulgarian Split Squat',
    slug: 'bulgarian-split-squat',
    primaryMuscles: ['QUADS', 'GLUTES'],
    secondaryMuscles: ['HAMSTRINGS'],
    equipment: 'DUMBBELL' as Equipment,
    movementPattern: 'LUNGE' as MovementPattern,
    isUnilateral: true,
  },
  {
    name: 'Hip Thrust (Barbell)',
    slug: 'hip-thrust-barbell',
    primaryMuscles: ['GLUTES'],
    secondaryMuscles: ['HAMSTRINGS'],
    equipment: 'BARBELL' as Equipment,
    movementPattern: 'HINGE' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Standing Calf Raise',
    slug: 'standing-calf-raise',
    primaryMuscles: ['CALVES'],
    secondaryMuscles: [],
    equipment: 'MACHINE' as Equipment,
    movementPattern: 'SQUAT' as MovementPattern,
    isUnilateral: false,
  },

  // ── CORE ──────────────────────────────────────────────────────────────────
  {
    name: 'Plank',
    slug: 'plank',
    primaryMuscles: ['ABS'],
    secondaryMuscles: ['OBLIQUES'],
    equipment: 'BODYWEIGHT' as Equipment,
    movementPattern: 'CORE' as MovementPattern,
    isUnilateral: false,
  },
  {
    name: 'Cable Crunch',
    slug: 'cable-crunch',
    primaryMuscles: ['ABS'],
    secondaryMuscles: [],
    equipment: 'CABLE' as Equipment,
    movementPattern: 'CORE' as MovementPattern,
    isUnilateral: false,
  },
];

const plans = [
  {
    name: "Starter",
    price: 29.0,
    interval: "month",
    features: {
      clients: 25,
      staff: 1,
      analytics: "Standard",
      support: "Email",
    },
  },
  {
    name: "Professional",
    price: 99.0,
    interval: "month",
    features: {
      clients: 150,
      staff: 5,
      analytics: "Advanced",
      support: "Priority",
      customBranding: true,
      aiCoach: "Lite",
    },
  },
  {
    name: "Elite",
    price: 299.0,
    interval: "month",
    features: {
      clients: "Unlimited",
      staff: "Unlimited",
      analytics: "Custom",
      support: "Dedicated",
      whiteLabeling: true,
      aiCoach: "Full Suite",
      apiAccess: true,
    },
  },
];

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Usar upsert para que el seed sea idempotente (se puede correr múltiples veces)
  let created = 0;
  let skipped = 0;

  for (const exercise of exercises) {
    const result = await prisma.exercise.upsert({
      where: { slug: exercise.slug },
      update: {
        // Actualizar datos si cambian
        primaryMuscles: exercise.primaryMuscles as never,
        secondaryMuscles: exercise.secondaryMuscles as never,
        equipment: exercise.equipment,
        movementPattern: exercise.movementPattern,
        isUnilateral: exercise.isUnilateral,
      },
      create: {
        ...exercise,
        primaryMuscles: exercise.primaryMuscles as never,
        secondaryMuscles: exercise.secondaryMuscles as never,
        isCustom: false,
        isActive: true,
      },
    });

    if (result) created++;
  }

  console.log(`✅ Seeded ${created} exercises`);

  console.log('🌱 Seeding billing plans...');
  for (const plan of plans) {
    const id = plan.name === 'Starter' 
      ? '00000000-0000-0000-0000-000000000001' 
      : plan.name === 'Professional' 
        ? '00000000-0000-0000-0000-000000000002' 
        : '00000000-0000-0000-0000-000000000003';

    await prisma.billingPlan.upsert({
      where: { id },
      update: plan,
      create: {
        id,
        ...plan,
      },
    });
  }
  console.log('✅ Seeded billing plans');

  console.log('🌱 Seeding global settings...');
  await prisma.globalSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default', platformFeePct: 5.0 },
  });
  console.log('✅ Seeded global settings');

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
