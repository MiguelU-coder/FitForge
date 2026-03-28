import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fitforge/core/api/rapidapi/rapid_api_client.dart';
import 'package:fitforge/core/api/api_client.dart';

class WorkoutPlanSuggestion {
  final String? workoutPlan;
  final String? nutritionAdvice;
  final bool isLoading;
  final String? error;
  final String? routineId;
  final String? routineName;

  const WorkoutPlanSuggestion({
    this.workoutPlan,
    this.nutritionAdvice,
    this.isLoading = false,
    this.error,
    this.routineId,
    this.routineName,
  });

  Map<String, dynamic> toJson() => {
    'workoutPlan': workoutPlan,
    'nutritionAdvice': nutritionAdvice,
    'error': error,
    'routineId': routineId,
    'routineName': routineName,
  };

  factory WorkoutPlanSuggestion.fromJson(Map<String, dynamic> json) =>
      WorkoutPlanSuggestion(
        workoutPlan: json['workoutPlan'] as String?,
        nutritionAdvice: json['nutritionAdvice'] as String?,
        error: json['error'] as String?,
        routineId: json['routineId'] as String?,
        routineName: json['routineName'] as String?,
      );

  WorkoutPlanSuggestion copyWith({
    String? workoutPlan,
    String? nutritionAdvice,
    bool? isLoading,
    String? error,
    String? routineId,
    String? routineName,
  }) {
    return WorkoutPlanSuggestion(
      workoutPlan: workoutPlan ?? this.workoutPlan,
      nutritionAdvice: nutritionAdvice ?? this.nutritionAdvice,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
      routineId: routineId ?? this.routineId,
      routineName: routineName ?? this.routineName,
    );
  }
}

class OnboardingState {
  final int currentStep;
  final String? gender;
  final String? mainGoal;
  final double? heightCm;
  final double? weightKg;
  final double? goalWeightKg;
  final String? trainingLevel;
  final List<String> activities;
  final DateTime? dateOfBirth;
  final bool isLoading;
  final String? error;
  final WorkoutPlanSuggestion? workoutPlanSuggestion;
  final String? generatedRoutineId;

  const OnboardingState({
    this.currentStep = 1,
    this.gender,
    this.mainGoal,
    this.heightCm,
    this.weightKg,
    this.goalWeightKg,
    this.trainingLevel,
    this.activities = const [],
    this.dateOfBirth,
    this.isLoading = false,
    this.error,
    this.workoutPlanSuggestion,
    this.generatedRoutineId,
  });

  OnboardingState copyWith({
    int? currentStep,
    String? gender,
    String? mainGoal,
    double? heightCm,
    double? weightKg,
    double? goalWeightKg,
    String? trainingLevel,
    List<String>? activities,
    DateTime? dateOfBirth,
    bool? isLoading,
    String? error,
    WorkoutPlanSuggestion? workoutPlanSuggestion,
    String? generatedRoutineId,
  }) {
    return OnboardingState(
      currentStep: currentStep ?? this.currentStep,
      gender: gender ?? this.gender,
      mainGoal: mainGoal ?? this.mainGoal,
      heightCm: heightCm ?? this.heightCm,
      weightKg: weightKg ?? this.weightKg,
      goalWeightKg: goalWeightKg ?? this.goalWeightKg,
      trainingLevel: trainingLevel ?? this.trainingLevel,
      activities: activities ?? this.activities,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
      workoutPlanSuggestion:
          workoutPlanSuggestion ?? this.workoutPlanSuggestion,
      generatedRoutineId: generatedRoutineId ?? this.generatedRoutineId,
    );
  }
}

class OnboardingNotifier extends StateNotifier<OnboardingState> {
  final RapidApiClient _rapidApi = RapidApiClient();
  final ApiClient _api = ApiClient();

  OnboardingNotifier() : super(const OnboardingState());

  void setStep(int step) => state = state.copyWith(currentStep: step);

  void nextStep() => state = state.copyWith(currentStep: state.currentStep + 1);

