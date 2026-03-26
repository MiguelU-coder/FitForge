// lib/core/storage/secure_storage.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../utils/app_constants.dart';

// Provider global — singleton
final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

class SecureStorageService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  // ── Tokens ────────────────────────────────────────────────────────────────

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: AppConstants.kAccessToken,  value: accessToken),
      _storage.write(key: AppConstants.kRefreshToken, value: refreshToken),
    ]);
  }

  Future<String?> getAccessToken()  =>
      _storage.read(key: AppConstants.kAccessToken);

  Future<String?> getRefreshToken() =>
      _storage.read(key: AppConstants.kRefreshToken);

  Future<void> saveUserId(String id) =>
      _storage.write(key: AppConstants.kUserId, value: id);

  Future<String?> getUserId() =>
      _storage.read(key: AppConstants.kUserId);

  Future<bool> hasTokens() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  // ── Logout — limpiar todo ────────────────────────────────────────────────

  Future<void> clearAll() => _storage.deleteAll();
}
