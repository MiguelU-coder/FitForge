// lib/core/utils/app_constants.dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConstants {
  AppConstants._();

  // ── API ───────────────────────────────────────────────────────────────────
  // Para emulador Android: usar 10.0.2.2 (apunta al localhost del host)
  // Para dispositivo físico: usar la IP de tu máquina en la red local
  // Para iOS Simulator: localhost funciona directamente
  static const String baseUrl = 'http://10.0.2.2:3000/api/v1';
  // static const String baseUrl = 'http://localhost:3000/api/v1';       // iOS
  // static const String baseUrl = 'http://192.168.x.x:3000/api/v1';    // Físico

  // ── RapidAPI ─────────────────────────────────────────────────────────────
  static const String rapidApiHost = 'ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com';
  static String get rapidApiKey => dotenv.env['X_RAPIDAPI_KEY'] ?? '';

  static const Duration connectTimeout  = Duration(seconds: 30);
  static const Duration receiveTimeout  = Duration(seconds: 60);
  static const Duration sendTimeout     = Duration(seconds: 30);

  // ── Storage keys ──────────────────────────────────────────────────────────
  static const String kAccessToken  = 'access_token';
  static const String kRefreshToken = 'refresh_token';
  static const String kUserId       = 'user_id';

  // ── UI ────────────────────────────────────────────────────────────────────
  static const double paddingS  = 8.0;
  static const double paddingM  = 16.0;
  static const double paddingL  = 24.0;
  static const double paddingXL = 32.0;
  static const double radiusS   = 8.0;
  static const double radiusM   = 12.0;
  static const double radiusL   = 16.0;
}
