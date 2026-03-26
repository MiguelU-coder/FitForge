// prisma/seed-exercises.ts
/**
 * FitForge Exercise Database Seeder
 *
 * Run with: npx ts-node prisma/seed-exercises.ts
 * Or: npx prisma db seed (if configured in package.json)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Comprehensive exercise database for commercial gyms
const exercises = [
  // ═══════════════════════════════════════════════════════════════════════════════
  // CHEST EXERCISES
  // ═══════════════════════════════════════════════════════════════════════════════

  // Barbell
  { name: 'Barbell Bench Press', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: 'BARBELL', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Incline Barbell Bench Press', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: 'BARBELL', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Decline Barbell Bench Press', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS'], equipment: 'BARBELL', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Close-Grip Bench Press', primaryMuscles: ['TRICEPS'], secondaryMuscles: ['CHEST', 'SHOULDERS'], equipment: 'BARBELL', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Pause Bench Press', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: 'BARBELL', movementPattern: 'PUSH_HORIZONTAL' },

  // Dumbbell
  { name: 'Dumbbell Bench Press', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: 'DUMBBELL', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Incline Dumbbell Press', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: 'DUMBBELL', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Decline Dumbbell Press', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS'], equipment: 'DUMBBELL', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Dumbbell Flyes', primaryMuscles: ['CHEST'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Incline Dumbbell Flyes', primaryMuscles: ['CHEST'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Dumbbell Pullover', primaryMuscles: ['CHEST'], secondaryMuscles: ['LATS'], equipment: 'DUMBBELL', movementPattern: 'PUSH_HORIZONTAL' },

  // Cable
  { name: 'Cable Crossover', primaryMuscles: ['CHEST'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Cable Flyes', primaryMuscles: ['CHEST'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Low Cable Crossover', primaryMuscles: ['CHEST'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'High Cable Crossover', primaryMuscles: ['CHEST'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PUSH_VERTICAL' },

  // Machine
  { name: 'Machine Chest Press', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: 'MACHINE', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Incline Machine Press', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: 'MACHINE', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Pec Deck', primaryMuscles: ['CHEST'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Machine Flyes', primaryMuscles: ['CHEST'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'PUSH_HORIZONTAL' },

  // Smith Machine
  { name: 'Smith Machine Bench Press', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: 'SMITH_MACHINE', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Smith Machine Incline Press', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: 'SMITH_MACHINE', movementPattern: 'PUSH_HORIZONTAL' },

  // Bodyweight
  { name: 'Push-Up', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS', 'ABS'], equipment: 'BODYWEIGHT', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Incline Push-Up', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: 'BODYWEIGHT', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Decline Push-Up', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: 'BODYWEIGHT', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Diamond Push-Up', primaryMuscles: ['TRICEPS'], secondaryMuscles: ['CHEST', 'SHOULDERS'], equipment: 'BODYWEIGHT', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Wide Push-Up', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: 'BODYWEIGHT', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Archer Push-Up', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: 'BODYWEIGHT', movementPattern: 'PUSH_HORIZONTAL', isUnilateral: true },
  { name: 'Dips (Chest)', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: 'BODYWEIGHT', movementPattern: 'PUSH_VERTICAL' },

  // ═══════════════════════════════════════════════════════════════════════════════
  // BACK EXERCISES
  // ═══════════════════════════════════════════════════════════════════════════════

  // Barbell
  { name: 'Barbell Row', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS', 'LATS'], equipment: 'BARBELL', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Pendlay Row', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS', 'LATS'], equipment: 'BARBELL', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'T-Bar Row', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS', 'LATS'], equipment: 'BARBELL', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Yates Row', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS', 'LATS'], equipment: 'BARBELL', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Shrugs', primaryMuscles: ['TRAPS'], secondaryMuscles: [], equipment: 'BARBELL', movementPattern: 'PULL_VERTICAL' },

  // Dumbbell
  { name: 'Dumbbell Row', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS', 'LATS'], equipment: 'DUMBBELL', movementPattern: 'PULL_HORIZONTAL', isUnilateral: true },
  { name: 'Incline Dumbbell Row', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS', 'LATS'], equipment: 'DUMBBELL', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Dumbbell Pullover', primaryMuscles: ['LATS'], secondaryMuscles: ['CHEST', 'TRICEPS'], equipment: 'DUMBBELL', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Dumbbell Shrugs', primaryMuscles: ['TRAPS'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'PULL_VERTICAL' },
  { name: 'Reverse Flyes', primaryMuscles: ['SHOULDERS'], secondaryMuscles: ['TRAPS'], equipment: 'DUMBBELL', movementPattern: 'PULL_HORIZONTAL' },

  // Cable
  { name: 'Lat Pulldown', primaryMuscles: ['LATS'], secondaryMuscles: ['BICEPS'], equipment: 'CABLE', movementPattern: 'PULL_VERTICAL' },
  { name: 'Wide-Grip Lat Pulldown', primaryMuscles: ['LATS'], secondaryMuscles: ['BICEPS'], equipment: 'CABLE', movementPattern: 'PULL_VERTICAL' },
  { name: 'Close-Grip Lat Pulldown', primaryMuscles: ['LATS'], secondaryMuscles: ['BICEPS'], equipment: 'CABLE', movementPattern: 'PULL_VERTICAL' },
  { name: 'Seated Cable Row', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS', 'LATS'], equipment: 'CABLE', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Wide-Grip Cable Row', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS'], equipment: 'CABLE', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Straight-Arm Pulldown', primaryMuscles: ['LATS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PULL_VERTICAL' },
  { name: 'Face Pull', primaryMuscles: ['TRAPS', 'SHOULDERS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Cable Shrugs', primaryMuscles: ['TRAPS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PULL_VERTICAL' },
  { name: 'Cable Reverse Flyes', primaryMuscles: ['SHOULDERS'], secondaryMuscles: ['TRAPS'], equipment: 'CABLE', movementPattern: 'PULL_HORIZONTAL' },

  // Machine
  { name: 'Lat Pulldown (Machine)', primaryMuscles: ['LATS'], secondaryMuscles: ['BICEPS'], equipment: 'MACHINE', movementPattern: 'PULL_VERTICAL' },
  { name: 'Seated Row (Machine)', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS', 'LATS'], equipment: 'MACHINE', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Chest-Supported Row', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS'], equipment: 'MACHINE', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'T-Bar (Machine)', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS', 'LATS'], equipment: 'MACHINE', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Machine Row', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS', 'LATS'], equipment: 'MACHINE', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Machine Shrugs', primaryMuscles: ['TRAPS'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'PULL_VERTICAL' },
  { name: 'Hammer Strength Row', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS', 'LATS'], equipment: 'MACHINE', movementPattern: 'PULL_HORIZONTAL' },

  // Bodyweight
  { name: 'Pull-Up', primaryMuscles: ['LATS'], secondaryMuscles: ['BICEPS', 'BACK'], equipment: 'BODYWEIGHT', movementPattern: 'PULL_VERTICAL' },
  { name: 'Chin-Up', primaryMuscles: ['LATS'], secondaryMuscles: ['BICEPS', 'BACK'], equipment: 'BODYWEIGHT', movementPattern: 'PULL_VERTICAL' },
  { name: 'Wide-Grip Pull-Up', primaryMuscles: ['LATS'], secondaryMuscles: ['BACK', 'BICEPS'], equipment: 'BODYWEIGHT', movementPattern: 'PULL_VERTICAL' },
  { name: 'Close-Grip Pull-Up', primaryMuscles: ['LATS'], secondaryMuscles: ['BICEPS'], equipment: 'BODYWEIGHT', movementPattern: 'PULL_VERTICAL' },
  { name: 'Neutral-Grip Pull-Up', primaryMuscles: ['LATS'], secondaryMuscles: ['BICEPS', 'BACK'], equipment: 'BODYWEIGHT', movementPattern: 'PULL_VERTICAL' },
  { name: 'Archer Pull-Up', primaryMuscles: ['LATS'], secondaryMuscles: ['BICEPS', 'BACK'], equipment: 'BODYWEIGHT', movementPattern: 'PULL_VERTICAL', isUnilateral: true },
  { name: 'Inverted Row', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS', 'LATS'], equipment: 'BODYWEIGHT', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Australian Pull-Up', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS', 'LATS'], equipment: 'BODYWEIGHT', movementPattern: 'PULL_HORIZONTAL' },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SHOULDER EXERCISES
  // ═══════════════════════════════════════════════════════════════════════════════

  // Barbell
  { name: 'Overhead Press', primaryMuscles: ['SHOULDERS'], secondaryMuscles: ['TRICEPS'], equipment: 'BARBELL', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Push Press', primaryMuscles: ['SHOULDERS'], secondaryMuscles: ['TRICEPS', 'QUADS'], equipment: 'BARBELL', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Seated Overhead Press', primaryMuscles: ['SHOULDERS'], secondaryMuscles: ['TRICEPS'], equipment: 'BARBELL', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Behind-Neck Press', primaryMuscles: ['SHOULDERS'], secondaryMuscles: ['TRICEPS'], equipment: 'BARBELL', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Upright Row', primaryMuscles: ['SHOULDERS', 'TRAPS'], secondaryMuscles: ['BICEPS'], equipment: 'BARBELL', movementPattern: 'PULL_VERTICAL' },

  // Dumbbell
  { name: 'Dumbbell Shoulder Press', primaryMuscles: ['SHOULDERS'], secondaryMuscles: ['TRICEPS'], equipment: 'DUMBBELL', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Seated Dumbbell Press', primaryMuscles: ['SHOULDERS'], secondaryMuscles: ['TRICEPS'], equipment: 'DUMBBELL', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Arnold Press', primaryMuscles: ['SHOULDERS'], secondaryMuscles: ['TRICEPS'], equipment: 'DUMBBELL', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Lateral Raise', primaryMuscles: ['SHOULDERS'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Front Raise', primaryMuscles: ['SHOULDERS'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Rear Delt Flyes', primaryMuscles: ['SHOULDERS'], secondaryMuscles: ['TRAPS'], equipment: 'DUMBBELL', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Dumbbell Upright Row', primaryMuscles: ['SHOULDERS', 'TRAPS'], secondaryMuscles: ['BICEPS'], equipment: 'DUMBBELL', movementPattern: 'PULL_VERTICAL' },
  { name: 'Lu Raise', primaryMuscles: ['SHOULDERS'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Incline Lateral Raise', primaryMuscles: ['SHOULDERS'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Cable Lateral Raise', primaryMuscles: ['SHOULDERS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PUSH_VERTICAL' },

  // Cable
  { name: 'Cable Lateral Raise', primaryMuscles: ['SHOULDERS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Cable Front Raise', primaryMuscles: ['SHOULDERS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Cable Face Pull', primaryMuscles: ['TRAPS', 'SHOULDERS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Cable Rear Delt Fly', primaryMuscles: ['SHOULDERS'], secondaryMuscles: ['TRAPS'], equipment: 'CABLE', movementPattern: 'PULL_HORIZONTAL' },

  // Machine
  { name: 'Machine Shoulder Press', primaryMuscles: ['SHOULDERS'], secondaryMuscles: ['TRICEPS'], equipment: 'MACHINE', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Machine Lateral Raise', primaryMuscles: ['SHOULDERS'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Hammer Strength Shoulder Press', primaryMuscles: ['SHOULDERS'], secondaryMuscles: ['TRICEPS'], equipment: 'MACHINE', movementPattern: 'PUSH_VERTICAL' },

  // ═══════════════════════════════════════════════════════════════════════════════
  // BICEPS EXERCISES
  // ═══════════════════════════════════════════════════════════════════════════════

  // Barbell
  { name: 'Barbell Curl', primaryMuscles: ['BICEPS'], secondaryMuscles: ['FOREARMS'], equipment: 'BARBELL', movementPattern: 'PULL_VERTICAL' },
  { name: 'Close-Grip Barbell Curl', primaryMuscles: ['BICEPS'], secondaryMuscles: ['FOREARMS'], equipment: 'BARBELL', movementPattern: 'PULL_VERTICAL' },
  { name: 'Wide-Grip Barbell Curl', primaryMuscles: ['BICEPS'], secondaryMuscles: ['FOREARMS'], equipment: 'BARBELL', movementPattern: 'PULL_VERTICAL' },
  { name: 'Drag Curl', primaryMuscles: ['BICEPS'], secondaryMuscles: ['FOREARMS', 'BACK'], equipment: 'BARBELL', movementPattern: 'PULL_VERTICAL' },
  { name: 'Reverse Barbell Curl', primaryMuscles: ['BICEPS', 'FOREARMS'], secondaryMuscles: [], equipment: 'BARBELL', movementPattern: 'PULL_VERTICAL' },

  // Dumbbell
  { name: 'Dumbbell Curl', primaryMuscles: ['BICEPS'], secondaryMuscles: ['FOREARMS'], equipment: 'DUMBBELL', movementPattern: 'PULL_VERTICAL', isUnilateral: true },
  { name: 'Alternating Dumbbell Curl', primaryMuscles: ['BICEPS'], secondaryMuscles: ['FOREARMS'], equipment: 'DUMBBELL', movementPattern: 'PULL_VERTICAL', isUnilateral: true },
  { name: 'Incline Dumbbell Curl', primaryMuscles: ['BICEPS'], secondaryMuscles: ['FOREARMS'], equipment: 'DUMBBELL', movementPattern: 'PULL_VERTICAL' },
  { name: 'Hammer Curl', primaryMuscles: ['BICEPS', 'FOREARMS'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'PULL_VERTICAL', isUnilateral: true },
  { name: 'Concentration Curl', primaryMuscles: ['BICEPS'], secondaryMuscles: ['FOREARMS'], equipment: 'DUMBBELL', movementPattern: 'PULL_VERTICAL', isUnilateral: true },
  { name: 'Preacher Curl', primaryMuscles: ['BICEPS'], secondaryMuscles: ['FOREARMS'], equipment: 'DUMBBELL', movementPattern: 'PULL_VERTICAL' },
  { name: 'Cross-Body Hammer Curl', primaryMuscles: ['BICEPS', 'FOREARMS'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'PULL_VERTICAL', isUnilateral: true },

  // Cable
  { name: 'Cable Curl', primaryMuscles: ['BICEPS'], secondaryMuscles: ['FOREARMS'], equipment: 'CABLE', movementPattern: 'PULL_VERTICAL' },
  { name: 'Cable Hammer Curl', primaryMuscles: ['BICEPS', 'FOREARMS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PULL_VERTICAL' },
  { name: 'High Cable Curl', primaryMuscles: ['BICEPS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PULL_VERTICAL' },
  { name: 'Rope Cable Curl', primaryMuscles: ['BICEPS'], secondaryMuscles: ['FOREARMS'], equipment: 'CABLE', movementPattern: 'PULL_VERTICAL' },

  // Machine
  { name: 'Machine Bicep Curl', primaryMuscles: ['BICEPS'], secondaryMuscles: ['FOREARMS'], equipment: 'MACHINE', movementPattern: 'PULL_VERTICAL' },
  { name: 'Preacher Machine Curl', primaryMuscles: ['BICEPS'], secondaryMuscles: ['FOREARMS'], equipment: 'MACHINE', movementPattern: 'PULL_VERTICAL' },

  // ═══════════════════════════════════════════════════════════════════════════════
  // TRICEPS EXERCISES
  // ═══════════════════════════════════════════════════════════════════════════════

  // Barbell
  { name: 'Close-Grip Bench Press', primaryMuscles: ['TRICEPS'], secondaryMuscles: ['CHEST', 'SHOULDERS'], equipment: 'BARBELL', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Skull Crusher', primaryMuscles: ['TRICEPS'], secondaryMuscles: [], equipment: 'BARBELL', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Barbell Overhead Extension', primaryMuscles: ['TRICEPS'], secondaryMuscles: [], equipment: 'BARBELL', movementPattern: 'PUSH_VERTICAL' },

  // Dumbbell
  { name: 'Dumbbell Overhead Extension', primaryMuscles: ['TRICEPS'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'PUSH_VERTICAL', isUnilateral: true },
  { name: 'Tricep Kickback', primaryMuscles: ['TRICEPS'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'PUSH_HORIZONTAL', isUnilateral: true },
  { name: 'Dumbbell Skull Crusher', primaryMuscles: ['TRICEPS'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Dumbbell Close-Grip Press', primaryMuscles: ['TRICEPS'], secondaryMuscles: ['CHEST', 'SHOULDERS'], equipment: 'DUMBBELL', movementPattern: 'PUSH_HORIZONTAL' },

  // Cable
  { name: 'Tricep Pushdown', primaryMuscles: ['TRICEPS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Rope Pushdown', primaryMuscles: ['TRICEPS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PUSH_VERTICAL' },
  { name: 'V-Bar Pushdown', primaryMuscles: ['TRICEPS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Reverse-Grip Pushdown', primaryMuscles: ['TRICEPS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Cable Overhead Extension', primaryMuscles: ['TRICEPS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Cable Kickback', primaryMuscles: ['TRICEPS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PUSH_HORIZONTAL' },

  // Machine
  { name: 'Tricep Machine', primaryMuscles: ['TRICEPS'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Machine Overhead Extension', primaryMuscles: ['TRICEPS'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'PUSH_VERTICAL' },

  // Bodyweight
  { name: 'Dips (Triceps)', primaryMuscles: ['TRICEPS'], secondaryMuscles: ['CHEST', 'SHOULDERS'], equipment: 'BODYWEIGHT', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Diamond Push-Up', primaryMuscles: ['TRICEPS'], secondaryMuscles: ['CHEST', 'SHOULDERS'], equipment: 'BODYWEIGHT', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Close-Grip Push-Up', primaryMuscles: ['TRICEPS'], secondaryMuscles: ['CHEST', 'SHOULDERS'], equipment: 'BODYWEIGHT', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Bench Dip', primaryMuscles: ['TRICEPS'], secondaryMuscles: ['SHOULDERS'], equipment: 'BODYWEIGHT', movementPattern: 'PUSH_VERTICAL' },

  // ═══════════════════════════════════════════════════════════════════════════════
  // QUADS EXERCISES
  // ═══════════════════════════════════════════════════════════════════════════════

  // Barbell
  { name: 'Barbell Squat', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'HAMSTRINGS', 'ABS'], equipment: 'BARBELL', movementPattern: 'SQUAT' },
  { name: 'Front Squat', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'ABS'], equipment: 'BARBELL', movementPattern: 'SQUAT' },
  { name: 'Goblet Squat', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES'], equipment: 'DUMBBELL', movementPattern: 'SQUAT' },
  { name: 'Pause Squat', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES'], equipment: 'BARBELL', movementPattern: 'SQUAT' },
  { name: 'Box Squat', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], equipment: 'BARBELL', movementPattern: 'SQUAT' },
  { name: 'Zercher Squat', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'ABS'], equipment: 'BARBELL', movementPattern: 'SQUAT' },
  { name: 'Hack Squat', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES'], equipment: 'BARBELL', movementPattern: 'SQUAT' },

  // Dumbbell
  { name: 'Dumbbell Squat', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES'], equipment: 'DUMBBELL', movementPattern: 'SQUAT' },
  { name: 'Dumbbell Lunge', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], equipment: 'DUMBBELL', movementPattern: 'LUNGE', isUnilateral: true },
  { name: 'Walking Lunge', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], equipment: 'DUMBBELL', movementPattern: 'LUNGE', isUnilateral: true },
  { name: 'Bulgarian Split Squat', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES'], equipment: 'DUMBBELL', movementPattern: 'LUNGE', isUnilateral: true },
  { name: 'Step-Up', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES'], equipment: 'DUMBBELL', movementPattern: 'LUNGE', isUnilateral: true },

  // Machine
  { name: 'Leg Press', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], equipment: 'MACHINE', movementPattern: 'SQUAT' },
  { name: 'Hack Squat Machine', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES'], equipment: 'MACHINE', movementPattern: 'SQUAT' },
  { name: 'Leg Extension', primaryMuscles: ['QUADS'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'SQUAT', isUnilateral: true },
  { name: 'Smith Machine Squat', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], equipment: 'SMITH_MACHINE', movementPattern: 'SQUAT' },
  { name: 'Smith Machine Front Squat', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'ABS'], equipment: 'SMITH_MACHINE', movementPattern: 'SQUAT' },

  // Bodyweight
  { name: 'Bodyweight Squat', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], equipment: 'BODYWEIGHT', movementPattern: 'SQUAT' },
  { name: 'Jump Squat', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'CALVES'], equipment: 'BODYWEIGHT', movementPattern: 'SQUAT' },
  { name: 'Pistol Squat', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES'], equipment: 'BODYWEIGHT', movementPattern: 'SQUAT', isUnilateral: true },
  { name: 'Lunge', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], equipment: 'BODYWEIGHT', movementPattern: 'LUNGE', isUnilateral: true },
  { name: 'Forward Lunge', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], equipment: 'BODYWEIGHT', movementPattern: 'LUNGE', isUnilateral: true },
  { name: 'Reverse Lunge', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], equipment: 'BODYWEIGHT', movementPattern: 'LUNGE', isUnilateral: true },
  { name: 'Wall Sit', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES'], equipment: 'BODYWEIGHT', movementPattern: 'SQUAT' },
  { name: 'Step-Up (Bodyweight)', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES'], equipment: 'BODYWEIGHT', movementPattern: 'LUNGE', isUnilateral: true },

  // ═══════════════════════════════════════════════════════════════════════════════
  // HAMSTRINGS EXERCISES
  // ═══════════════════════════════════════════════════════════════════════════════

  // Barbell
  { name: 'Romanian Deadlift', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: ['GLUTES', 'BACK'], equipment: 'BARBELL', movementPattern: 'HINGE' },
  { name: 'Stiff-Leg Deadlift', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: ['GLUTES', 'BACK'], equipment: 'BARBELL', movementPattern: 'HINGE' },
  { name: 'Good Morning', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: ['GLUTES', 'BACK'], equipment: 'BARBELL', movementPattern: 'HINGE' },
  { name: 'Lying Leg Curl', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'HINGE' },
  { name: 'Seated Leg Curl', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'HINGE' },

  // Dumbbell
  { name: 'Dumbbell Romanian Deadlift', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: ['GLUTES', 'BACK'], equipment: 'DUMBBELL', movementPattern: 'HINGE' },
  { name: 'Single-Leg Romanian Deadlift', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: ['GLUTES', 'BACK'], equipment: 'DUMBBELL', movementPattern: 'HINGE', isUnilateral: true },
  { name: 'Dumbbell Good Morning', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: ['GLUTES', 'BACK'], equipment: 'DUMBBELL', movementPattern: 'HINGE' },

  // Cable
  { name: 'Cable Pull-Through', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: ['GLUTES'], equipment: 'CABLE', movementPattern: 'HINGE' },
  { name: 'Cable Romanian Deadlift', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: ['GLUTES', 'BACK'], equipment: 'CABLE', movementPattern: 'HINGE' },

  // Machine
  { name: 'Lying Leg Curl', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'HINGE' },
  { name: 'Seated Leg Curl', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'HINGE' },
  { name: 'Standing Leg Curl', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'HINGE', isUnilateral: true },
  { name: 'Reverse Hack Squat', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: ['GLUTES'], equipment: 'MACHINE', movementPattern: 'HINGE' },

  // Bodyweight
  { name: 'Nordic Curl', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: ['GLUTES'], equipment: 'BODYWEIGHT', movementPattern: 'HINGE' },
  { name: 'Glute-Ham Raise', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: ['GLUTES'], equipment: 'BODYWEIGHT', movementPattern: 'HINGE' },
  { name: 'Sliding Leg Curl', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: ['GLUTES'], equipment: 'BODYWEIGHT', movementPattern: 'HINGE' },

  // ═══════════════════════════════════════════════════════════════════════════════
  // GLUTES EXERCISES
  // ═══════════════════════════════════════════════════════════════════════════════

  // Barbell
  { name: 'Hip Thrust', primaryMuscles: ['GLUTES'], secondaryMuscles: ['HAMSTRINGS'], equipment: 'BARBELL', movementPattern: 'HINGE' },
  { name: 'Glute Bridge', primaryMuscles: ['GLUTES'], secondaryMuscles: ['HAMSTRINGS'], equipment: 'BARBELL', movementPattern: 'HINGE' },
  { name: 'Sumo Deadlift', primaryMuscles: ['GLUTES'], secondaryMuscles: ['QUADS', 'HAMSTRINGS', 'BACK'], equipment: 'BARBELL', movementPattern: 'HINGE' },
  { name: 'Conventional Deadlift', primaryMuscles: ['GLUTES', 'BACK'], secondaryMuscles: ['HAMSTRINGS', 'QUADS'], equipment: 'BARBELL', movementPattern: 'HINGE' },

  // Dumbbell
  { name: 'Dumbbell Hip Thrust', primaryMuscles: ['GLUTES'], secondaryMuscles: ['HAMSTRINGS'], equipment: 'DUMBBELL', movementPattern: 'HINGE' },
  { name: 'Dumbbell Glute Bridge', primaryMuscles: ['GLUTES'], secondaryMuscles: ['HAMSTRINGS'], equipment: 'DUMBBELL', movementPattern: 'HINGE' },
  { name: 'Dumbbell Sumo Squat', primaryMuscles: ['GLUTES'], secondaryMuscles: ['QUADS', 'HAMSTRINGS'], equipment: 'DUMBBELL', movementPattern: 'SQUAT' },
  { name: 'Dumbbell Kickback', primaryMuscles: ['GLUTES'], secondaryMuscles: ['HAMSTRINGS'], equipment: 'DUMBBELL', movementPattern: 'HINGE', isUnilateral: true },

  // Cable
  { name: 'Cable Kickback', primaryMuscles: ['GLUTES'], secondaryMuscles: ['HAMSTRINGS'], equipment: 'CABLE', movementPattern: 'HINGE', isUnilateral: true },
  { name: 'Cable Hip Abduction', primaryMuscles: ['GLUTES'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'HINGE', isUnilateral: true },

  // Machine
  { name: 'Hip Thrust Machine', primaryMuscles: ['GLUTES'], secondaryMuscles: ['HAMSTRINGS'], equipment: 'MACHINE', movementPattern: 'HINGE' },
  { name: 'Glute Machine', primaryMuscles: ['GLUTES'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'HINGE' },
  { name: 'Hip Abduction Machine', primaryMuscles: ['GLUTES'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'HINGE' },
  { name: 'Hip Adduction Machine', primaryMuscles: ['GLUTES'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'HINGE' },

  // Bodyweight
  { name: 'Glute Bridge', primaryMuscles: ['GLUTES'], secondaryMuscles: ['HAMSTRINGS'], equipment: 'BODYWEIGHT', movementPattern: 'HINGE' },
  { name: 'Single-Leg Glute Bridge', primaryMuscles: ['GLUTES'], secondaryMuscles: ['HAMSTRINGS'], equipment: 'BODYWEIGHT', movementPattern: 'HINGE', isUnilateral: true },
  { name: 'Frog Pump', primaryMuscles: ['GLUTES'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'HINGE' },
  { name: 'Donkey Kick', primaryMuscles: ['GLUTES'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'HINGE', isUnilateral: true },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CALVES EXERCISES
  // ═══════════════════════════════════════════════════════════════════════════════

  // Machine
  { name: 'Standing Calf Raise', primaryMuscles: ['CALVES'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'SQUAT' },
  { name: 'Seated Calf Raise', primaryMuscles: ['CALVES'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'SQUAT' },
  { name: 'Leg Press Calf Raise', primaryMuscles: ['CALVES'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'SQUAT' },
  { name: 'Donkey Calf Raise', primaryMuscles: ['CALVES'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'SQUAT' },

  // Dumbbell
  { name: 'Dumbbell Calf Raise', primaryMuscles: ['CALVES'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'SQUAT' },
  { name: 'Single-Leg Dumbbell Calf Raise', primaryMuscles: ['CALVES'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'SQUAT', isUnilateral: true },

  // Bodyweight
  { name: 'Bodyweight Calf Raise', primaryMuscles: ['CALVES'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'SQUAT' },
  { name: 'Single-Leg Calf Raise', primaryMuscles: ['CALVES'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'SQUAT', isUnilateral: true },
  { name: 'Jump Rope', primaryMuscles: ['CALVES'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CARDIO' },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ABS EXERCISES
  // ═══════════════════════════════════════════════════════════════════════════════

  // Bodyweight
  { name: 'Crunch', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'Reverse Crunch', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'Sit-Up', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'Leg Raise', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'Hanging Leg Raise', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'Hanging Knee Raise', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'Plank', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'Side Plank', primaryMuscles: ['ABS', 'OBLIQUES'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'Mountain Climber', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'Bicycle Crunch', primaryMuscles: ['ABS'], secondaryMuscles: ['OBLIQUES'], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'Russian Twist', primaryMuscles: ['ABS', 'OBLIQUES'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'Dead Bug', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'Bird Dog', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'Ab Wheel Rollout', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'V-Up', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'Toe Touch', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'Flutter Kick', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },
  { name: 'Scissor Kick', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'BODYWEIGHT', movementPattern: 'CORE' },

  // Machine
  { name: 'Ab Crunch Machine', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'CORE' },
  { name: 'Captain\'s Chair Leg Raise', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'CORE' },
  { name: 'Torso Rotation Machine', primaryMuscles: ['OBLIQUES'], secondaryMuscles: ['ABS'], equipment: 'MACHINE', movementPattern: 'CORE' },

  // Cable
  { name: 'Cable Crunch', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'CORE' },
  { name: 'Cable Woodchop', primaryMuscles: ['ABS', 'OBLIQUES'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'CORE' },
  { name: 'Cable Pallof Press', primaryMuscles: ['ABS', 'OBLIQUES'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'CORE' },

  // ═══════════════════════════════════════════════════════════════════════════════
  // FOREARMS EXERCISES
  // ═══════════════════════════════════════════════════════════════════════════════

  // Barbell
  { name: 'Barbell Wrist Curl', primaryMuscles: ['FOREARMS'], secondaryMuscles: [], equipment: 'BARBELL', movementPattern: 'CARRY' },
  { name: 'Barbell Reverse Wrist Curl', primaryMuscles: ['FOREARMS'], secondaryMuscles: [], equipment: 'BARBELL', movementPattern: 'CARRY' },

  // Dumbbell
  { name: 'Dumbbell Wrist Curl', primaryMuscles: ['FOREARMS'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'CARRY', isUnilateral: true },
  { name: 'Dumbbell Reverse Wrist Curl', primaryMuscles: ['FOREARMS'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'CARRY', isUnilateral: true },
  { name: 'Farmers Walk', primaryMuscles: ['FOREARMS'], secondaryMuscles: ['TRAPS', 'ABS'], equipment: 'DUMBBELL', movementPattern: 'CARRY' },

  // Bodyweight
  { name: 'Dead Hang', primaryMuscles: ['FOREARMS'], secondaryMuscles: ['LATS'], equipment: 'BODYWEIGHT', movementPattern: 'PULL_VERTICAL' },

  // ═══════════════════════════════════════════════════════════════════════════════
  // TRAPS EXERCISES
  // ═══════════════════════════════════════════════════════════════════════════════

  // Barbell
  { name: 'Barbell Shrugs', primaryMuscles: ['TRAPS'], secondaryMuscles: [], equipment: 'BARBELL', movementPattern: 'PULL_VERTICAL' },
  { name: 'Behind-Back Shrugs', primaryMuscles: ['TRAPS'], secondaryMuscles: [], equipment: 'BARBELL', movementPattern: 'PULL_VERTICAL' },

  // Dumbbell
  { name: 'Dumbbell Shrugs', primaryMuscles: ['TRAPS'], secondaryMuscles: [], equipment: 'DUMBBELL', movementPattern: 'PULL_VERTICAL', isUnilateral: true },
  { name: 'Dumbbell Upright Row', primaryMuscles: ['TRAPS', 'SHOULDERS'], secondaryMuscles: ['BICEPS'], equipment: 'DUMBBELL', movementPattern: 'PULL_VERTICAL' },

  // Cable
  { name: 'Cable Shrugs', primaryMuscles: ['TRAPS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PULL_VERTICAL' },
  { name: 'Cable Face Pull', primaryMuscles: ['TRAPS', 'SHOULDERS'], secondaryMuscles: [], equipment: 'CABLE', movementPattern: 'PULL_HORIZONTAL' },

  // Machine
  { name: 'Machine Shrugs', primaryMuscles: ['TRAPS'], secondaryMuscles: [], equipment: 'MACHINE', movementPattern: 'PULL_VERTICAL' },

  // ═══════════════════════════════════════════════════════════════════════════════
  // COMPOUND / FULL BODY
  // ═══════════════════════════════════════════════════════════════════════════════

  // Barbell
  { name: 'Power Clean', primaryMuscles: ['QUADS', 'GLUTES'], secondaryMuscles: ['BACK', 'TRAPS', 'HAMSTRINGS'], equipment: 'BARBELL', movementPattern: 'HINGE' },
  { name: 'Clean and Jerk', primaryMuscles: ['QUADS', 'GLUTES', 'SHOULDERS'], secondaryMuscles: ['BACK', 'TRAPS', 'TRICEPS'], equipment: 'BARBELL', movementPattern: 'HINGE' },
  { name: 'Snatch', primaryMuscles: ['QUADS', 'GLUTES'], secondaryMuscles: ['BACK', 'SHOULDERS', 'TRAPS'], equipment: 'BARBELL', movementPattern: 'HINGE' },
  { name: 'Clean', primaryMuscles: ['QUADS', 'GLUTES'], secondaryMuscles: ['BACK', 'TRAPS', 'HAMSTRINGS'], equipment: 'BARBELL', movementPattern: 'HINGE' },

  // Kettlebell
  { name: 'Kettlebell Swing', primaryMuscles: ['GLUTES', 'HAMSTRINGS'], secondaryMuscles: ['QUADS', 'ABS', 'TRAPS'], equipment: 'KETTLEBELL', movementPattern: 'HINGE' },
  { name: 'Kettlebell Goblet Squat', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'ABS'], equipment: 'KETTLEBELL', movementPattern: 'SQUAT' },
  { name: 'Kettlebell Turkish Get-Up', primaryMuscles: ['ABS', 'SHOULDERS'], secondaryMuscles: ['QUADS', 'GLUTES'], equipment: 'KETTLEBELL', movementPattern: 'CORE' },
  { name: 'Kettlebell Snatch', primaryMuscles: ['SHOULDERS', 'GLUTES'], secondaryMuscles: ['QUADS', 'TRAPS', 'ABS'], equipment: 'KETTLEBELL', movementPattern: 'HINGE' },
  { name: 'Kettlebell Clean', primaryMuscles: ['GLUTES', 'BACK'], secondaryMuscles: ['TRAPS', 'BICEPS'], equipment: 'KETTLEBELL', movementPattern: 'HINGE' },
  { name: 'Kettlebell Thruster', primaryMuscles: ['QUADS', 'SHOULDERS'], secondaryMuscles: ['GLUTES', 'TRICEPS', 'ABS'], equipment: 'KETTLEBELL', movementPattern: 'SQUAT' },

  // Resistance Band
  { name: 'Band Pull-Apart', primaryMuscles: ['TRAPS', 'SHOULDERS'], secondaryMuscles: [], equipment: 'RESISTANCE_BAND', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Band Face Pull', primaryMuscles: ['TRAPS', 'SHOULDERS'], secondaryMuscles: [], equipment: 'RESISTANCE_BAND', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Band Squat', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES'], equipment: 'RESISTANCE_BAND', movementPattern: 'SQUAT' },
  { name: 'Band Good Morning', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: ['GLUTES', 'BACK'], equipment: 'RESISTANCE_BAND', movementPattern: 'HINGE' },
  { name: 'Band Chest Press', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: 'RESISTANCE_BAND', movementPattern: 'PUSH_HORIZONTAL' },
  { name: 'Band Row', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS', 'LATS'], equipment: 'RESISTANCE_BAND', movementPattern: 'PULL_HORIZONTAL' },
  { name: 'Band Bicep Curl', primaryMuscles: ['BICEPS'], secondaryMuscles: ['FOREARMS'], equipment: 'RESISTANCE_BAND', movementPattern: 'PULL_VERTICAL' },
  { name: 'Band Tricep Extension', primaryMuscles: ['TRICEPS'], secondaryMuscles: [], equipment: 'RESISTANCE_BAND', movementPattern: 'PUSH_VERTICAL' },
  { name: 'Band Lateral Walk', primaryMuscles: ['GLUTES'], secondaryMuscles: [], equipment: 'RESISTANCE_BAND', movementPattern: 'HINGE' },
  { name: 'Band Hip Abduction', primaryMuscles: ['GLUTES'], secondaryMuscles: [], equipment: 'RESISTANCE_BAND', movementPattern: 'HINGE' },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CARDIO / CONDITIONING
  // ═══════════════════════════════════════════════════════════════════════════════

  // Machine
  { name: 'Treadmill Run', primaryMuscles: ['QUADS', 'CALVES'], secondaryMuscles: ['HAMSTRINGS'], equipment: 'MACHINE', movementPattern: 'CARDIO' },
  { name: 'Elliptical', primaryMuscles: ['QUADS', 'GLUTES'], secondaryMuscles: ['CALVES', 'HAMSTRINGS'], equipment: 'MACHINE', movementPattern: 'CARDIO' },
  { name: 'Rowing Machine', primaryMuscles: ['BACK', 'QUADS'], secondaryMuscles: ['BICEPS', 'LATS', 'GLUTES'], equipment: 'MACHINE', movementPattern: 'CARDIO' },
  { name: 'Stair Climber', primaryMuscles: ['QUADS', 'GLUTES'], secondaryMuscles: ['CALVES', 'HAMSTRINGS'], equipment: 'MACHINE', movementPattern: 'CARDIO' },
  { name: 'Assault Bike', primaryMuscles: ['QUADS', 'BACK'], secondaryMuscles: ['SHOULDERS', 'CALVES', 'ABS'], equipment: 'MACHINE', movementPattern: 'CARDIO' },
  { name: 'Ski Erg', primaryMuscles: ['BACK', 'SHOULDERS'], secondaryMuscles: ['BICEPS', 'ABS'], equipment: 'MACHINE', movementPattern: 'CARDIO' },
  { name: 'VersaClimber', primaryMuscles: ['QUADS', 'SHOULDERS'], secondaryMuscles: ['BACK', 'GLUTES', 'CALVES'], equipment: 'MACHINE', movementPattern: 'CARDIO' },
  { name: 'Arc Trainer', primaryMuscles: ['QUADS', 'GLUTES'], secondaryMuscles: ['CALVES', 'HAMSTRINGS'], equipment: 'MACHINE', movementPattern: 'CARDIO' },
  { name: 'Spin Bike', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], equipment: 'MACHINE', movementPattern: 'CARDIO' },
];

async function main() {
  console.log('🌱 Starting exercise database seeding...\n');

  let createdCount = 0;
  let skippedCount = 0;

  for (const exercise of exercises) {
    try {
      // Check if exercise already exists
      const existing = await prisma.exercise.findFirst({
        where: { name: exercise.name },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      await prisma.exercise.create({
        data: {
          name: exercise.name,
          primaryMuscles: exercise.primaryMuscles as any,
          secondaryMuscles: exercise.secondaryMuscles as any,
          equipment: exercise.equipment as any,
          movementPattern: exercise.movementPattern as any,
          isUnilateral: exercise.isUnilateral || false,
          isCustom: false,
          isActive: true,
        },
      });
      createdCount++;
    } catch (error) {
      console.error(`Error creating exercise "${exercise.name}":`, error);
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   Created: ${createdCount} exercises`);
  console.log(`   Skipped: ${skippedCount} (already exist)`);
  console.log(`   Total in DB: ${createdCount + skippedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
