// lib/features/workouts/data/models/workout_models.dart

class WorkoutSession {
  final String id;
  final String name;
  final DateTime startedAt;
  final DateTime? finishedAt;
  final int? durationSeconds;
  final int? perceivedExertion;
  final double? bodyWeightKg;
  final String? notes;
  final List<ExerciseBlock> exerciseBlocks;
  final int? exerciseBlockCount; // from _count in lightweight queries

  const WorkoutSession({
    required this.id,
    required this.name,
    required this.startedAt,
    this.finishedAt,
    this.durationSeconds,
    this.perceivedExertion,
    this.bodyWeightKg,
    this.notes,
    this.exerciseBlocks = const [],
    this.exerciseBlockCount,
  });

  bool get isActive => finishedAt == null;

  /// Returns exercise count from either the full list or the lightweight _count
  int get exerciseCount => exerciseBlockCount ?? exerciseBlocks.length;

  factory WorkoutSession.fromJson(Map<String, dynamic> json) {
    // Parse _count if present (lightweight history queries)
    final countObj = json['_count'] as Map<String, dynamic>?;
    final blockCount = countObj?['exerciseBlocks'] as int?;

    return WorkoutSession(
      id: json['id'] as String,
      name: json['name'] as String,
      startedAt: DateTime.parse(json['startedAt'] as String),
      finishedAt: json['finishedAt'] != null
          ? DateTime.parse(json['finishedAt'] as String)
          : null,
      durationSeconds: json['durationSeconds'] as int?,
      perceivedExertion: json['perceivedExertion'] as int?,
      bodyWeightKg: _toDouble(json['bodyWeightKg']),
      notes: json['notes'] as String?,
      exerciseBlocks: (json['exerciseBlocks'] as List<dynamic>? ?? [])
          .map((b) => ExerciseBlock.fromJson(b as Map<String, dynamic>))
          .toList(),
      exerciseBlockCount: blockCount,
    );
  }
}

class ExerciseBlock {
  final String id;
  final String exerciseId;
  final String exerciseName;
  final List<String> primaryMuscles;
  final bool isUnilateral;
  final int sortOrder;
  final List<SetLog> sets;
  final String? imageUrl;

  const ExerciseBlock({
    required this.id,
    required this.exerciseId,
    required this.exerciseName,
    this.primaryMuscles = const [],
    required this.isUnilateral,
    required this.sortOrder,
    this.sets = const [],
    this.imageUrl,
  });

  factory ExerciseBlock.fromJson(Map<String, dynamic> json) {
    final exercise = json['exercise'] as Map<String, dynamic>?;
    return ExerciseBlock(
      id: json['id'] as String,
      exerciseId: json['exerciseId'] as String,
      exerciseName: exercise?['name'] as String? ?? 'Unknown',
      primaryMuscles:
          (exercise?['primaryMuscles'] as List<dynamic>?)
              ?.map((m) => m as String)
              .toList() ??
          [],
      isUnilateral: exercise?['isUnilateral'] as bool? ?? false,
      sortOrder: json['sortOrder'] as int,
      sets: (json['sets'] as List<dynamic>? ?? [])
          .map((s) => SetLog.fromJson(s as Map<String, dynamic>))
          .toList(),
      imageUrl: exercise?['imageUrl'] as String?,
    );
  }
}

class SetLog {
  final String id;
  final int setNumber;
  final String setType;
  final double? weightKg;
  final double? weightKgLeft;
  final double? weightKgRight;
  final int? reps;
  final int? repsLeft;
  final int? repsRight;
  final int? rir;
  final double? rpe;
  final int? durationSeconds;
  final double? distanceM;
  final bool isPr;
  final bool isFailed;
  final DateTime? completedAt;

  const SetLog({
    required this.id,
    required this.setNumber,
    required this.setType,
    this.weightKg,
    this.weightKgLeft,
    this.weightKgRight,
    this.reps,
    this.repsLeft,
    this.repsRight,
    this.rir,
    this.rpe,
    this.durationSeconds,
    this.distanceM,
    required this.isPr,
    required this.isFailed,
    this.completedAt,
  });

  factory SetLog.fromJson(Map<String, dynamic> json) => SetLog(
    id: json['id'] as String,
    setNumber: json['setNumber'] as int,
    setType: json['setType'] as String,
    weightKg: _toDouble(json['weightKg']),
    weightKgLeft: _toDouble(json['weightKgLeft']),
    weightKgRight: _toDouble(json['weightKgRight']),
    reps: json['reps'] as int?,
    repsLeft: json['repsLeft'] as int?,
    repsRight: json['repsRight'] as int?,
    rir: json['rir'] as int?,
    rpe: _toDouble(json['rpe']),
    durationSeconds: json['durationSeconds'] as int?,
    distanceM: _toDouble(json['distanceM']),
    isPr: json['isPr'] as bool? ?? false,
    isFailed: json['isFailed'] as bool? ?? false,
    completedAt: json['completedAt'] != null
        ? DateTime.parse(json['completedAt'] as String)
        : null,
  );
}

double? _toDouble(dynamic v) {
  if (v == null) return null;
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v);
  return null;
}

class LastPerformance {
  final String date;
  final List<LastPerformanceSet> sets;

  const LastPerformance({required this.date, required this.sets});

  factory LastPerformance.fromJson(Map<String, dynamic> json) =>
      LastPerformance(
        date: json['date'] as String,
        sets: (json['sets'] as List<dynamic>)
            .map((s) => LastPerformanceSet.fromJson(s as Map<String, dynamic>))
            .toList(),
      );
}

class LastPerformanceSet {
  final double? weightKg;
  final int? reps;

  const LastPerformanceSet({this.weightKg, this.reps});

  factory LastPerformanceSet.fromJson(Map<String, dynamic> json) =>
      LastPerformanceSet(
        weightKg: _toDouble(json['weightKg']),
        reps: json['reps'] as int?,
      );
}
