// lib/core/api/rapidapi/rapid_api_client.dart
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fitforge/core/utils/app_constants.dart';

final rapidApiClientProvider = Provider<RapidApiClient>((ref) {
  return RapidApiClient();
});

class RapidApiClient {
  late final Dio _dio;

  RapidApiClient() {
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
}

class RapidApiException implements Exception {
  final String message;
  final int? statusCode;

  RapidApiException({required this.message, this.statusCode});

  @override
  String toString() => 'RapidApiException: $message (status: $statusCode)';
}
