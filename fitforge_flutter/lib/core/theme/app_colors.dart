// lib/core/theme/app_colors.dart
// Design System — FitForge "Carbon Forge" — v3.0
// Direction: Premium athletic — neutral carbon base + emerald green
// Neutral backgrounds let the green breathe. No navy competing with the accent.

import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ═══════════════════════════════════════════════════════════════════════════
  // BACKGROUNDS — Pure neutral carbon (no blue tint, clean and breathable)
  // ═══════════════════════════════════════════════════════════════════════════

  /// Main background — Carbon black (#111111)
  static const Color background = Color(0xFF111111);

  /// Content surface (#191919)
  static const Color surface = Color(0xFF191919);

  /// Card backgrounds (#212121)
  static const Color card = Color(0xFF212121);

  /// Highly elevated elements — inputs, modals (#2A2A2A)
  static const Color elevated = Color(0xFF2A2A2A);

  /// Borders and dividers (#383838)
  static const Color border = Color(0xFF383838);

  /// Modal overlay / scrim
  static const Color overlay = Color(0xBB000000);

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY — EMERALD GREEN (vitality, movement, growth)
  // Neutral backgrounds amplify green contrast — the color pops without noise.
  // References: Nike Training, Huel, Athletic Greens — premium and intentional.
  // ═══════════════════════════════════════════════════════════════════════════

  /// Primary — Emerald Green (#18B97A)
  static const Color primary = Color(0xFF18B97A);

  /// Brighter emerald for gradients and hover (#34D399)
  static const Color primaryBright = Color(0xFF34D399);

  /// Deep emerald — pressed/disabled states (#0E9060)
  static const Color primaryDark = Color(0xFF0E9060);

  // ═══════════════════════════════════════════════════════════════════════════
  // SECONDARY — ELECTRIC VIOLET (depth, AI features, premium contrast)
  // ═══════════════════════════════════════════════════════════════════════════

  /// Electric violet (#6D28D9)
  static const Color secondary = Color(0xFF6D28D9);

  /// Lighter violet (#8B5CF6)
  static const Color secondaryBright = Color(0xFF8B5CF6);

  // ═══════════════════════════════════════════════════════════════════════════
  // SEMANTIC COLORS (feedback)
  // ═══════════════════════════════════════════════════════════════════════════

  static const Color success = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF0EA5E9);

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXT — Warm whites over neutral gray backgrounds
  // ═══════════════════════════════════════════════════════════════════════════

  static const Color textPrimary = Color(0xFFF5F5F5);
  static const Color textSecondary = Color(0xFFA3A3A3);
  static const Color textTertiary = Color(0xFF6B6B6B);
  static const Color textMuted = Color(0xFF3D3D3D);

  /// Text on primary green — white for contrast
  static const Color textOnPrimary = Color(0xFFFFFFFF);

  // ═══════════════════════════════════════════════════════════════════════════
  // FITNESS-SPECIFIC COLORS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Personal records — gold
  static const Color pr = Color(0xFFF59E0B);

  /// Failed sets / RIR 0
  static const Color failure = Color(0xFFF87171);

  /// Drop sets — electric violet alias
  static const Color dropSet = Color(0xFF8B5CF6);

  /// Accent — Sky blue (metric highlights, secondary data)
  static const Color accentCyan = Color(0xFF0EA5E9);

  /// Accent alias
  static const Color accent = accentCyan;

  // ═══════════════════════════════════════════════════════════════════════════
  // CARD DECORATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Emerald card — green accent border with subtle glow
  static BoxDecoration neonCard({double radius = 16}) => BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(
          color: primary.withValues(alpha: 0.30),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: primary.withValues(alpha: 0.10),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: primary.withValues(alpha: 0.04),
            blurRadius: 32,
            spreadRadius: 2,
          ),
        ],
      );

  /// Gradient card with emerald tint
  static BoxDecoration gradientCard({double radius = 16}) => BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            primary.withValues(alpha: 0.08),
            card,
          ],
        ),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(
          color: primary.withValues(alpha: 0.20),
          width: 1,
        ),
      );

  /// Glass card — neutral-tinted glassmorphism
  static BoxDecoration glassCard({double radius = 16}) => BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            elevated.withValues(alpha: 0.85),
            card.withValues(alpha: 0.6),
          ],
        ),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(
          color: const Color(0xFF444444).withValues(alpha: 0.5),
          width: 0.8,
        ),
      );

  /// Violet accent card — for AI/secondary features
  static BoxDecoration violetCard({double radius = 16}) => BoxDecoration(
        color: secondary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(
          color: secondary.withValues(alpha: 0.3),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: secondary.withValues(alpha: 0.10),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      );

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  static Color primaryWithOpacity(double opacity) =>
      primary.withValues(alpha: opacity);

  static Color cardWithOpacity(double opacity) =>
      card.withValues(alpha: opacity);

  static Color secondaryWithOpacity(double opacity) =>
      secondary.withValues(alpha: opacity);
}
