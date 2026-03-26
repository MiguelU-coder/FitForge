// lib/core/api/api_exception.dart
import 'package:dio/dio.dart';

class ApiException implements Exception {
  final String message;
  final int?   statusCode;
  final Map<String, dynamic>? errors;

  const ApiException({
    required this.message,
    this.statusCode,
    this.errors,
  });

  factory ApiException.fromDio(DioException e) {
    final response = e.response;

    // Error de conexión / timeout
    if (response == null) {
      return switch (e.type) {
        DioExceptionType.connectionTimeout ||
        DioExceptionType.sendTimeout      ||
        DioExceptionType.receiveTimeout   => const ApiException(
            message:    'Connection timeout. Check your internet.',
            statusCode: 408,
          ),
        DioExceptionType.connectionError  => const ApiException(
            message:    'Cannot reach server. Is the backend running?',
            statusCode: 503,
          ),
        _ => ApiException(
            message:    e.message ?? 'Unexpected network error',
            statusCode: null,
          ),
      };
    }

    // Error con respuesta del servidor
    final body    = response.data;
    String message = 'Something went wrong';

    if (body is Map<String, dynamic>) {
      message = body['message'] as String? ?? message;
    }

    return ApiException(
      message:    message,
      statusCode: response.statusCode,
      errors:     body is Map<String, dynamic>
          ? body['errors'] as Map<String, dynamic>?
          : null,
    );
  }

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden    => statusCode == 403;
  bool get isNotFound     => statusCode == 404;
  bool get isConflict     => statusCode == 409;
  bool get isServerError  => statusCode != null && statusCode! >= 500;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
