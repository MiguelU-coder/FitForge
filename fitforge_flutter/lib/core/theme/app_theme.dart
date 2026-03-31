// lib/core/theme/app_theme.dart
// Design System — FitForge "Carbon Forge" Theme v3.0
// Typography: Bebas Neue (display) · Archivo Black (headlines) · DM Sans (body)
// Color: Neutral carbon base + Emerald Green primary + Electric Violet secondary

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

class AppTheme {
  AppTheme._();

  // ── Aliases (backward-compat with existing widgets) ──────────────────────
  static const Color neon = AppColors.primary;      // now emerald green
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

  /// Emerald gradient — primary CTAs
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [AppColors.primary, AppColors.primaryBright],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Deep grove — hero backgrounds (subtle green tint fading to carbon)
  static const LinearGradient heroGradient = LinearGradient(
    colors: [Color(0xFF0A1F14), AppColors.background],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  /// Violet gradient — AI/secondary features
  static const LinearGradient violetGradient = LinearGradient(
    colors: [AppColors.secondary, AppColors.secondaryBright],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Subtle card gradient — surfaces (neutral carbon)
  static const LinearGradient cardGrad = LinearGradient(
    colors: [Color(0xFF2A2A2A), Color(0xFF212121)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ── Shadows ───────────────────────────────────────────────────────────────

  static List<BoxShadow> get primaryGlow => [
        BoxShadow(
          color: AppColors.primaryWithOpacity(0.20),
          blurRadius: 24,
          spreadRadius: 0,
          offset: const Offset(0, 4),
        ),
        BoxShadow(
          color: AppColors.primaryWithOpacity(0.08),
          blurRadius: 48,
          spreadRadius: 4,
        ),
      ];

  static List<BoxShadow> get neonGlow => primaryGlow;

  static List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.6),
          blurRadius: 20,
          offset: const Offset(0, 8),
        ),
        BoxShadow(
          color: const Color(0xFF0EA5E9).withValues(alpha: 0.03),
          blurRadius: 40,
          offset: const Offset(0, 0),
        ),
      ];

  static List<BoxShadow> get violetGlow => [
        BoxShadow(
          color: AppColors.secondaryWithOpacity(0.25),
          blurRadius: 20,
          spreadRadius: 0,
          offset: const Offset(0, 4),
        ),
      ];

  // ── Decorations ───────────────────────────────────────────────────────────

  static BoxDecoration glassCard({
    double radius = 16,
    bool withBorder = true,
  }) =>
      BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.elevated.withValues(alpha: 0.85),
            AppColors.card.withValues(alpha: 0.6),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(radius),
        border: withBorder
            ? Border.all(
                color: const Color(0xFF444444).withValues(alpha: 0.5),
                width: 0.8,
              )
            : null,
        boxShadow: cardShadow,
      );

  static BoxDecoration neonCard({double radius = 16}) =>
      AppColors.neonCard(radius: radius);

  static BoxDecoration gradientCard({double radius = 16}) =>
      AppColors.gradientCard(radius: radius);

