// src/theme/typography.ts
// Design System — FitForge "Carbon Forge" Theme v3.0
// Typography: Bebas Neue (display) · Archivo Black (headlines) · DM Sans (body)
// Reference: lib/core/theme/app_theme.dart

import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Typography = {
  // ═══════════════════════════════════════════════════════════════════════════
  // DISPLAY — Bebas Neue (big numbers, timers, heavy stats)
  // ═══════════════════════════════════════════════════════════════════════════
  displayLarge: {
    fontFamily: 'BebasNeue',
    fontSize: 64,
    lineHeight: 64 * 0.95,
    letterSpacing: 1.0,
    color: Colors.textPrimary,
  } as TextStyle,

  displayMedium: {
    fontFamily: 'BebasNeue',
    fontSize: 48,
    lineHeight: 48 * 0.95,
    letterSpacing: 0.5,
    color: Colors.textPrimary,
  } as TextStyle,

  displaySmall: {
    fontFamily: 'BebasNeue',
    fontSize: 36,
    lineHeight: 36 * 0.95,
    letterSpacing: 0.5,
    color: Colors.textPrimary,
  } as TextStyle,

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADLINE — Archivo Black (section titles, screen names)
  // ═══════════════════════════════════════════════════════════════════════════
  headlineLarge: {
    fontFamily: 'ArchivoBlack',
    fontSize: 26,
    lineHeight: 26 * 1.1,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  } as TextStyle,

  headlineMedium: {
    fontFamily: 'ArchivoBlack',
    fontSize: 22,
    lineHeight: 22 * 1.15,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
  } as TextStyle,

  headlineSmall: {
    fontFamily: 'ArchivoBlack',
    fontSize: 18,
    lineHeight: 18 * 1.2,
    letterSpacing: -0.2,
    color: Colors.textPrimary,
  } as TextStyle,

  // ═══════════════════════════════════════════════════════════════════════════
  // TITLE — DM Sans SemiBold (UI labels, subtitles)
  // ═══════════════════════════════════════════════════════════════════════════
  titleLarge: {
    fontFamily: 'DMSans-Bold',
    fontSize: 17,
    letterSpacing: -0.1,
    color: Colors.textPrimary,
  } as TextStyle,

  titleMedium: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  } as TextStyle,

  titleSmall: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    letterSpacing: 0.1,
    color: Colors.textPrimary,
  } as TextStyle,

  // ═══════════════════════════════════════════════════════════════════════════
  // BODY — DM Sans Regular (content)
  // ═══════════════════════════════════════════════════════════════════════════
  bodyLarge: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    lineHeight: 16 * 1.5,
    color: Colors.textPrimary,
  } as TextStyle,

  bodyMedium: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    lineHeight: 14 * 1.5,
    color: Colors.textSecondary,
  } as TextStyle,

  bodySmall: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    lineHeight: 12 * 1.5,
    color: Colors.textTertiary,
  } as TextStyle,

  // ═══════════════════════════════════════════════════════════════════════════
  // LABEL — DM Sans (nav labels, chips, tags)
  // ═══════════════════════════════════════════════════════════════════════════
  labelLarge: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    letterSpacing: 0.2,
    color: Colors.textPrimary,
  } as TextStyle,

  labelMedium: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 12,
    letterSpacing: 0.3,
    color: Colors.textSecondary,
  } as TextStyle,

  labelSmall: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.textTertiary,
  } as TextStyle,

  // ═══════════════════════════════════════════════════════════════════════════
  // BUTTON — DM Sans Bold
  // ═══════════════════════════════════════════════════════════════════════════
  button: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    letterSpacing: 0.3,
    color: Colors.textOnPrimary,
  } as TextStyle,

  buttonSmall: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    letterSpacing: 1.5,
    color: Colors.textOnPrimary,
  } as TextStyle,

  // ═══════════════════════════════════════════════════════════════════════════
  // STATS / NUMBERS — Inter ExtraBold
  // ═══════════════════════════════════════════════════════════════════════════
  statNumber: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 32,
    color: Colors.textPrimary,
  } as TextStyle,

  statSmall: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 24,
    color: Colors.textPrimary,
  } as TextStyle,

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY — Eyebrow pill text
  // ═══════════════════════════════════════════════════════════════════════════
  eyebrow: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.primary,
  } as TextStyle,
} as const;
