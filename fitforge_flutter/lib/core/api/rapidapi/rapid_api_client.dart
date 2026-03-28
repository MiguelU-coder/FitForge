// lib/core/api/rapidapi/rapid_api_client.dart
//
// RapidAPI client with Mock Mode:
//   - In debug mode (kDebugMode == true), returns local mock data by default
//   - Set RapidApiClient(useMock: false) to force real API calls
//   - Prevents quota exhaustion during development

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fitforge/core/utils/app_constants.dart';

final rapidApiClientProvider = Provider<RapidApiClient>((ref) {
  // Always mock in debug mode to protect API quota
  return RapidApiClient(useMock: kDebugMode);
});

class RapidApiClient {
  late final Dio _dio;

  /// When [useMock] is true, all methods return hardcoded mock data
  /// without making any network call. Defaults to `kDebugMode`.
  final bool useMock;

  RapidApiClient({this.useMock = false}) {
    _dio = Dio(
      BaseOptions(
        baseUrl: 'https://${AppConstants.rapidApiHost}',
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': AppConstants.rapidApiKey,
          'X-RapidAPI-Host': AppConstants.rapidApiHost,
        },
      ),
    );
  }

  /// Generate a personalized workout plan based on goals, fitness level, and preferences
  Future<Map<String, dynamic>> generateWorkoutPlan({
    required String goal,
    required String fitnessLevel,
    required List<String> preferences,
    List<String> healthConditions = const ['None'],
    int daysPerWeek = 4,
    int sessionDuration = 60,
    int planDurationWeeks = 4,
    String lang = 'en',
  }) async {
    if (useMock) return _mockWorkoutPlan(goal, fitnessLevel, daysPerWeek);

    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/generateWorkoutPlan',
        data: {
          'goal': goal,
          'fitness_level': fitnessLevel,
          'preferences': preferences,
          'health_conditions': healthConditions,
          'schedule': {
            'days_per_week': daysPerWeek,
            'session_duration': sessionDuration,
          },
          'plan_duration_weeks': planDurationWeeks,
          'lang': lang,
        },
      );
      return response.data ?? {};
    } on DioException catch (e) {
      throw RapidApiException(
        message: e.message ?? 'Error generating workout plan',
        statusCode: e.response?.statusCode,
      );
    }
  }

  /// Get detailed exercise information
  Future<Map<String, dynamic>> getExerciseDetails({
    required String exerciseName,
    String lang = 'en',
  }) async {
    if (useMock) return _mockExerciseDetails(exerciseName);

    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/exerciseDetails',
        data: {
          'exercise_name': exerciseName,
          'lang': lang,
        },
      );
      return response.data ?? {};
    } on DioException catch (e) {
      throw RapidApiException(
        message: e.message ?? 'Error getting exercise details',
        statusCode: e.response?.statusCode,
      );
    }
  }

  /// Get nutrition recommendations
  Future<Map<String, dynamic>> getNutritionAdvice({
    required String goal,
    required String fitnessLevel,
    String lang = 'en',
  }) async {
    if (useMock) return _mockNutritionAdvice(goal);

    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/nutritionAdvice',
        data: {
          'goal': goal,
          'fitness_level': fitnessLevel,
          'lang': lang,
        },
      );
      return response.data ?? {};
    } on DioException catch (e) {
      throw RapidApiException(
        message: e.message ?? 'Error getting nutrition advice',
        statusCode: e.response?.statusCode,
      );
    }
  }

  /// Create a custom workout plan
  Future<Map<String, dynamic>> createCustomWorkoutPlan({
    required String goal,
    required String fitnessLevel,
    required List<String> exercises,
    required int daysPerWeek,
    required int sessionDuration,
    String lang = 'en',
  }) async {
    if (useMock) return _mockWorkoutPlan(goal, fitnessLevel, daysPerWeek);

    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/customWorkoutPlan',
        data: {
          'goal': goal,
          'fitness_level': fitnessLevel,
          'exercises': exercises,
          'schedule': {
            'days_per_week': daysPerWeek,
            'session_duration': sessionDuration,
          },
          'lang': lang,
        },
      );
      return response.data ?? {};
    } on DioException catch (e) {
      throw RapidApiException(
        message: e.message ?? 'Error creating custom workout plan',
        statusCode: e.response?.statusCode,
      );
    }
  }

  /// Analyze food plate nutrition
  Future<Map<String, dynamic>> analyzeFoodPlate({
    required String foodDescription,
    String lang = 'en',
  }) async {
    if (useMock) return _mockFoodAnalysis(foodDescription);

    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/analyzeFoodPlate',
        data: {
          'food_description': foodDescription,
          'lang': lang,
        },
      );
      return response.data ?? {};
    } on DioException catch (e) {
      throw RapidApiException(
        message: e.message ?? 'Error analyzing food plate',
        statusCode: e.response?.statusCode,
      );
    }
  }

  // ── Mock Responses ────────────────────────────────────────────────────────

  Map<String, dynamic> _mockWorkoutPlan(
      String goal, String level, int days) {
    return {
      'plan_name': 'AI Generated Plan (Mock)',
      'goal': goal,
      'fitness_level': level,
      'schedule': {'days_per_week': days, 'session_duration': 60},
      'weeks': [
        {
          'week': 1,
          'days': List.generate(
            days,
            (i) => {
              'day': i + 1,
              'muscle_group': ['Push', 'Pull', 'Legs', 'Full Body'][i % 4],
              'exercises': [
                {'name': 'Bench Press', 'sets': 3, 'reps': '8-10'},
                {'name': 'Pull-ups', 'sets': 3, 'reps': '6-8'},
                {'name': 'Squats', 'sets': 4, 'reps': '8-12'},
              ],
            },
          ),
        }
      ],
    };
  }

  Map<String, dynamic> _mockExerciseDetails(String name) {
    return {
      'exercise': name,
      'description':
          'A compound movement targeting multiple muscle groups. Keep your form strict and focus on the mind-muscle connection.',
      'primary_muscles': ['Chest', 'Triceps'],
      'secondary_muscles': ['Shoulders'],
      'equipment': 'Barbell',
      'tips': ['Keep your back flat', 'Breathe out on the push'],
    };
  }

  Map<String, dynamic> _mockNutritionAdvice(String goal) {
    final cals = goal == 'LOSE_WEIGHT'
        ? 1800
        : goal == 'GAIN_MUSCLE_MASS'
            ? 2800
            : 2200;
    return {
      'daily_calories': cals,
      'macros': {
        'protein_g': (cals * 0.30 / 4).round(),
        'carbs_g': (cals * 0.40 / 4).round(),
        'fat_g': (cals * 0.30 / 9).round(),
      },
      'meal_plan': [
        {'meal': 'Breakfast', 'example': 'Oats with protein powder and banana'},
        {'meal': 'Lunch', 'example': 'Grilled chicken, rice, and vegetables'},
        {'meal': 'Dinner', 'example': 'Salmon with sweet potato and salad'},
        {'meal': 'Snack', 'example': 'Greek yogurt with almonds'},
      ],
      'tips': [
        'Drink at least 2L of water daily',
        'Eat protein within 30 min of training',
        'Avoid ultra-processed foods',
      ],
    };
  }

  Map<String, dynamic> _mockFoodAnalysis(String description) {
    return {
      'food': description,
      'estimated_calories': 520,
      'macros': {
        'protein_g': 35,
        'carbs_g': 55,
        'fat_g': 15,
      },
      'micronutrients': {
        'fiber_g': 6,
        'sodium_mg': 480,
        'sugar_g': 8,
      },
      'health_score': 7.2,
      'notes': 'Good protein content. Consider adding more vegetables for fiber.',
    };
  }
}

class RapidApiException implements Exception {
  final String message;
  final int? statusCode;

  RapidApiException({required this.message, this.statusCode});

  @override
  String toString() => 'RapidApiException: $message (status: $statusCode)';
}
