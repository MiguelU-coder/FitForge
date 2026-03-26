// lib/features/auth/data/sources/auth_remote_source.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../models/auth_models.dart';

final authRemoteSourceProvider = Provider<AuthRemoteSource>((ref) {
  return AuthRemoteSource(ref.read(apiClientProvider));
});

class AuthRemoteSource {
  final ApiClient _client;
  AuthRemoteSource(this._client);

  Future<AuthResponse> register(RegisterRequest req) async {
    final data = await _client.post<Map<String, dynamic>>(
      '/auth/register',
      data: req.toJson(),
    );
    return AuthResponse.fromJson(data);
  }

  Future<AuthResponse> login(LoginRequest req) async {
    final data = await _client.post<Map<String, dynamic>>(
      '/auth/login',
      data: req.toJson(),
    );
    return AuthResponse.fromJson(data);
  }

  Future<void> logout(String refreshToken) async {
    await _client.post<void>(
      '/auth/logout',
      data: {'refreshToken': refreshToken},
    );
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    await _client.patch<void>('/users/me', data: data);
  }

  Future<void> addBodyMetric({required double weightKg}) async {
    await _client.post<void>('/users/me/metrics', data: {'weightKg': weightKg});
  }
}