  // ── Typography — Bebas Neue · Archivo Black · DM Sans ────────────────────
  static TextTheme _buildTextTheme() {
    const colorPrimary = AppColors.textPrimary;
    const colorSecondary = AppColors.textSecondary;
    const colorMuted = AppColors.textTertiary;

    return TextTheme(
      // ── Display: Bebas Neue — big numbers, timers, heavy stats ──────────
      displayLarge: GoogleFonts.bebasNeue(
        fontSize: 64,
        fontWeight: FontWeight.w400, // Bebas Neue only has one weight
        letterSpacing: 1.0,
        color: colorPrimary,
        height: 0.95,
      ),
      displayMedium: GoogleFonts.bebasNeue(
        fontSize: 48,
        letterSpacing: 0.5,
        color: colorPrimary,
        height: 0.95,
      ),
      displaySmall: GoogleFonts.bebasNeue(
        fontSize: 36,
        letterSpacing: 0.5,
        color: colorPrimary,
        height: 0.95,
      ),

      // ── Headline: Archivo Black — section titles, screen names ───────────
      headlineLarge: GoogleFonts.archivoBlack(
        fontSize: 26,
        fontWeight: FontWeight.w400, // Archivo Black is bold by design
        letterSpacing: -0.5,
        color: colorPrimary,
        height: 1.1,
      ),
      headlineMedium: GoogleFonts.archivoBlack(
        fontSize: 22,
        letterSpacing: -0.3,
        color: colorPrimary,
        height: 1.15,
      ),
      headlineSmall: GoogleFonts.archivoBlack(
        fontSize: 18,
        letterSpacing: -0.2,
        color: colorPrimary,
        height: 1.2,
      ),

      // ── Title: DM Sans SemiBold — UI labels, subtitles ───────────────────
      titleLarge: GoogleFonts.dmSans(
        fontSize: 17,
        fontWeight: FontWeight.w700,
        color: colorPrimary,
        letterSpacing: -0.1,
      ),
      titleMedium: GoogleFonts.dmSans(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: colorPrimary,
      ),
      titleSmall: GoogleFonts.dmSans(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: colorPrimary,
        letterSpacing: 0.1,
      ),

      // ── Body: DM Sans Regular — content ──────────────────────────────────
      bodyLarge: GoogleFonts.dmSans(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: colorPrimary,
        height: 1.5,
      ),
      bodyMedium: GoogleFonts.dmSans(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: colorSecondary,
        height: 1.5,
      ),
      bodySmall: GoogleFonts.dmSans(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: colorMuted,
        height: 1.5,
      ),

      // ── Label: DM Sans — nav labels, chips, tags ─────────────────────────
      labelLarge: GoogleFonts.dmSans(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: colorPrimary,
        letterSpacing: 0.2,
      ),
      labelMedium: GoogleFonts.dmSans(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: colorSecondary,
        letterSpacing: 0.3,
      ),
      labelSmall: GoogleFonts.dmSans(
        fontSize: 10,
        fontWeight: FontWeight.w500,
        color: colorMuted,
        letterSpacing: 0.8,
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
      colorScheme: ColorScheme.dark(
        primary: AppColors.primary,
        onPrimary: AppColors.textOnPrimary,
        primaryContainer: AppColors.primaryDark,
        secondary: AppColors.secondary,
        onSecondary: AppColors.textOnPrimary,
        secondaryContainer: AppColors.secondary.withValues(alpha: 0.3),
        error: AppColors.error,
        onError: AppColors.textPrimary,
        surface: AppColors.card,
        onSurface: AppColors.textPrimary,
        outline: AppColors.border,
        surfaceContainerHighest: AppColors.elevated,
        tertiary: AppColors.accentCyan,
      ),
      scaffoldBackgroundColor: AppColors.background,
      textTheme: textTheme,

      // ── AppBarTheme ────────────────────────────────────────────────────────
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: textTheme.headlineSmall,
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
          side: const BorderSide(
            color: AppColors.border,
            width: 0.8,
          ),
        ),
        margin: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
      ),

      // ── ElevatedButtonTheme ───────────────────────────────────────────────
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.textOnPrimary,
          minimumSize: const Size(double.infinity, 56),
          padding: const EdgeInsets.symmetric(horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: GoogleFonts.dmSans(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.3,
          ),
          elevation: 0,
        ),
      ),

      // ── FilledButtonTheme ─────────────────────────────────────────────────
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.textOnPrimary,
          minimumSize: const Size(double.infinity, 56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: GoogleFonts.dmSans(
            fontSize: 16,
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
          borderSide: const BorderSide(color: AppColors.border, width: 0.8),
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
          horizontal: 18,
          vertical: 16,
        ),
        hintStyle: GoogleFonts.dmSans(
          color: AppColors.textTertiary,
          fontSize: 15,
          fontWeight: FontWeight.w400,
        ),
        labelStyle: GoogleFonts.dmSans(
          color: AppColors.textSecondary,
          fontSize: 15,
          fontWeight: FontWeight.w500,
        ),
      ),

      // ── OutlinedButtonTheme ────────────────────────────────────────────────
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimary,
          minimumSize: const Size(double.infinity, 56),
          side: const BorderSide(color: AppColors.border, width: 1),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: GoogleFonts.dmSans(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          textStyle: GoogleFonts.dmSans(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // ── NavigationBarTheme ────────────────────────────────────────────────
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.primaryWithOpacity(0.18),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shadowColor: Colors.transparent,
        height: 76,
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected)
              ? const IconThemeData(color: AppColors.primary, size: 24)
              : const IconThemeData(color: AppColors.textTertiary, size: 24),
        ),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected)
              ? GoogleFonts.dmSans(
                  color: AppColors.primary,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.2,
                )
              : GoogleFonts.dmSans(
                  color: AppColors.textTertiary,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
        ),
      ),

      // ── BottomNavigationBar (legacy fallback) ─────────────────────────────
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textTertiary,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),

      chipTheme: ChipThemeData(
        backgroundColor: AppColors.elevated,
        selectedColor: AppColors.primaryWithOpacity(0.18),
        labelStyle: GoogleFonts.dmSans(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: AppColors.textSecondary,
        ),
        side: const BorderSide(color: AppColors.border, width: 1),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
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
          side: const BorderSide(color: AppColors.border, width: 0.8),
        ),
      ),

      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.elevated,
        contentTextStyle: GoogleFonts.dmSans(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w400,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

// ── Animation durations ──────────────────────────────────────────────────────
class AppDurations {
  static const fast = Duration(milliseconds: 150);
  static const normal = Duration(milliseconds: 300);
  static const slow = Duration(milliseconds: 500);
  static const page = Duration(milliseconds: 800);
}
