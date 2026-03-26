// lib/features/ai/data/models/ai_response_models.dart

// ── Progression Recommendation ────────────────────────────────────────────────

class ProgressionRecommendation {
  final String exerciseId;
  final String exerciseName;
  final String action; // "INCREASE_WEIGHT" | "MAINTAIN" | "DELOAD" | "CHANGE_REPS"
  final double? suggestedWeightKg;
  final int? suggestedReps;
  final int? suggestedRir;
  final double confidence;
  final String reasoning;
  final String displayMessage;

  ProgressionRecommendation.fromJson(Map<String, dynamic> json)
      : exerciseId = json['exerciseId'] ?? '',
        exerciseName = json['exerciseName'] ?? '',
        action = json['action'] ?? 'MAINTAIN',
        suggestedWeightKg = json['suggestedWeightKg']?.toDouble(),
        suggestedReps = json['suggestedReps'],
        suggestedRir = json['suggestedRir'],
        confidence = (json['confidence'] ?? 0.0).toDouble(),
        reasoning = json['reasoning'] ?? '',
        displayMessage = json['displayMessage'] ?? '';
}

// ── Workout Suggestion ────────────────────────────────────────────────────────

class WorkoutSuggestion {
  final String exerciseId;
  final double? suggestedWeight;
  final int? suggestedReps;
  final int? suggestedRir;
  final String message;
  final double confidence;
  final String reasoning;

  WorkoutSuggestion.fromJson(Map<String, dynamic> json)
      : exerciseId = json['exerciseId'] ?? '',
        suggestedWeight = json['suggestedWeight']?.toDouble(),
        suggestedReps = json['suggestedReps'],
        suggestedRir = json['suggestedRir'],
        message = json['message'] ?? '',
        confidence = (json['confidence'] ?? 0.0).toDouble(),
        reasoning = json['reasoning'] ?? '';
}

// ── Volume Analysis Response ────────────────────────────────────────────────

class MuscleVolumeStatus {
  final String muscleGroup;
  final int totalSets;
  final String status;
  final int mev;
  final int mav;
  final int mrv;
  final String recommendation;

  MuscleVolumeStatus.fromJson(Map<String, dynamic> json)
      : muscleGroup = json['muscleGroup'] ?? '',
        totalSets = json['totalSets'] ?? 0,
        status = json['status'] ?? '',
        mev = json['mev'] ?? 0,
        mav = json['mav'] ?? 0,
        mrv = json['mrv'] ?? 0,
        recommendation = json['recommendation'] ?? '';
}

class VolumeAnalysisResponse {
  final String userId;
  final String weekStart;
  final List<MuscleVolumeStatus> muscleStatuses;
  final String overallFatigue;
  final String weeklySummary;

  VolumeAnalysisResponse.fromJson(Map<String, dynamic> json)
      : userId = json['userId'] ?? '',
        weekStart = json['weekStart'] ?? '',
        muscleStatuses = (json['muscleStatuses'] as List<dynamic>?)
                ?.map((e) => MuscleVolumeStatus.fromJson(e))
                .toList() ??
            [],
        overallFatigue = json['overallFatigue'] ?? 'LOW',
        weeklySummary = json['weeklySummary'] ?? '';
}

// ── Fatigue Assessment ────────────────────────────────────────────────────────

class FatigueAssessment {
  final String userId;
  final String fatigueLevel;
  final double score;
  final String recommendation;
  final int? daysToDeload;

  FatigueAssessment.fromJson(Map<String, dynamic> json)
      : userId = json['userId'] ?? '',
        fatigueLevel = json['fatigueLevel'] ?? 'NORMAL',
        score = (json['score'] ?? 0.0).toDouble(),
        recommendation = json['recommendation'] ?? '',
        daysToDeload = json['daysToDeload'];
}

// ── Recovery Prediction ────────────────────────────────────────────────────────

class MuscleRecoveryStatus {
  final String muscleGroup;
  final String status;
  final int hoursUntilRecovered;
  final int lastTrainedDaysAgo;
  final int setsLastSession;
  final int? avgRir;
  final String recommendation;

  MuscleRecoveryStatus.fromJson(Map<String, dynamic> json)
      : muscleGroup = json['muscleGroup'] ?? '',
        status = json['status'] ?? 'UNKNOWN',
        hoursUntilRecovered = json['hoursUntilRecovered'] ?? 0,
        lastTrainedDaysAgo = json['lastTrainedDaysAgo'] ?? 0,
        setsLastSession = json['setsLastSession'] ?? 0,
        avgRir = json['avgRir'],
        recommendation = json['recommendation'] ?? '';
}

class RecoveryPrediction {
  final String userId;
  final String date;
  final double overallRecoveryScore;
  final List<MuscleRecoveryStatus> muscleStatuses;
  final String recommendation;

