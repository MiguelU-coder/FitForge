// lib/features/exercises/data/models/exercise_model.dart

import '../../../../core/utils/app_constants.dart';

class Exercise {
  final String id;
  final String name;
  final List<String> primaryMuscles;
  final List<String> secondaryMuscles;
  final String? equipment;
  final String? movementPattern;
  final bool isUnilateral;
  final bool isCustom;
  final String? imageUrl;
  final bool isExternal;

  const Exercise({
    required this.id,
    required this.name,
    required this.primaryMuscles,
    required this.secondaryMuscles,
    this.equipment,
    this.movementPattern,
    required this.isUnilateral,
    required this.isCustom,
    this.imageUrl,
    this.isExternal = false,
  });

  factory Exercise.fromJson(Map<String, dynamic> json) {
    final rawImageUrl = json['imageUrl'] as String?;

    // Si es una ruta relativa del proxy (ej: /api/v1/exercises/image/0001),
    // construir URL absoluta con la base del backend.
    String? absoluteImageUrl;
    if (rawImageUrl != null && rawImageUrl.isNotEmpty) {
      if (rawImageUrl.startsWith('http')) {
        absoluteImageUrl = rawImageUrl;
      } else {
        // Extraer la base host del baseUrl (sin el path /api/v1)
        final baseUri = Uri.parse(AppConstants.baseUrl);
        final hostBase = '${baseUri.scheme}://${baseUri.host}:${baseUri.port}';
        absoluteImageUrl = '$hostBase$rawImageUrl';
      }
    }

    return Exercise(
      id: json['id'] as String,
      name: json['name'] as String,
      primaryMuscles: (json['primaryMuscles'] as List<dynamic>).cast<String>(),
      secondaryMuscles: (json['secondaryMuscles'] as List<dynamic>? ?? [])
          .cast<String>(),
      equipment: json['equipment'] as String?,
      movementPattern: json['movementPattern'] as String?,
      isUnilateral: json['isUnilateral'] as bool? ?? false,
      isCustom: json['isCustom'] as bool? ?? false,
      imageUrl: absoluteImageUrl,
      isExternal: json['isExternal'] as bool? ?? false,
    );
  }
}

class ExercisesPage {
  final List<Exercise> exercises;
  final int total;
  final int page;
  final int totalPages;

  const ExercisesPage({
    required this.exercises,
    required this.total,
    required this.page,
    required this.totalPages,
  });

  factory ExercisesPage.fromJson(Map<String, dynamic> json) => ExercisesPage(
    exercises: (json['exercises'] as List<dynamic>)
        .map((e) => Exercise.fromJson(e as Map<String, dynamic>))
        .toList(),
    total: json['total'] as int,
    page: json['page'] as int,
    totalPages: json['totalPages'] as int,
  );
}
