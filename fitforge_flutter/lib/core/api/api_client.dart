// lib/core/api/api_client.dart
//
// Cliente HTTP central con:
//   - Usa el token de sesión de Supabase para autenticación
//   - Refresca el token automáticamente si está vencido
//   - Logging en modo debug
//   - Manejo de errores tipado

import 'package:dio/dio.dart';
import 'dart:developer' as dev;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../utils/app_constants.dart';
import 'api_exception.dart';

// Provider del cliente Dio configurado
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

class ApiClient {
  late final Dio _dio;

  // Para evitar loops de refresh
  bool _isRefreshing = false;

  ApiClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl:        AppConstants.baseUrl,
        connectTimeout: AppConstants.connectTimeout,
        receiveTimeout: AppConstants.receiveTimeout,
        sendTimeout:    AppConstants.sendTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept':       'application/json',
        },
      ),
    );

    _dio.interceptors.addAll([
      _SupabaseAuthInterceptor(this),
      PrettyDioLogger(
        requestHeader:  false,
        requestBody:    true,
        responseBody:   true,
        responseHeader: false,
        error:          true,
        compact:        true,
      ),
    ]);
  }

  // ── HTTP methods ──────────────────────────────────────────────────────────

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        path,
        queryParameters: queryParameters,
      );
      return _extractData<T>(response);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<T> post<T>(
    String path, {
    dynamic data,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(path, data: data);
      return _extractData<T>(response);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<T> patch<T>(
    String path, {
    dynamic data,
  }) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>(path, data: data);
      return _extractData<T>(response);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<void> delete(String path) async {
    try {
      await _dio.delete<Map<String, dynamic>>(path);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  // Extrae el campo 'data' de la respuesta estándar { success, data, message }
  T _extractData<T>(Response<Map<String, dynamic>> response) {
    final body = response.data;
    if (body == null) return null as T;
    // Si la respuesta tiene el campo 'data', devuelve ese; si no, devuelve el body completo
    if (body.containsKey('data') && body['data'] != null) {
      return body['data'] as T;
    }
    return body as T;
  }

  // Exponer el dio raw para casos especiales
  Dio get dio => _dio;
}

// ── Supabase Auth Interceptor ───────────────────────────────────────────────

class _SupabaseAuthInterceptor extends Interceptor {
  final ApiClient _client;

  _SupabaseAuthInterceptor(this._client);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Rutas públicas — no inyectar token
    final publicPaths = ['/auth/register', '/auth/login', '/auth/refresh'];
    if (publicPaths.any((p) => options.path.endsWith(p))) {
      return handler.next(options);
    }

    final supabase = Supabase.instance.client;
    var session = supabase.auth.currentSession;

    // If the session is null or the access token is expired/near-expiry,
    // proactively refresh it before sending the request.
    if (session == null || _isTokenExpiredOrExpiring(session)) {
      dev.log('[ApiClient] Session is null or expiring. Refreshing...');
      try {
        final refreshed = await supabase.auth.refreshSession().timeout(
          const Duration(seconds: 15),
          onTimeout: () => throw Exception('Supabase session refresh timed out'),
        );
        session = refreshed.session;
        dev.log('[ApiClient] Session refreshed successfully');
      } catch (e) {
        dev.log('[ApiClient] Session refresh failed: $e');
      }
    }

    if (session != null) {
      options.headers['Authorization'] = 'Bearer ${session.accessToken}';
    } else {
      dev.log('[ApiClient] No session available for request to ${options.path}');
    }

    handler.next(options);
  }

  /// Returns true if the token is already expired or expires in < 60 seconds.
  bool _isTokenExpiredOrExpiring(Session session) {
    final expiresAt = session.expiresAt;
    if (expiresAt == null) return false;
    final expiresAtDate =
        DateTime.fromMillisecondsSinceEpoch(expiresAt * 1000, isUtc: true);
    return DateTime.now().toUtc().isAfter(
          expiresAtDate.subtract(const Duration(seconds: 60)),
        );
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // Solo intentar refresh en 401 y si no estamos ya refreshing
    if (err.response?.statusCode != 401 || _client._isRefreshing) {
      return handler.next(err);
    }

    _client._isRefreshing = true;

    try {
      final supabase = Supabase.instance.client;

      // Intentar refresh del token de Supabase
      final response = await supabase.auth.refreshSession();

      if (response.session != null) {
        // Reintentar el request original con el nuevo token
        final retryOptions = err.requestOptions;
        retryOptions.headers['Authorization'] =
            'Bearer ${response.session!.accessToken}';

        final retryResponse =
            await _client.dio.fetch<Map<String, dynamic>>(retryOptions);
        return handler.resolve(retryResponse);
      } else {
        // No se pudo refrescar - forzar logout
        await supabase.auth.signOut();
        return handler.next(err);
      }
    } catch (_) {
      // Refresh falló
      return handler.next(err);
    } finally {
      _client._isRefreshing = false;
    }
  }
}