// lib/features/workouts/presentation/providers/routines_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';

class RoutineTemplate {
  final String id;
  final String programId;
  final String name;
  final int? dayOfWeek;
  final int sortOrder;
  final List<RoutineItem> items;

  RoutineTemplate({
    required this.id,
    required this.programId,
    required this.name,
    this.dayOfWeek,
    required this.sortOrder,
    this.items = const [],
  });

  factory RoutineTemplate.fromJson(Map<String, dynamic> json) {
    return RoutineTemplate(
      id: json['id'] as String,
      programId: json['programId'] as String,
      name: json['name'] as String,
      dayOfWeek: json['dayOfWeek'] as int?,
      sortOrder: json['sortOrder'] as int,
      items: (json['routineItems'] as List<dynamic>? ?? [])
          .map((i) => RoutineItem.fromJson(i as Map<String, dynamic>))
          .toList(),
    );
  }
}

class RoutineItem {
  final String id;
  final String exerciseId;
  final String exerciseName;
  final List<String> primaryMuscles;
  final int sortOrder;
  final int? targetSets;
  final int? targetReps;
  final int? targetRir;

  RoutineItem({
    required this.id,
    required this.exerciseId,
    required this.exerciseName,
    this.primaryMuscles = const [],
    required this.sortOrder,
    this.targetSets,
    this.targetReps,
    this.targetRir,
  });

  factory RoutineItem.fromJson(Map<String, dynamic> json) {
    final ex = json['exercise'] as Map<String, dynamic>?;
    return RoutineItem(
      id: json['id'] as String,
      exerciseId: json['exerciseId'] as String,
      exerciseName: ex?['name'] as String? ?? 'Unknown',
      primaryMuscles:
          (ex?['primaryMuscles'] as List<dynamic>?)
              ?.map((m) => m as String)
              .toList() ??
          [],
      sortOrder: json['sortOrder'] as int,
      targetSets: json['targetSets'] as int?,
      targetReps: json['targetReps'] as int?,
      targetRir: json['targetRir'] as int?,
    );
  }
}

class RoutineTemplatesNotifier extends AsyncNotifier<List<RoutineTemplate>> {
  @override
  Future<List<RoutineTemplate>> build() async {
    return fetchTemplates();
  }

  Future<List<RoutineTemplate>> fetchTemplates() async {
    final client = ref.read(apiClientProvider);

    // El backend agrupa las rutinas bajo programas, primero traemos el global /programs
    final res = await client.get('/programs');
    final data = res as List<dynamic>;

    // Extraemos todas las rutinas de todos los programas para mostrarlas en una lista unificada
    List<RoutineTemplate> allTemplates = [];
    for (var prog in data) {
      final routinesVal = prog['routines'] as List<dynamic>? ?? [];
      allTemplates.addAll(
        routinesVal.map(
          (r) => RoutineTemplate.fromJson(r as Map<String, dynamic>),
        ),
      );
    }

    return allTemplates;
  }

  Future<void> createProgramAndRoutine(
    String programName,
    String routineName,
    String? goal,
    int? weeks,
  ) async {
    final client = ref.read(apiClientProvider);
    state = const AsyncValue.loading();
    try {
      // 1) Crear "Container Program"
      final progRes = await client.post(
        '/programs',
        data: {
          'name': programName,
          if (goal != null && goal.trim().isNotEmpty) 'goal': goal.trim(),
          if (weeks != null) 'durationWeeks': weeks,
        },
      );
      final Map<String, dynamic> progData = progRes as Map<String, dynamic>;
      final progId = progData['id'];

      // 2) Crear Rutina
      await client.post(
        '/programs/routines',
        data: {'programId': progId, 'name': routineName},
      );

      ref.invalidateSelf();
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> deleteRoutine(String routineId) async {
    final client = ref.read(apiClientProvider);
    state = const AsyncValue.loading();
    try {
      await client.delete('/programs/routines/$routineId');
      ref.invalidateSelf();
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> addExerciseToRoutine(
    String routineId,
    String exerciseId,
    int sets,
    int reps,
    int rir,
  ) async {
    final client = ref.read(apiClientProvider);
    state = const AsyncValue.loading();
    try {
      await client.post(
        '/programs/routine-items',
        data: {
          'routineId': routineId,
          'exerciseId': exerciseId,
          'targetSets': sets,
          'targetReps': reps,
          'targetRir': rir,
        },
      );
      ref.invalidateSelf();
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final routineTemplatesProvider =
    AsyncNotifierProvider<RoutineTemplatesNotifier, List<RoutineTemplate>>(
      () => RoutineTemplatesNotifier(),
    );
