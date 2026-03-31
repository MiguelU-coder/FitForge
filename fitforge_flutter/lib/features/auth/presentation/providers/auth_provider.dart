// lib/features/auth/presentation/providers/auth_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthUser;
import '../../../../core/api/api_client.dart';
import '../../data/models/auth_models.dart';

// ── Supabase Client Provider ────────────────────────────────────────────────────

final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

// ── Auth State ──────────────────────────────────────────────────────────────────

class AuthState {
  final AuthUser? user;
  final bool isLoading;
  final String? error;

  const AuthState({this.user, this.isLoading = false, this.error});

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    AuthUser? user,
    bool? isLoading,
    String? error,
    bool clearUser = false,
    bool clearError = false,
  }) => AuthState(
    user: clearUser ? null : (user ?? this.user),
    isLoading: isLoading ?? this.isLoading,
    error: clearError ? null : (error ?? this.error),
  );
}

// ── Provider ───────────────────────────────────────────────────────────────────

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.read(supabaseClientProvider),
    ref.read(apiClientProvider),
  );
});

class AuthNotifier extends StateNotifier<AuthState> {
  final SupabaseClient _supabase;
  final ApiClient _api;

  AuthNotifier(this._supabase, this._api) : super(const AuthState()) {
    _initAuthListener();
  }

  // Escuchar cambios de autenticación de Supabase
  void _initAuthListener() {
    _supabase.auth.onAuthStateChange.listen((data) {
      final session = data.session;
      if (session != null) {
        _updateUserFromSession(session);
      } else {
        state = const AuthState();
      }
    });

    // Verificar sesión actual al iniciar
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final session = _supabase.auth.currentSession;
    if (session != null) {
      _updateUserFromSession(session);
    }
  }

  void _updateUserFromSession(Session session) {
    final user = session.user;
    final meta = user.userMetadata ?? {};
    
    // Parse numeric fields safely
    final heightCmRaw = meta['heightCm'];
    final heightCm = heightCmRaw != null ? (heightCmRaw as num).toDouble() : null;
    
    final restRaw = meta['defaultRestSeconds'];
    final defaultRestSeconds = restRaw != null ? (restRaw as num).toInt() : 90;
    
    final dobRaw = meta['dateOfBirth'];
    final dateOfBirth = dobRaw != null ? DateTime.tryParse(dobRaw.toString()) : null;

    final goalWtRaw = meta['goalWeightKg'];
    final goalWeightKg = goalWtRaw != null ? (goalWtRaw as num).toDouble() : null;

    state = state.copyWith(
      user: AuthUser(
        id: user.id,
        email: user.email ?? '',
        displayName: meta['display_name'] as String? ?? 'User',
        hasCompletedOnboarding: meta['has_completed_onboarding'] as bool? ?? false,
        weightUnit: meta['weightUnit'] as String? ?? 'kg',
        heightUnit: meta['heightUnit'] as String? ?? 'cm',
        defaultRestSeconds: defaultRestSeconds,
        heightCm: heightCm,
        gender: meta['gender'] as String?,
        dateOfBirth: dateOfBirth,
        trainingLevel: meta['trainingLevel'] as String?,
        goalWeightKg: goalWeightKg,
      ),
      isLoading: false,
    );
  }

  Future<void> register({
    required String email,
    required String password,
    required String displayName,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _supabase.auth.signUp(
        email: email,
        password: password,
      );

      // Guardar metadata adicional del usuario
      if (response.user != null) {
        await _supabase.auth.updateUser(
          UserAttributes(
            data: {
              'display_name': displayName,
              'has_completed_onboarding': false,
            },
          ),
        );
      }

      if (response.session != null) {
        _updateUserFromSession(response.session!);
      } else {
        // Usuario creado pero requiere confirmación de email
        state = state.copyWith(
          isLoading: false,
          error: 'Por favor verifica tu correo electrónico',
        );
      }
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Error al registrarse');
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.session != null) {
        _updateUserFromSession(response.session!);
      }
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Error al iniciar sesión');
    }
  }

  Future<void> logout() async {
    try {
      await _supabase.auth.signOut();
    } catch (_) {
      // Limpiar estado local aunque falle en el servidor
    }
    state = const AuthState();
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        state = state.copyWith(isLoading: false, error: 'No hay sesión activa');
        return;
      }

      // 1. Update Backend Database via API
      await _api.patch('/users/me', data: data);

      // 2. Update Supabase Metadata (for quick access and session sync)
      final currentMetadata = user.userMetadata ?? {};
      final newMetadata = Map<String, dynamic>.from(currentMetadata);
      newMetadata.addAll(data);

      await _supabase.auth.updateUser(
        UserAttributes(data: newMetadata),
      );

      // Refresh session to get updated metadata
      await _supabase.auth.refreshSession();

      // Get the updated user from the refreshed session
      final updatedUser = _supabase.auth.currentUser;
      if (updatedUser != null) {
        _updateUserFromSession(_supabase.auth.currentSession!);
      } else {
        state = state.copyWith(isLoading: false);
      }
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Error al actualizar perfil');
    }
  }

  Future<void> addBodyMetric({required double weightKg}) async {
    // En Supabase, guardamos métricas en la tabla user_metrics
    try {
      final user = _supabase.auth.currentUser;
      if (user != null) {
        await Supabase.instance.client.from('user_metrics').insert({
          'user_id': user.id,
          'weight_kg': weightKg,
        });
      }
    } catch (e) {
      // Silencioso - la métrica se puede reintentar después
    }
  }

  void clearError() => state = state.copyWith(clearError: true);

  // ── OAuth Providers ─────────────────────────────────────────────────────────────

  Future<void> signInWithGoogle() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _supabase.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'io.supabase.fitforge://callback',
      );

      if (!response) {
        state = state.copyWith(
          isLoading: false,
          error: 'Failed to open Google sign-in',
        );
      }
      // El login se completa vía deep link, el listener de onAuthStateChange manejará el resto
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Error signing in with Google',
      );
    }
  }

  Future<void> signInWithApple() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _supabase.auth.signInWithOAuth(
        OAuthProvider.apple,
        redirectTo: 'io.supabase.fitforge://callback',
      );

      if (!response) {
        state = state.copyWith(
          isLoading: false,
          error: 'Failed to open Apple sign-in',
        );
      }
      // El login se completa vía deep link, el listener de onAuthStateChange manejará el resto
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Error signing in with Apple',
      );
    }
  }
}
