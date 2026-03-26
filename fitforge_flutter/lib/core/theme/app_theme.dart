// lib/core/theme/app_theme.dart
// Design System — Tema oscuro fitness (Strong / Hevy / Apple Fitness)

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

class AppTheme {
  AppTheme._();

  // ── Compatibilidad con widgets existentes (delegación a AppColors) ──────────
  // OJO: se definen como `const` para poder usarlos dentro de expresiones `const`
  // existentes en la app (TextStyle/Icon/BorderSide, etc.).
  static const Color neon = AppColors.primary;
  static const Color neonDim = AppColors.primaryDark;
  static const Color bg = AppColors.background;
  static const Color bgCard = AppColors.card;
  static const Color bgElevated = AppColors.elevated;
  static const Color border = AppColors.border;
  static const Color textPri = AppColors.textPrimary;
  static const Color textSec = AppColors.textSecondary;
  static const Color textMuted = AppColors.textTertiary;
  static const Color error = AppColors.error;
  static const Color warning = AppColors.warning;
  static const Color gold = AppColors.pr;
  static const Color cyan = AppColors.accentCyan;
  static const Color success = AppColors.success;

  // ── Gradients ─────────────────────────────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [AppColors.primary, AppColors.primaryBright],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGrad = LinearGradient(
    colors: [Color(0xFF141414), Color(0xFF0E0E0E)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ── Shadows ───────────────────────────────────────────────────────────────
  static List<BoxShadow> get primaryGlow => [
    BoxShadow(
      color: AppColors.primaryWithOpacity(0.15),
      blurRadius: 20,
      spreadRadius: 0,
    ),
    BoxShadow(
      color: AppColors.primaryWithOpacity(0.05),
      blurRadius: 40,
      spreadRadius: 0,
    ),
  ];

  static List<BoxShadow> get neonGlow => primaryGlow;

  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.5),
      blurRadius: 16,
      offset: const Offset(0, 6),
    ),
  ];

  // ── Decorations ───────────────────────────────────────────────────────────
  static BoxDecoration glassCard({
    double radius = 16,
    bool withBorder = true,
  }) => BoxDecoration(
    gradient: LinearGradient(
      colors: [
        AppColors.card.withValues(alpha: 0.9),
        AppColors.card.withValues(alpha: 0.6),
      ],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    borderRadius: BorderRadius.circular(radius),
    border: withBorder
        ? Border.all(color: AppColors.border.withValues(alpha: 0.5), width: 0.5)
        : null,
    boxShadow: cardShadow,
  );

  static BoxDecoration neonCard({double radius = 16}) => BoxDecoration(
    color: AppColors.card,
    borderRadius: BorderRadius.circular(radius),
    border: Border.all(color: AppColors.primaryWithOpacity(0.5), width: 0.5),
    boxShadow: primaryGlow,
  );

  static BoxDecoration gradientCard({double radius = 16}) => BoxDecoration(
    gradient: LinearGradient(
      colors: [AppColors.primaryWithOpacity(0.12), AppColors.card],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    borderRadius: BorderRadius.circular(radius),
    border: Border.all(color: AppColors.primaryWithOpacity(0.3), width: 0.5),
  );

  // ── TextTheme (Barlow Bold para números/displays, Inter para textos) ────────
  static TextTheme _buildTextTheme() {
    const colorPrimary = AppColors.textPrimary;
    const colorSecondary = AppColors.textSecondary;
    const colorMuted = AppColors.textTertiary;
    return TextTheme(
      // ── Display: Números grandes — peso, reps, tiempo (Barlow Bold) ──────────
      displayLarge: GoogleFonts.barlow(
        fontSize: 34,
        fontWeight: FontWeight.w700,
        letterSpacing: -1.5,
        color: colorPrimary,
      ),
      displayMedium: GoogleFonts.barlow(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        letterSpacing: -1.2,
        color: colorPrimary,
      ),
      displaySmall: GoogleFonts.barlow(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        letterSpacing: -1.0,
        color: colorPrimary,
      ),
      // ── Headline: Títulos de sección (Inter Bold) ────────────────────────────
      headlineLarge: GoogleFonts.inter(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.8,
        color: colorPrimary,
      ),
      headlineMedium: GoogleFonts.inter(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
        color: colorPrimary,
      ),
      headlineSmall: GoogleFonts.inter(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
        color: colorPrimary,
      ),
      // ── Title: Subtítulos e interfaces (Inter SemiBold) ──────────────────────
      titleLarge: GoogleFonts.inter(
        fontSize: 17,
        fontWeight: FontWeight.w700,
        color: colorPrimary,
      ),
      titleMedium: GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: colorPrimary,
      ),
      titleSmall: GoogleFonts.inter(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: colorPrimary,
      ),
      // ── Body: Contenido general (Inter Regular) ───────────────────────────────
      bodyLarge: GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: colorPrimary,
      ),
      // ── Body secundario: Descripciones como "Workouts", "Total Sets" ──────────
      bodyMedium: GoogleFonts.inter(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        color: colorSecondary,
      ),
      bodySmall: GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: colorMuted,
      ),
      // ── Label: Etiquetas de navegación y chips ───────────────────────────────
      labelLarge: GoogleFonts.inter(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: colorPrimary,
      ),
      labelMedium: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: colorSecondary,
      ),
      labelSmall: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        letterSpacing: 0.5,
        color: colorMuted,
      ),
    );
  }

  // ── Theme Data ─────────────────────────────────────────────────────────────
  static ThemeData dark() {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarColor: AppColors.background,
        systemNavigationBarIconBrightness: Brightness.light,
      ),
    );

    final textTheme = _buildTextTheme();

    return ThemeData.dark(useMaterial3: true).copyWith(
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        onPrimary: AppColors.textOnPrimary,
        primaryContainer: AppColors.primaryDark,
        secondary: AppColors.primaryBright,
        error: AppColors.error,
        onError: AppColors.textPrimary,
        surface: AppColors.card,
        onSurface: AppColors.textPrimary,
        outline: AppColors.border,
        surfaceContainerHighest: AppColors.elevated,
      ),
      scaffoldBackgroundColor: AppColors.background,
      textTheme: textTheme,

      // ── AppBarTheme ────────────────────────────────────────────────────────
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        titleTextStyle: textTheme.headlineSmall?.copyWith(
          fontWeight: FontWeight.w700,
        ),
        iconTheme: const IconThemeData(color: AppColors.textPrimary, size: 24),
        actionsIconTheme: const IconThemeData(
          color: AppColors.textPrimary,
          size: 24,
        ),
      ),

      // ── CardTheme ─────────────────────────────────────────────────────────
      cardTheme: CardThemeData(
        color: AppColors.card,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.border, width: 0.5),
        ),
        margin: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
      ),

      // ── ElevatedButtonTheme (Start Workout, CTAs) ───────────
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.textOnPrimary, // Texto e icon en negro
          minimumSize: const Size(double.infinity, 54),
          padding: const EdgeInsets.symmetric(horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.2,
          ),
          elevation: 0,
        ),
      ),

      // ── FilledButtonTheme (mismo estilo CTA principal) ────────────────────
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.textOnPrimary,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.3,
          ),
          elevation: 0,
        ),
      ),

      // ── InputDecorationTheme ───────────────────────────────────────────────
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.elevated,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        hintStyle: GoogleFonts.inter(
          color: AppColors.textTertiary,
          fontSize: 14,
          fontWeight: FontWeight.w400,
        ),
        labelStyle: GoogleFonts.inter(
          color: AppColors.textSecondary,
          fontSize: 14,
          fontWeight: FontWeight.w400,
        ),
      ),

      // ── BottomNavigationBarTheme ────────────────────────────────────────────
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.card,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textTertiary,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        showSelectedLabels: true,
        showUnselectedLabels: true,
      ),

      // ── OutlinedButtonTheme ────────────────────────────────────────────────
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimary,
          minimumSize: const Size(double.infinity, 52),
          side: const BorderSide(color: AppColors.border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.surface, // Asfalto intermedio
        indicatorColor: AppColors.primaryWithOpacity(0.2), // Pill suave
        surfaceTintColor: Colors.transparent,
        elevation: 10,
        shadowColor: Colors.black.withValues(alpha: 0.5),
        height: 80,
        iconTheme: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected)
              ? const IconThemeData(color: AppColors.primary, size: 24)
              : const IconThemeData(color: AppColors.textTertiary, size: 24),
        ),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected)
              ? GoogleFonts.inter(
                  color: AppColors.primary,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                )
              : GoogleFonts.inter(
                  color: AppColors.textTertiary,
                  fontSize: 12,
                  fontWeight: FontWeight.w400,
                ),
        ),
      ),

      chipTheme: ChipThemeData(
        backgroundColor: AppColors.elevated,
        selectedColor: AppColors.primaryWithOpacity(0.2),
        labelStyle: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          color: AppColors.textSecondary,
        ),
        side: const BorderSide(color: AppColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),

      dividerTheme: const DividerThemeData(
        color: AppColors.border,
        thickness: 0.5,
      ),

      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.card,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),

      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.card,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.border),
        ),
      ),

      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.elevated,
        contentTextStyle: GoogleFonts.inter(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w400,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

// ── Duraciones de animación ──────────────────────────────────────────────────
class AppDurations {
  static const fast = Duration(milliseconds: 150);
  static const normal = Duration(milliseconds: 300);
  static const slow = Duration(milliseconds: 500);
  static const page = Duration(milliseconds: 800);
}
