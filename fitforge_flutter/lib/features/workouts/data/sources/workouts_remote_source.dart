// lib/features/workouts/data/sources/workouts_remote_source.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../models/workout_models.dart';

final workoutsRemoteSourceProvider = Provider<WorkoutsRemoteSource>((ref) {
  return WorkoutsRemoteSource(ref.read(apiClientProvider));
});

class WorkoutsRemoteSource {
  final ApiClient _client;
  WorkoutsRemoteSource(this._client);

  Future<WorkoutSession> startSession({String? name, String? routineId}) async {
    final Map<String, dynamic> body = {
      'name':
          name ??
          'Workout ${DateTime.now().toLocal().toString().split(' ')[0]}',
    };
    if (routineId != null) {
      body['routineId'] = routineId;
    }

    final data = await _client.post<Map<String, dynamic>>(
      '/workouts/sessions/start',
      data: body,
    );
    return WorkoutSession.fromJson(data);
  }

  Future<WorkoutSession?> getActiveSession() async {
    try {
      final data = await _client.get<Map<String, dynamic>?>(
        '/workouts/sessions/active',
      );
      if (data == null) return null;
      return WorkoutSession.fromJson(data);
    } catch (_) {
      return null;
    }
  }

  Future<WorkoutSession> finishSession(
    String sessionId, {
    int? perceivedExertion,
  }) async {
    // ✅ Construir body sin null-aware elements
    final body = <String, dynamic>{};
    if (perceivedExertion != null) {
      body['perceivedExertion'] = perceivedExertion;
    }

    final data = await _client.patch<Map<String, dynamic>>(
      '/workouts/sessions/$sessionId/finish',
      data: body,
    );
    return WorkoutSession.fromJson(data);
  }

  Future<ExerciseBlock> addBlock(
    String sessionId, {
    required String exerciseId,
    required int sortOrder,
  }) async {
    final data = await _client.post<Map<String, dynamic>>(
      '/workouts/sessions/$sessionId/blocks',
      data: {
        'exerciseId': exerciseId,
        'sortOrder': sortOrder,
        'blockType': 'NORMAL',
      },
    );
    return ExerciseBlock.fromJson(data);
  }

  Future<SetLog> logSet(
    String blockId, {
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
    final body = <String, dynamic>{
      'setNumber': setNumber,
      'setType': setType,
      'isFailed': isFailed,
    };
    if (weightKg != null) body['weightKg'] = weightKg;
    if (weightKgLeft != null) body['weightKgLeft'] = weightKgLeft;
    if (weightKgRight != null) body['weightKgRight'] = weightKgRight;
    if (reps != null) body['reps'] = reps;
    if (repsLeft != null) body['repsLeft'] = repsLeft;
    if (repsRight != null) body['repsRight'] = repsRight;
    if (rir != null) body['rir'] = rir;

    if (setId != null) {
      final data = await _client.patch<Map<String, dynamic>>(
        '/workouts/blocks/$blockId/sets/$setId',
        data: body,
      );
      return SetLog.fromJson(data);
    } else {
      final data = await _client.post<Map<String, dynamic>>(
        '/workouts/blocks/$blockId/sets',
        data: body,
      );
      return SetLog.fromJson(data);
    }
  }

  Future<List<WorkoutSession>> getHistory({int page = 1}) async {
    final data = await _client.get<Map<String, dynamic>>(
      '/workouts/sessions',
      queryParameters: {'page': page, 'limit': 15},
    );
    return (data['sessions'] as List<dynamic>)
        .map((s) => WorkoutSession.fromJson(s as Map<String, dynamic>))
        .toList();
  }

  Future<void> deleteBlock(String sessionId, String blockId) async {
    await _client.delete('/workouts/sessions/$sessionId/blocks/$blockId');
  }

  Future<void> deleteSet(String blockId, String setId) async {
    await _client.delete('/workouts/blocks/$blockId/sets/$setId');
  }

  Future<SetLog> unlogSet(String blockId, String setId) async {
    final data = await _client.patch<Map<String, dynamic>>(
      '/workouts/blocks/$blockId/sets/$setId',
      data: {'unlog': true},
    );
    return SetLog.fromJson(data);
  }

  Future<void> cancelSession(String sessionId) async {
    await _client.delete('/workouts/sessions/$sessionId');
  }

  Future<void> reorderBlocks(
    String sessionId,
    List<Map<String, dynamic>> blocksConfig,
  ) async {
    await _client.patch(
      '/workouts/sessions/$sessionId/blocks/reorder',
      data: {'blocks': blocksConfig},
    );
  }

  Future<LastPerformance?> getLastPerformance(String exerciseId) async {
    try {
      final data = await _client.get<Map<String, dynamic>?>(
        '/workouts/exercises/$exerciseId/last-performance',
      );
      if (data == null) return null;
      return LastPerformance.fromJson(data);
    } catch (_) {
      return null;
    }
  }
}
