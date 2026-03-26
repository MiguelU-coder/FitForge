// lib/features/exercises/presentation/providers/exercises_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/exercise_model.dart';
import '../../data/sources/exercises_remote_source.dart';

// ── Filter state ──────────────────────────────────────────────────────────────

class ExerciseFilters {
  final String search;
  final String? muscle;
  final String? equipment;
  final bool useExternal;

  const ExerciseFilters({
    this.search = '',
    this.muscle,
    this.equipment,
    this.useExternal = true, // Force API usage by default
  });

  ExerciseFilters copyWith({
    String? search,
    String? muscle,
    String? equipment,
    bool? useExternal,
    bool clearMuscle = false,
    bool clearEquipment = false,
  }) => ExerciseFilters(
    search: search ?? this.search,
    muscle: clearMuscle ? null : (muscle ?? this.muscle),
    equipment: clearEquipment ? null : (equipment ?? this.equipment),
    useExternal: useExternal ?? this.useExternal,
  );
}

// ── Filter provider ───────────────────────────────────────────────────────────

final exerciseFiltersProvider = StateProvider<ExerciseFilters>(
  (_) => const ExerciseFilters(), // now default is true
);

// ── Exercises list provider (reactive a los filtros) ──────────────────────────

final exercisesProvider = FutureProvider.autoDispose<ExercisesPage>((
  ref,
) async {
  final filters = ref.watch(exerciseFiltersProvider);
  final source = ref.read(exercisesRemoteSourceProvider);

  // Debounce: esperar 400ms después del último cambio en búsqueda
  // para no llamar al API en cada keystroke
  if (filters.search.isNotEmpty) {
    await Future.delayed(const Duration(milliseconds: 400));
    // Si el provider fue cancelado durante el delay, salir
    ref.keepAlive();
  }

  return source.getExercises(
    search: filters.search,
    muscle: filters.muscle,
    equipment: filters.equipment,
    useExternal: filters.useExternal,
    limit: 50,
  );
});

// ── Constantes de filtros ──────────────────────────────────────────────────────

const kMuscleGroups = [
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
];

const kEquipment = [
  'BARBELL',
  'DUMBBELL',
  'CABLE',
  'MACHINE',
  'BODYWEIGHT',
  'KETTLEBELL',
  'RESISTANCE_BAND',
];

// Label legible para los valores del enum
String muscleLabel(String m) => m
    .replaceAll('_', ' ')
    .toLowerCase()
    .split(' ')
    .map((w) => w[0].toUpperCase() + w.substring(1))
    .join(' ');

String equipmentLabel(String e) => muscleLabel(e);
