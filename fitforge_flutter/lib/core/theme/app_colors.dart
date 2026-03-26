// lib/core/theme/app_colors.dart
// Design System — FitForge Modern Fitness Theme
// Inspired by Hevy, Strong, and Alpha Progression

import 'package:flutter/material.dart';

/// Centralized color palette for the FitForge Design System.
///
/// Color System:
/// - Background: Deep black for the main canvas
/// - Surface: Slightly lighter for content areas
/// - Card: Elevated card backgrounds
/// - Primary: Vibrant green for CTAs and accents
/// - Accent: Brighter green for highlights
class AppColors {
  AppColors._();

  // ═══════════════════════════════════════════════════════════════════════════
  // BACKGROUNDS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Main background — Deep black (#0B0B0B)
  static const Color background = Color(0xFF0B0B0B);

  /// Content surface / Sidebar (#121212)
  static const Color surface = Color(0xFF121212);

  /// Card backgrounds — elevated elements (#1A1A1A)
  static const Color card = Color(0xFF1A1A1A);

  /// Highly elevated elements — inputs, modals, overlays (#27272A)
  static const Color elevated = Color(0xFF27272A);

  /// Borders and dividers (#2A2A2A)
  static const Color border = Color(0xFF2A2A2A);

  /// Modal overlay / scrim
  static const Color overlay = Color(0x99000000);

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY GREEN
  // ═══════════════════════════════════════════════════════════════════════════

  /// Primary green — CTAs, links, selection (#00C853)
  static const Color primary = Color(0xFF00C853);

  /// Accent green — highlights, progress, PRs (#00E676)
  static const Color primaryBright = Color(0xFF00E676);

  /// Dimmed green — pressed/disabled states
  static const Color primaryDark = Color(0xFF00A844);

  // ═══════════════════════════════════════════════════════════════════════════
  // SEMANTIC COLORS (feedback)
  // ═══════════════════════════════════════════════════════════════════════════

  static const Color success = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXT
  // ═══════════════════════════════════════════════════════════════════════════

  /// Primary text — white
  static const Color textPrimary = Color(0xFFFFFFFF);

  /// Secondary text — muted gray (#B3B3B3)
  static const Color textSecondary = Color(0xFFB3B3B3);

  /// Tertiary text — more muted
  static const Color textTertiary = Color(0xFF71717A);

  /// Muted text — least prominent
  static const Color textMuted = Color(0xFF52525B);

  /// Text on primary color — black for contrast
  static const Color textOnPrimary = Color(0xFF000000);

  // ═══════════════════════════════════════════════════════════════════════════
  // FITNESS-SPECIFIC COLORS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Personal records — premium gold
  static const Color pr = Color(0xFFFBBF24);

  /// Failed sets / RIR 0
  static const Color failure = Color(0xFFF87171);

  /// Drop sets, variants — purple neon
  static const Color dropSet = Color(0xFFA78BFA);

  /// Secondary accent (cyan) — charts and variants
  static const Color accentCyan = Color(0xFF22D3EE);

  /// Accent alias — for convenience
  static const Color accent = accentCyan;

  // ═══════════════════════════════════════════════════════════════════════════
  // CARD DECORATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Neon glow card decoration
  static BoxDecoration neonCard({double radius = 16}) => BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: primary.withValues(alpha: 0.3), width: 1),
        boxShadow: [
          BoxShadow(
            color: primary.withValues(alpha: 0.1),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      );

  /// Gradient card with primary glow
  static BoxDecoration gradientCard({double radius = 16}) => BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            primary.withValues(alpha: 0.08),
            primary.withValues(alpha: 0.02),
          ],
        ),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: primary.withValues(alpha: 0.2), width: 1),
      );

  /// Glassmorphism card
  static BoxDecoration glassCard({double radius = 16}) => BoxDecoration(
        color: card.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: border.withValues(alpha: 0.5), width: 1),
      );

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  static Color primaryWithOpacity(double opacity) =>
      primary.withValues(alpha: opacity);

  static Color cardWithOpacity(double opacity) =>
      card.withValues(alpha: opacity);
}