  RecoveryPrediction.fromJson(Map<String, dynamic> json)
      : userId = json['userId'] ?? '',
        date = json['date'] ?? '',
        overallRecoveryScore = (json['overallRecoveryScore'] ?? 0.0).toDouble(),
        muscleStatuses = (json['muscleStatuses'] as List<dynamic>?)
                ?.map((e) => MuscleRecoveryStatus.fromJson(e))
                .toList() ??
            [],
        recommendation = json['recommendation'] ?? '';
}

// ── Injury Risk Assessment ──────────────────────────────────────────────────

class InjuryRiskAssessment {
  final String userId;
  final String date;
  final String overallRiskLevel;
  final double riskScore;
  final Map<String, dynamic> acwrRisk;
  final Map<String, dynamic> volumeSpikeRisk;
  final Map<String, dynamic> fatigueRisk;
  final Map<String, dynamic> frequencyRisk;
  final List<Map<String, dynamic>> exerciseRisks;
  final List<String> recommendations;
  final bool medicalConsultationRecommended;

  InjuryRiskAssessment.fromJson(Map<String, dynamic> json)
      : userId = json['userId'] ?? '',
        date = json['date'] ?? '',
        overallRiskLevel = json['overallRiskLevel'] ?? 'LOW',
        riskScore = (json['riskScore'] ?? 0.0).toDouble(),
        acwrRisk = json['acwrRisk'] ?? {},
        volumeSpikeRisk = json['volumeSpikeRisk'] ?? {},
        fatigueRisk = json['fatigueRisk'] ?? {},
        frequencyRisk = json['frequencyRisk'] ?? {},
        exerciseRisks = (json['exerciseRisks'] as List<dynamic>?)
                ?.map((e) => Map<String, dynamic>.from(e))
                .toList() ??
            [],
        recommendations = (json['recommendations'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        medicalConsultationRecommended =
            json['medicalConsultationRecommended'] ?? false;
}

// ── PR Prediction ────────────────────────────────────────────────────────────

class TargetWeightInfo {
  final double targetWeightKg;
  final int estimatedDays;

  TargetWeightInfo.fromJson(Map<String, dynamic> json)
      : targetWeightKg = (json['targetWeightKg'] ?? 0.0).toDouble(),
        estimatedDays = json['estimatedDays'] ?? 0;
}

class PRPrediction {
  final String userId;
  final String exerciseId;
  final String exerciseName;
  final double currentEstimated1Rm;
  final double? currentPrWeight;
  final double? currentPr1Rm;
  final String trainingLevel;
  final double? progressionRateKgPerWeek;
  final double prProbability30Days;
  final double prProbability90Days;
  final double prProbability180Days;
  final int? daysEstimate;
  final double confidence;
  final String reasoning;
  final String recommendation;
  final Map<String, TargetWeightInfo> targetWeights;

  PRPrediction.fromJson(Map<String, dynamic> json)
      : userId = json['userId'] ?? '',
        exerciseId = json['exerciseId'] ?? '',
        exerciseName = json['exerciseName'] ?? '',
        currentEstimated1Rm = (json['currentEstimated1Rm'] ?? 0.0).toDouble(),
        currentPrWeight = json['currentPrWeight']?.toDouble(),
        currentPr1Rm = json['currentPr1Rm']?.toDouble(),
        trainingLevel = json['trainingLevel'] ?? 'intermediate',
        progressionRateKgPerWeek = json['progressionRateKgPerWeek']?.toDouble(),
        prProbability30Days = (json['prProbability30Days'] ?? 0.0).toDouble(),
        prProbability90Days = (json['prProbability90Days'] ?? 0.0).toDouble(),
        prProbability180Days = (json['prProbability180Days'] ?? 0.0).toDouble(),
        daysEstimate = json['daysEstimate'],
        confidence = (json['confidence'] ?? 0.0).toDouble(),
        reasoning = json['reasoning'] ?? '',
        recommendation = json['recommendation'] ?? '',
        targetWeights = (json['targetWeights'] as Map<String, dynamic>?)?.map(
              (k, v) => MapEntry(k, TargetWeightInfo.fromJson(v)),
            ) ??
            {};
}

// ── AI Coach Response (Phase 3) ───────────────────────────────────────────────

class CoachResponse {
  final String summary;
  final List<String> insights;
  final List<String> recommendations;
  final List<String> warnings;
  final String motivation;
  final String llmProvider;

  CoachResponse({
    required this.summary,
    required this.insights,
    required this.recommendations,
    required this.warnings,
    required this.motivation,
    this.llmProvider = 'unknown',
  });

  factory CoachResponse.fromJson(Map<String, dynamic> json) => CoachResponse(
    summary: json['summary'] as String? ?? '',
    insights: (json['insights'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [],
    recommendations: (json['recommendations'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [],
    warnings: (json['warnings'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [],
    motivation: json['motivation'] as String? ?? '',
    llmProvider: json['llm_provider'] as String? ?? 'unknown',
  );

  /// Convenience: returns the best single-line message to show in a compact banner.
  String get headline => summary.isNotEmpty ? summary : motivation;
}
