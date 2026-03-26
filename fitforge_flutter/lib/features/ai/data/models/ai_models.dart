// lib/features/ai/data/models/ai_models.dart

// ── Enums ─────────────────────────────────────────────────────────────────────
enum SetType {
  warmup,
  working,
  drop,
  failure,
}

enum EquipmentType {
  barbell,
  dumbbell,
  cable,
  machine,
  bodyweight,
  kettlebell,
  resistanceBand,
}

// ── Input Models ───────────────────────────────────────────────────────────

class SetInput {
  final int setNumber;
  final SetType setType;
  final double? weightKg;
  final int? reps;
  final int? rir;
  final double? rpe;

  SetInput({
    required this.setNumber,
    this.setType = SetType.working,
    this.weightKg,
    this.reps,
    this.rir,
    this.rpe,
  });

  Map<String, dynamic> toJson() => {
        'setNumber': setNumber,
        'setType': setType.name.toUpperCase(),
        'weightKg': weightKg,
        'reps': reps,
        'rir': rir,
        'rpe': rpe,
      };
}

class ExerciseHistoryEntry {
  final String sessionDate;
  final String exerciseId;
  final String exerciseName;
  final EquipmentType? equipment;
  final List<String> primaryMuscles;
  final List<SetInput> sets;

  ExerciseHistoryEntry({
    required this.sessionDate,
    required this.exerciseId,
    required this.exerciseName,
    this.equipment,
    this.primaryMuscles = const [],
    required this.sets,
  });

  Map<String, dynamic> toJson() => {
        'sessionDate': sessionDate,
        'exerciseId': exerciseId,
        'exerciseName': exerciseName,
        'equipment': equipment?.name.toUpperCase(),
        'primaryMuscles': primaryMuscles,
        'sets': sets.map((s) => s.toJson()).toList(),
      };
}

class MuscleVolumeInput {
  final String muscleGroup;
  final int totalSets;
  final int totalReps;
  final double totalVolumeKg;

  MuscleVolumeInput({
    required this.muscleGroup,
    required this.totalSets,
    required this.totalReps,
    required this.totalVolumeKg,
  });

  Map<String, dynamic> toJson() => {
        'muscleGroup': muscleGroup,
        'totalSets': totalSets,
        'totalReps': totalReps,
        'totalVolumeKg': totalVolumeKg,
      };
}

class SessionLoad {
  final String date;
  final int totalSets;
  final double totalVolumeKg;
  final double? rpeAvg;
  final int? durationMin;

  SessionLoad({
    required this.date,
    required this.totalSets,
    required this.totalVolumeKg,
    this.rpeAvg,
    this.durationMin,
  });

  Map<String, dynamic> toJson() => {
        'date': date,
        'totalSets': totalSets,
        'totalVolumeKg': totalVolumeKg,
        'rpeAvg': rpeAvg,
        'durationMin': durationMin,
      };
}

class MuscleRecoveryInput {
  final String muscleGroup;
  final String lastTrainedDate;
  final int setsLastSession;
  final int? avgRirLastSession;

  MuscleRecoveryInput({
    required this.muscleGroup,
    required this.lastTrainedDate,
    required this.setsLastSession,
    this.avgRirLastSession,
  });

  Map<String, dynamic> toJson() => {
        'muscleGroup': muscleGroup,
        'lastTrainedDate': lastTrainedDate,
        'setsLastSession': setsLastSession,
        'avgRirLastSession': avgRirLastSession,
      };
}

class ExerciseRiskFactor {
  final String exerciseId;
  final String exerciseName;
  final int? setsThisWeek;
  final String? rirTrend; // 'increasing', 'stable', 'decreasing'
  final bool hasInjuryHistory;
  final String? equipmentCondition; // 'good', 'fair', 'poor'

  ExerciseRiskFactor({
    required this.exerciseId,
    required this.exerciseName,
    this.setsThisWeek,
    this.rirTrend,
    this.hasInjuryHistory = false,
    this.equipmentCondition,
  });

  Map<String, dynamic> toJson() => {
        'exerciseId': exerciseId,
        'exerciseName': exerciseName,
        'setsThisWeek': setsThisWeek,
        'rirTrend': rirTrend,
        'hasInjuryHistory': hasInjuryHistory,
        'equipmentCondition': equipmentCondition,
      };
}

class CurrentPerformance {
  final double weightKg;
  final int? reps;
  final int? rir;
  final String? date;

  CurrentPerformance({
    required this.weightKg,
    this.reps,
    this.rir,
    this.date,
  });

  Map<String, dynamic> toJson() => {
        'weightKg': weightKg,
        'reps': reps,
        'rir': rir,
        'date': date,
      };
}

class PRHistoryEntry {
  final String date;
  final double weightKg;
  final int reps;
  final double? estimated1Rm;

  PRHistoryEntry({
    required this.date,
    required this.weightKg,
    this.reps = 1,
    this.estimated1Rm,
  });

  Map<String, dynamic> toJson() => {
        'date': date,
        'weightKg': weightKg,
        'reps': reps,
        'estimated1Rm': estimated1Rm,
      };
}
