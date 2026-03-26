// lib/features/workouts/presentation/providers/ai_provider.dart
//
// Riverpod providers for real-time AI suggestions during workouts.
// Calls NestJS /ai/suggestion which proxies to the Python microservice.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/theme/app_theme.dart';

// ── Action type + display metadata ───────────────────────────────────────────

enum AiAction {
  increaseWeight,
  maintain,
  deload,
  changeReps,
  suggestion,
  unknown;

  static AiAction fromString(String? s) => switch (s?.toUpperCase()) {
    'INCREASE_WEIGHT' => AiAction.increaseWeight,
    'MAINTAIN' => AiAction.maintain,
    'DELOAD' => AiAction.deload,
    'CHANGE_REPS' => AiAction.changeReps,
    'SUGGESTION' => AiAction.suggestion,
    _ => AiAction.unknown,
  };

  Color get color => switch (this) {
    AiAction.increaseWeight => AppTheme.warning,
    AiAction.maintain => AppTheme.neon,
    AiAction.deload => AppTheme.error,
    AiAction.changeReps => AppTheme.cyan,
    AiAction.suggestion => AppTheme.cyan,
    AiAction.unknown => AppTheme.textSec,
  };

  IconData get icon => switch (this) {
    AiAction.increaseWeight => Icons.trending_up_rounded,
    AiAction.maintain => Icons.check_circle_outline_rounded,
    AiAction.deload => Icons.trending_down_rounded,
    AiAction.changeReps => Icons.repeat_rounded,
    AiAction.suggestion => Icons.auto_awesome_rounded,
    AiAction.unknown => Icons.lightbulb_outline_rounded,
  };
}

// ── Suggestion data model ─────────────────────────────────────────────────────

class WorkoutSuggestionData {
  final String message;
  final double? suggestedWeight;
  final int? suggestedReps;
  final int? suggestedRir;
  final double confidence;
  final String reasoning;
  final AiAction action;

  const WorkoutSuggestionData({
    required this.message,
    this.suggestedWeight,
    this.suggestedReps,
    this.suggestedRir,
    required this.confidence,
    required this.reasoning,
    this.action = AiAction.suggestion,
  });

  Color get color => action.color;
  IconData get icon => action.icon;

  factory WorkoutSuggestionData.fromJson(Map<String, dynamic> j) {
    // /ai/suggestion returns: message, suggested_weight, suggested_reps, suggested_rir, confidence, reasoning
    // /ai/progression returns: action, display_message, suggested_weight_kg, suggested_reps, suggested_rir, confidence, reasoning
    final actionStr = j['action'] as String?;
    final message = (j['display_message'] ?? j['message'] ?? '') as String;
    return WorkoutSuggestionData(
      message: message,
      suggestedWeight:
          (j['suggested_weight_kg'] ?? j['suggested_weight'] as num?)
              ?.toDouble(),
      suggestedReps: j['suggested_reps'] as int?,
      suggestedRir: j['suggested_rir'] as int?,
      confidence: (j['confidence'] as num? ?? 0.7).toDouble(),
      reasoning: (j['reasoning'] as String? ?? ''),
      action: AiAction.fromString(actionStr),
    );
  }
}

// ── State ─────────────────────────────────────────────────────────────────────

class WorkoutSuggestionState {
  final WorkoutSuggestionData? suggestion;
  final bool isLoading;
  final String? error;

  const WorkoutSuggestionState({
    this.suggestion,
    this.isLoading = false,
    this.error,
  });

  WorkoutSuggestionState copyWith({
    WorkoutSuggestionData? suggestion,
    bool? isLoading,
    String? error,
    bool clearSuggestion = false,
  }) => WorkoutSuggestionState(
    suggestion: clearSuggestion ? null : (suggestion ?? this.suggestion),
    isLoading: isLoading ?? this.isLoading,
    error: error ?? this.error,
  );
}

// ── Notifier ──────────────────────────────────────────────────────────────────

class WorkoutSuggestionNotifier extends StateNotifier<WorkoutSuggestionState> {
  final ApiClient _api;
  final String _exerciseId;

  WorkoutSuggestionNotifier(this._api, this._exerciseId)
    : super(const WorkoutSuggestionState());

  /// Called after each set is logged during an active workout.
  /// Sends sets done today + last session sets to NestJS /ai/suggestion.
  Future<void> fetchSuggestion({
    required String userId,
    required String exerciseName,
    required List<Map<String, dynamic>> setsDoneToday,
    required List<Map<String, dynamic>> lastSessionSets,
    int targetReps = 8,
    int targetRir = 2,
  }) async {
    if (setsDoneToday.isEmpty) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final data = await _api.post<Map<String, dynamic>>(
        '/ai/suggestion',
        data: {
          'userId': userId,
          'exerciseId': _exerciseId,
          'exerciseName': exerciseName,
          'targetReps': targetReps,
          'targetRir': targetRir,
          'setsDoneToday': setsDoneToday,
          'lastSessionSets': lastSessionSets,
        },
      );

      state = state.copyWith(
        isLoading: false,
        suggestion: WorkoutSuggestionData.fromJson(data),
      );
    } catch (e) {
      // AI suggestion failure is non-fatal — silently clear
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void clear() => state = const WorkoutSuggestionState();
}

// ── Provider — keyed by exerciseId ───────────────────────────────────────────

final workoutSuggestionProvider =
    StateNotifierProvider.family<
      WorkoutSuggestionNotifier,
      WorkoutSuggestionState,
      String
    >(
      (ref, exerciseId) =>
          WorkoutSuggestionNotifier(ref.read(apiClientProvider), exerciseId),
    );
