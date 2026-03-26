// lib/features/exercises/data/sources/exercises_remote_source.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../models/exercise_model.dart';

final exercisesRemoteSourceProvider = Provider<ExercisesRemoteSource>((ref) {
  return ExercisesRemoteSource(ref.read(apiClientProvider));
});

class ExercisesRemoteSource {
  final ApiClient _client;
  ExercisesRemoteSource(this._client);

  Future<ExercisesPage> getExercises({
    String? search,
    String? muscle,
    String? equipment,
    bool useExternal = false,
    int page = 1,
    int limit = 20,
  }) async {
    final params = <String, dynamic>{'page': page, 'limit': limit};
    if (search != null && search.isNotEmpty) params['search'] = search;
    if (muscle != null) params['muscle'] = muscle;
    if (equipment != null) params['equipment'] = equipment;
    if (useExternal == true) params['useExternal'] = 'true';

    final data = await _client.get<Map<String, dynamic>>(
      '/exercises',
      queryParameters: params,
    );
    return ExercisesPage.fromJson(data);
  }

  Future<Exercise> createCustom({
    required String name,
    required List<String> primaryMuscles,
    String? equipment,
    String? instructions,
  }) async {
    final data = await _client.post<Map<String, dynamic>>(
      '/exercises',
      data: {
        'name': name,
        'primaryMuscles': primaryMuscles,
        if (equipment != null) 'equipment': equipment,
        if (instructions != null) 'instructions': instructions,
      },
    );
    return Exercise.fromJson(data);
  }
}
