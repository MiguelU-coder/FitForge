// lib/features/workouts/presentation/providers/workouts_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/workout_models.dart';
import '../../data/sources/workouts_remote_source.dart';
import '../../../../core/api/api_exception.dart';

// ── Active session state ──────────────────────────────────────────────────────

class ActiveSessionState {
  final WorkoutSession? session;
  final bool isLoading;
  final String? error;
  final Map<String, LastPerformance?> lastPerformances;

  const ActiveSessionState({
    this.session,
    this.isLoading = false,
    this.error,
    this.lastPerformances = const {},
  });

  bool get hasActiveSession => session != null && session!.isActive;

  ActiveSessionState copyWith({
    WorkoutSession? session,
    bool? isLoading,
    String? error,
    Map<String, LastPerformance?>? lastPerformances,
    bool clearSession = false,
    bool clearError = false,
  }) => ActiveSessionState(
    session: clearSession ? null : (session ?? this.session),
    isLoading: isLoading ?? this.isLoading,
    error: clearError ? null : (error ?? this.error),
    lastPerformances: lastPerformances ?? this.lastPerformances,
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

final activeSessionProvider =
    StateNotifierProvider<ActiveSessionNotifier, ActiveSessionState>((ref) {
      return ActiveSessionNotifier(ref, ref.read(workoutsRemoteSourceProvider));
    });

class ActiveSessionNotifier extends StateNotifier<ActiveSessionState> {
  final Ref ref;
  final WorkoutsRemoteSource _remote;

  ActiveSessionNotifier(this.ref, this._remote)
    : super(const ActiveSessionState()) {
    checkForActiveSession();
  }

  Future<void> checkForActiveSession() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final session = await _remote.getActiveSession();
      if (session == null) {
        state = state.copyWith(clearSession: true, isLoading: false);
      } else {
        state = state.copyWith(session: session, isLoading: false);
      }

      if (state.session != null) {
        for (final block in state.session!.exerciseBlocks) {
          fetchLastPerformance(block.exerciseId);
        }
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> startSession({String? name, String? routineId}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final session = await _remote.startSession(
        name: name,
        routineId: routineId,
      );
      state = state.copyWith(session: session, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> addExercise(String exerciseId) async {
    final session = state.session;
    if (session == null) return;

    try {
      final block = await _remote.addBlock(
        session.id,
        exerciseId: exerciseId,
        sortOrder: session.exerciseBlocks.length,
      );

      // Actualizar estado local con el nuevo bloque
      final updatedBlocks = [...session.exerciseBlocks, block];
      final updatedSession = WorkoutSession(
        id: session.id,
        name: session.name,
        startedAt: session.startedAt,
        exerciseBlocks: updatedBlocks,
      );
      state = state.copyWith(session: updatedSession);
      // Fetch performance for new exercise
      fetchLastPerformance(exerciseId);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> fetchLastPerformance(String exerciseId) async {
    if (state.lastPerformances.containsKey(exerciseId)) return;
    try {
      final perf = await _remote.getLastPerformance(exerciseId);
      state = state.copyWith(
        lastPerformances: {...state.lastPerformances, exerciseId: perf},
      );
    } catch (_) {}
  }

  Future<void> logSet({
    required String blockId,
    String? setId,
    required int setNumber,
    double? weightKg,
    double? weightKgLeft,
    double? weightKgRight,
    int? reps,
    int? repsLeft,
    int? repsRight,
    int? rir,
    bool isFailed = false,
    String setType = 'WORKING',
  }) async {
    final session = state.session;
    if (session == null) return;

    try {
      final newSet = await _remote.logSet(
        blockId,
        setId: setId,
        setNumber: setNumber,
        weightKg: weightKg,
        weightKgLeft: weightKgLeft,
        weightKgRight: weightKgRight,
        reps: reps,
        repsLeft: repsLeft,
        repsRight: repsRight,
        rir: rir,
        isFailed: isFailed,
        setType: setType,
      );

      // Insertar o actualizar el set en el bloque correcto
      final updatedBlocks = session.exerciseBlocks.map((block) {
        if (block.id != blockId) return block;

        List<SetLog> updatedSets;
        if (setId != null) {
          updatedSets = block.sets
              .map((s) => s.id == setId ? newSet : s)
              .toList();
        } else {
          updatedSets = [...block.sets, newSet];
        }

        return ExerciseBlock(
          id: block.id,
          exerciseId: block.exerciseId,
          exerciseName: block.exerciseName,
          primaryMuscles: block.primaryMuscles,
          isUnilateral: block.isUnilateral,
          sortOrder: block.sortOrder,
          sets: updatedSets,
        );
      }).toList();

      state = state.copyWith(
        session: WorkoutSession(
          id: session.id,
          name: session.name,
          startedAt: session.startedAt,
          exerciseBlocks: updatedBlocks,
        ),
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> deleteSet({
    required String blockId,
    required String setId,
  }) async {
    final session = state.session;
    if (session == null) return;

    try {
      await _remote.deleteSet(blockId, setId);

      // Actualizar estado local
      final updatedBlocks = session.exerciseBlocks.map((block) {
        if (block.id != blockId) return block;
        return ExerciseBlock(
          id: block.id,
          exerciseId: block.exerciseId,
          exerciseName: block.exerciseName,
          primaryMuscles: block.primaryMuscles,
          isUnilateral: block.isUnilateral,
          sortOrder: block.sortOrder,
          sets: block.sets.where((s) => s.id != setId).toList(),
        );
      }).toList();

      state = state.copyWith(
        session: WorkoutSession(
          id: session.id,
          name: session.name,
          startedAt: session.startedAt,
          exerciseBlocks: updatedBlocks,
        ),
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> unlogSet({
    required String blockId,
    required String setId,
  }) async {
    final session = state.session;
    if (session == null) return;

    try {
      final unloggedSet = await _remote.unlogSet(blockId, setId);

      // Actualizar estado local
      final updatedBlocks = session.exerciseBlocks.map((block) {
        if (block.id != blockId) return block;

        final updatedSets =
            block.sets.map((s) => s.id == setId ? unloggedSet : s).toList();

        return ExerciseBlock(
          id: block.id,
          exerciseId: block.exerciseId,
          exerciseName: block.exerciseName,
          primaryMuscles: block.primaryMuscles,
          isUnilateral: block.isUnilateral,
          sortOrder: block.sortOrder,
          sets: updatedSets,
        );
      }).toList();

      state = state.copyWith(
        session: WorkoutSession(
          id: session.id,
          name: session.name,
          startedAt: session.startedAt,
          exerciseBlocks: updatedBlocks,
        ),
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> removeExercise({required String blockId}) async {
    final session = state.session;
    if (session == null) return;

    try {
      await _remote.deleteBlock(session.id, blockId);

      // Actualizar estado local
      final updatedBlocks = session.exerciseBlocks
          .where((b) => b.id != blockId)
          .toList();

      state = state.copyWith(
        session: WorkoutSession(
          id: session.id,
          name: session.name,
          startedAt: session.startedAt,
          exerciseBlocks: updatedBlocks,
        ),
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> finishSession({int? rpe, int? durationSeconds}) async {
    final session = state.session;
    if (session == null || state.isLoading) return;

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _remote.finishSession(session.id, perceivedExertion: rpe);
      state = state.copyWith(
        clearSession: true,
        isLoading: false,
        lastPerformances: {},
      );
      // Actualizar historial
      ref.invalidate(workoutHistoryProvider);
    } on ApiException catch (e) {
      if (e.isForbidden && e.message.contains('Session already finished')) {
        // Idempotencia: si ya estaba finalizada, lo tratamos como éxito
        state = state.copyWith(
          clearSession: true,
          isLoading: false,
          lastPerformances: {},
        );
        ref.invalidate(workoutHistoryProvider);
      } else {
        state = state.copyWith(isLoading: false, error: e.toString());
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> cancelSession() async {
    final session = state.session;
    if (session == null || state.isLoading) return;

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _remote.cancelSession(session.id);
      state = state.copyWith(
        clearSession: true,
        isLoading: false,
        lastPerformances: {},
      );
      // Actualizar historial
      ref.invalidate(workoutHistoryProvider);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> reorderExercises(int oldIndex, int newIndex) async {
    final session = state.session;
    if (session == null) return;

    if (oldIndex < newIndex) {
      newIndex -= 1;
    }

    final updatedBlocks = List<ExerciseBlock>.from(session.exerciseBlocks);
    final block = updatedBlocks.removeAt(oldIndex);
    updatedBlocks.insert(newIndex, block);

    // Update sortOrder for each block
    final reindexed = <ExerciseBlock>[];
    final blocksConfig = <Map<String, dynamic>>[];
    for (int i = 0; i < updatedBlocks.length; i++) {
      final b = updatedBlocks[i];
      reindexed.add(
        ExerciseBlock(
          id: b.id,
          exerciseId: b.exerciseId,
          exerciseName: b.exerciseName,
          primaryMuscles: b.primaryMuscles,
          isUnilateral: b.isUnilateral,
          sortOrder: i,
          sets: b.sets,
        ),
      );
      blocksConfig.add({'id': b.id, 'sortOrder': i});
    }

    // Optimistic update
    state = state.copyWith(
      session: WorkoutSession(
        id: session.id,
        name: session.name,
        startedAt: session.startedAt,
        exerciseBlocks: reindexed,
      ),
    );

    // Sync to backend silently
    try {
      await _remote.reorderBlocks(session.id, blocksConfig);
    } catch (e) {
      state = state.copyWith(error: 'Failed to save new order');
    }
  }

  void clearError() => state = state.copyWith(clearError: true);
}

// ── History provider ──────────────────────────────────────────────────────────

final workoutHistoryProvider = FutureProvider.autoDispose<List<WorkoutSession>>(
  (ref) {
    final source = ref.read(workoutsRemoteSourceProvider);
    return source.getHistory();
  },
);
