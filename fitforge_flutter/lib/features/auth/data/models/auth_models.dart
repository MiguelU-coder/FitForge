// lib/features/auth/data/models/auth_models.dart

// ── Request models ────────────────────────────────────────────────────────────

class RegisterRequest {
  final String email;
  final String password;
  final String displayName;

  const RegisterRequest({
    required this.email,
    required this.password,
    required this.displayName,
  });

  Map<String, dynamic> toJson() => {
    'email': email,
    'password': password,
    'displayName': displayName,
  };
}

class LoginRequest {
  final String email;
  final String password;

  const LoginRequest({required this.email, required this.password});

  Map<String, dynamic> toJson() => {'email': email, 'password': password};
}

// ── Response models ───────────────────────────────────────────────────────────

class AuthUser {
  final String id;
  final String email;
  final String displayName;
  final bool hasCompletedOnboarding;
  
  // Extended Preferences from Supabase user_metadata
  final String weightUnit;
  final String heightUnit;
  final int defaultRestSeconds;
  
  // Extended Profile Info
  final double? heightCm;
  final String? gender;
  final DateTime? dateOfBirth;
  final String? trainingLevel;
  final double? goalWeightKg;

  const AuthUser({
    required this.id,
    required this.email,
    required this.displayName,
    required this.hasCompletedOnboarding,
    this.weightUnit = 'kg',
    this.heightUnit = 'cm',
    this.defaultRestSeconds = 90,
    this.heightCm,
    this.gender,
    this.dateOfBirth,
    this.trainingLevel,
    this.goalWeightKg,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
    id: json['id'] as String,
    email: json['email'] as String,
    displayName: json['displayName'] as String,
    hasCompletedOnboarding: json['hasCompletedOnboarding'] as bool? ?? false,
    weightUnit: json['weightUnit'] as String? ?? 'kg',
    heightUnit: json['heightUnit'] as String? ?? 'cm',
    defaultRestSeconds: json['defaultRestSeconds'] as int? ?? 90,
    heightCm: (json['heightCm'] as num?)?.toDouble(),
    gender: json['gender'] as String?,
    dateOfBirth: json['dateOfBirth'] != null ? DateTime.tryParse(json['dateOfBirth'] as String) : null,
    trainingLevel: json['trainingLevel'] as String?,
    goalWeightKg: (json['goalWeightKg'] as num?)?.toDouble(),
  );
}

class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final DateTime expiresAt;
  final AuthUser user;

  const AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresAt,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
    accessToken: json['accessToken'] as String,
    refreshToken: json['refreshToken'] as String,
    expiresAt: DateTime.parse(json['expiresAt'] as String),
    user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
  );
}