  void prevStep() =>
      state = state.copyWith(currentStep: (state.currentStep - 1).clamp(1, 9));

  void setGender(String gender) => state = state.copyWith(gender: gender);

  void setMainGoal(String goal) => state = state.copyWith(mainGoal: goal);

  void setDateOfBirth(DateTime dob) => state = state.copyWith(dateOfBirth: dob);

  void setHeight(double height) => state = state.copyWith(heightCm: height);

  void setWeight(double weight) => state = state.copyWith(weightKg: weight);

  void setGoalWeight(double weight) =>
      state = state.copyWith(goalWeightKg: weight);

  void setTrainingLevel(String level) =>
      state = state.copyWith(trainingLevel: level);

  void toggleActivity(String activity) {
    final activities = List<String>.from(state.activities);
    if (activities.contains(activity)) {
      activities.remove(activity);
    } else {
      activities.add(activity);
    }
    state = state.copyWith(activities: activities);
  }

  /// Get nutrition advice based on goal and fitness level (called after step 2)
  Future<void> getNutritionAdvice() async {
    if (state.mainGoal == null || state.trainingLevel == null) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      // Map training level to API format
      String fitnessLevel = _mapTrainingLevel(state.trainingLevel!);

      // Map goal to API format
      String goal = _mapGoal(state.mainGoal!);

      final result = await _rapidApi.getNutritionAdvice(
        goal: goal,
        fitnessLevel: fitnessLevel,
      );

      final suggestion = WorkoutPlanSuggestion(
        nutritionAdvice: _formatNutritionResponse(result),
        isLoading: false,
      );

      state = state.copyWith(
        workoutPlanSuggestion: suggestion,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Generate personalized workout plan based on all onboarding data (called after step 7)
  Future<void> generateWorkoutPlanSuggestion() async {
    if (state.mainGoal == null || state.trainingLevel == null) return;

    // Create a suggestion object if it doesn't exist
    final currentSuggestion =
        state.workoutPlanSuggestion ?? const WorkoutPlanSuggestion();

    state = state.copyWith(
      isLoading: true,
      error: null,
      workoutPlanSuggestion: currentSuggestion.copyWith(isLoading: true),
    );

    try {
      // Map training level to API format
      String fitnessLevel = _mapTrainingLevel(state.trainingLevel!);

      // Map goal to API format
      String goal = _mapGoal(state.mainGoal!);

      // Map activities to preferences
      List<String> preferences = _mapActivities(state.activities);

      // Calculate days per week based on training level
      int daysPerWeek = _getDaysPerWeek(state.trainingLevel!);

      final result = await _rapidApi.generateWorkoutPlan(
        goal: goal,
        fitnessLevel: fitnessLevel,
        preferences: preferences.isNotEmpty ? preferences : ['General fitness'],
        daysPerWeek: daysPerWeek,
        sessionDuration: 60,
        planDurationWeeks: 4,
      );

      final suggestion = WorkoutPlanSuggestion(
        workoutPlan: _formatWorkoutResponse(result),
        nutritionAdvice: currentSuggestion.nutritionAdvice,
        isLoading: false,
      );

      state = state.copyWith(
        workoutPlanSuggestion: suggestion,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
        workoutPlanSuggestion: currentSuggestion.copyWith(isLoading: false),
      );
    }
  }

  /// Generate and save workout routine using AI Coach endpoint
  /// POST /ai/coach/routine
  Future<void> generateAndSaveRoutine() async {
    if (state.mainGoal == null || state.trainingLevel == null) {
      state = state.copyWith(
        error: 'Missing required data for routine generation',
      );
      return;
    }

    final currentSuggestion =
        state.workoutPlanSuggestion ?? const WorkoutPlanSuggestion();

    state = state.copyWith(
      isLoading: true,
      error: null,
      workoutPlanSuggestion: currentSuggestion.copyWith(isLoading: true),
    );

    try {
      // Build user data payload
      final userData = {
        'goal': state.mainGoal,
        'level': state.trainingLevel,
        'gender': state.gender,
        'height': state.heightCm,
        'weight': state.weightKg,
        'goalWeight': state.goalWeightKg,
        'activities': state.activities,
        'dateOfBirth': state.dateOfBirth?.toIso8601String(),
      };

      // Call AI Coach routine generation endpoint
      final response = await _api.dio.post<Map<String, dynamic>>(
        '/ai/coach/routine',
        data: userData,
        options: Options(receiveTimeout: const Duration(seconds: 120)),
      );

      final body = response.data;
      final data = body?['data'] as Map<String, dynamic>?;

      if (data == null) {
        throw Exception('Invalid response from server');
      }

      // Extract routine info
      final routineId = data['routineId'] as String?;
      final routineName =
          data['routineName'] as String? ?? 'AI Generated Routine';
      final formattedPlan = _formatRoutineResponse(data);

      final suggestion = WorkoutPlanSuggestion(
        workoutPlan: formattedPlan,
        nutritionAdvice: currentSuggestion.nutritionAdvice,
        isLoading: false,
        routineId: routineId,
        routineName: routineName,
      );

      state = state.copyWith(
        workoutPlanSuggestion: suggestion,
        generatedRoutineId: routineId,
        isLoading: false,
      );
    } on DioException catch (e) {
      String errorMessage = 'Failed to generate routine';
      if (e.response?.data != null && e.response?.data['message'] != null) {
        errorMessage = e.response?.data['message'];
      } else if (e.message != null) {
        errorMessage = e.message!;
      }
      state = state.copyWith(
        isLoading: false,
        error: errorMessage,
        workoutPlanSuggestion: currentSuggestion.copyWith(isLoading: false),
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
        workoutPlanSuggestion: currentSuggestion.copyWith(isLoading: false),
      );
    }
  }

  /// Get the generated routine ID for starting a session
  String? get generatedRoutineId => state.workoutPlanSuggestion?.routineId;

  /// Format routine response for display
  String _formatRoutineResponse(Map<String, dynamic> data) {
    final buffer = StringBuffer();

    if (data['name'] != null) {
      buffer.writeln('🎯 ${data['name']}');
      buffer.writeln();
    }

    if (data['description'] != null) {
      buffer.writeln('${data['description']}');
      buffer.writeln();
    }

    final schedule = data['schedule'];
    if (schedule is Map) {
      final days = schedule['daysPerWeek'] ?? schedule['days_per_week'] ?? '?';
      final duration =
          schedule['sessionDuration'] ?? schedule['session_duration'] ?? '?';
      buffer.writeln('⏱️ Schedule: $days days/week, $duration min/session');
      buffer.writeln();
    }

    final routines = data['routines'] ?? data['workouts'] ?? data['exercises'];
    if (routines is List && routines.isNotEmpty) {
      for (var day in routines) {
        if (day is Map) {
          final dayName = day['name'] ?? day['day'] ?? 'Workout Day';
          buffer.writeln('📅 $dayName:');

          final exercises = day['exercises'] ?? day['workouts'] ?? [];
          if (exercises is List) {
            for (var ex in exercises) {
              if (ex is Map) {
                final name = ex['name'] ?? 'Exercise';
                final sets = ex['sets'] ?? ex['targetSets'] ?? '?';
                final reps =
                    ex['reps'] ?? ex['targetReps'] ?? ex['repetitions'] ?? '?';
                buffer.writeln('  • $name ($sets sets × $reps reps)');
              }
            }
          }
          buffer.writeln();
        }
      }
    }

    return buffer.toString().trim().isNotEmpty
        ? buffer.toString().trim()
        : 'Routine generated successfully!';
  }

  /// Validate user data at each step
  String? validateCurrentStep() {
    switch (state.currentStep) {
      case 1: // Goal
        if (state.mainGoal == null) return 'Please select a main goal';
        break;
      case 2: // Level
        if (state.trainingLevel == null) {
          return 'Please select a training level';
        }
        break;
      case 3: // Gender
        if (state.gender == null) return 'Please select a gender';
        break;
      case 4: // Height
        if (state.heightCm == null || state.heightCm! <= 0) {
          return 'Please enter a valid height';
        }
        return _validateHeight();
      case 5: // Weight
        if (state.weightKg == null || state.weightKg! <= 0) {
          return 'Please enter a valid weight';
        }
        return _validateWeight();
      case 6: // Goal Weight
        if (state.goalWeightKg == null || state.goalWeightKg! <= 0) {
          return 'Please enter a valid goal weight';
        }
        return _validateGoalWeight();
      case 7: // DOB
        return _validateAge();
      case 8: // Activities (optional)
        break;
      case 9: // Summary
        break;
    }
    return null;
  }

  String? _validateAge() {
    if (state.dateOfBirth != null) {
      int age = DateTime.now().year - state.dateOfBirth!.year;
      if (state.dateOfBirth!.year > DateTime.now().year - 5) {
        return 'Please enter a valid date of birth';
      }
      if (age < 13) {
        return 'You must be at least 13 years old to use this app';
      }
      if (age > 100) {
        return 'Please enter a valid date of birth';
      }
    }
    return null;
  }

  String? _validateHeight() {
    if (state.heightCm != null) {
      if (state.heightCm! < 50) {
        return 'Height seems too low. Please check.';
      }
      if (state.heightCm! > 250) {
        return 'Height seems too high. Please check.';
      }
    }
    return null;
  }

  String? _validateWeight() {
    if (state.weightKg != null) {
      if (state.weightKg! < 20) {
        return 'Weight seems too low. Please check.';
      }
      if (state.weightKg! > 400) {
        return 'Weight seems too high. Please check.';
      }
      // BMI calculation for validation - more lenient
      if (state.heightCm != null) {
        double heightM = state.heightCm! / 100;
        double bmi = state.weightKg! / (heightM * heightM);
        if (bmi < 8 || bmi > 80) {
          return 'Please check your weight - it seems unrealistic for your height';
        }
      }
    }
    return null;
  }

  String? _validateGoalWeight() {
    if (state.weightKg != null && state.goalWeightKg != null) {
      double diff = state.goalWeightKg! - state.weightKg!;
      // Warn if trying to lose/gain more than 1kg per week realistically
      if (diff < -30 || diff > 30) {
        return 'This goal weight change may take a long time. Consider a more gradual approach.';
      }
    }
    return null;
  }

  String _mapTrainingLevel(String level) {
    switch (level) {
      case 'BEGINNER':
        return 'Beginner';
      case 'IRREGULAR':
        return 'Intermediate';
      case 'MEDIUM':
        return 'Intermediate';
      case 'ADVANCED':
        return 'Advanced';
      default:
        return 'Beginner';
    }
  }

  String _mapGoal(String goal) {
    switch (goal) {
      case 'LOSE_WEIGHT':
        return 'Lose weight';
      case 'KEEP_FIT':
        return 'Maintain fitness';
      case 'GET_STRONGER':
        return 'Build strength';
      case 'GAIN_MUSCLE_MASS':
        return 'Build muscle';
      default:
        return 'General fitness';
    }
  }

  List<String> _mapActivities(List<String> activities) {
    List<String> preferences = [];
    for (var activity in activities) {
      switch (activity) {
        case 'STRETCH':
          preferences.add('Stretching');
          break;
        case 'CARDIO':
          preferences.add('Cardio');
          break;
        case 'YOGA':
          preferences.add('Yoga');
          break;
        case 'POWER_TRAINING':
          preferences.add('Weight training');
          break;
        case 'DANCING':
          preferences.add('Dancing');
          break;
      }
    }
    return preferences;
  }

  int _getDaysPerWeek(String level) {
    switch (level) {
      case 'BEGINNER':
        return 3;
      case 'IRREGULAR':
        return 2;
      case 'MEDIUM':
        return 4;
      case 'ADVANCED':
        return 5;
      default:
        return 3;
    }
  }

  String _formatNutritionResponse(Map<String, dynamic> result) {
    try {
      if (result['status'] == 'success' && result['result'] != null) {
        final data = result['result'];
        if (data is Map<String, dynamic>) {
          if (data.containsKey('error')) {
            return data['error'].toString();
          }
          final buffer = StringBuffer();

          if (data['daily_calories'] != null) {
            buffer.writeln('🔥 Daily Calories: ${data['daily_calories']}');
            buffer.writeln();
          }

          final macros = data['macronutrients'];
          if (macros is Map) {
            buffer.writeln('📊 Macronutrients:');
            macros.forEach((k, v) {
              final keyStr = k.toString();
              final formattedKey = keyStr.isEmpty
                  ? ''
                  : keyStr[0].toUpperCase() + keyStr.substring(1);
              buffer.writeln('  • $formattedKey: $v');
            });
            buffer.writeln();
          }

          final meals = data['meals'];
          if (meals is List) {
            buffer.writeln('🍽️ Suggested Meals:');
            for (var meal in meals) {
              if (meal is Map) {
                final name = meal['meal_name'] ?? meal['name'] ?? 'Meal';
                final desc = meal['description'] ?? meal['suggestion'] ?? '';
                buffer.writeln('  • $name: $desc');
              }
            }
            buffer.writeln();
          }

          if (data['hydration'] != null) {
            buffer.writeln('💧 Hydration: ${data['hydration']}');
          }

          final formatted = buffer.toString().trim();
          if (formatted.isNotEmpty) return formatted;
        }
      }

      // Fallback formatting if it doesn't match expected structure
      const encoder = JsonEncoder.withIndent('  ');
      return encoder.convert(result['result'] ?? result);
    } catch (e) {
      return result.toString();
    }
  }

  String _formatWorkoutResponse(Map<String, dynamic> result) {
    try {
      if (result['status'] == 'success' && result['result'] != null) {
        final data = result['result'];
        if (data is Map<String, dynamic>) {
          if (data.containsKey('error')) {
            return data['error'].toString();
          }
          final buffer = StringBuffer();

          if (data['goal'] != null) buffer.writeln('🎯 Goal: ${data['goal']}');
          if (data['fitness_level'] != null) {
            buffer.writeln('⚡ Level: ${data['fitness_level']}');
          }
          buffer.writeln();

          final schedule = data['schedule'];
          if (schedule is Map) {
            final days = schedule['days_per_week'] ?? '?';
            final duration = schedule['session_duration'] ?? '?';
            buffer.writeln(
              '⏱️ Schedule: $days days/week, $duration min/session',
            );
            buffer.writeln();
          }

          final routines = data['exercises'] ?? data['routine'] ?? data['plan'];
          if (routines is List) {
            for (var dayPlan in routines) {
              if (dayPlan is Map) {
                final dayName =
                    dayPlan['day'] ?? dayPlan['name'] ?? 'Workout Day';
                buffer.writeln('■ $dayName:');

                final exercises = dayPlan['exercises'] ?? dayPlan['workouts'];
                if (exercises is List) {
                  for (var ex in exercises) {
                    if (ex is Map) {
                      final name = ex['name'] ?? 'Exercise';
                      final sets = ex['sets'] ?? '?';
                      final reps = ex['repetitions'] ?? ex['reps'] ?? '?';
                      buffer.writeln('  • $name ($sets sets x $reps)');
                    }
                  }
                }
                buffer.writeln();
              }
            }
          }

          final formatted = buffer.toString().trim();
          if (formatted.isNotEmpty) return formatted;
        }
      }

      // Fallback
      const encoder = JsonEncoder.withIndent('  ');
      return encoder.convert(result['result'] ?? result);
    } catch (e) {
      return result.toString();
    }
  }
}

final onboardingProvider =
    StateNotifierProvider<OnboardingNotifier, OnboardingState>((ref) {
      return OnboardingNotifier();
    });
