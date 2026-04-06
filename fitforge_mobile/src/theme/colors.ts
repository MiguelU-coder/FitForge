// src/theme/colors.ts
// Design System — FitForge "Carbon Forge" — v3.0
// Direction: Premium athletic — neutral carbon base + emerald green
// Reference: lib/core/theme/app_colors.dart

import { ColorValue } from 'react-native';

export const Colors = {
  // ═══════════════════════════════════════════════════════════════════════════
  // BACKGROUNDS — Pure neutral carbon (no blue tint)
  // ═══════════════════════════════════════════════════════════════════════════
  /// Main background — Carbon black (#111111)
  background: '#111111',
  /// Content surface (#191919)
  surface: '#191919',
  /// Card backgrounds (#212121)
  card: '#212121',
  /// Highly elevated elements — inputs, modals (#2A2A2A)
  elevated: '#2A2A2A',
  /// Borders and dividers (#383838)
  border: '#383838',
  /// Modal overlay / scrim
  overlay: 'rgba(0,0,0,0.73)',

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY — EMERALD GREEN (vitality, movement, growth)
  // ═══════════════════════════════════════════════════════════════════════════
  /// Primary — Emerald Green (#18B97A)
  primary: '#18B97A',
  /// Brighter emerald for gradients and hover (#34D399)
  primaryBright: '#34D399',
  /// Deep emerald — pressed/disabled states (#0E9060)
  primaryDark: '#0E9060',

  // ═══════════════════════════════════════════════════════════════════════════
  // SECONDARY — ELECTRIC VIOLET (depth, AI features, premium contrast)
  // ═══════════════════════════════════════════════════════════════════════════
  /// Electric violet (#6D28D9)
  secondary: '#6D28D9',
  /// Lighter violet (#8B5CF6)
  secondaryBright: '#8B5CF6',

  // ═══════════════════════════════════════════════════════════════════════════
  // SEMANTIC COLORS (feedback)
  // ═══════════════════════════════════════════════════════════════════════════
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#0EA5E9',

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXT — Warm whites over neutral gray backgrounds
  // ═══════════════════════════════════════════════════════════════════════════
  textPrimary: '#F5F5F5',
  textSecondary: '#A3A3A3',
  textTertiary: '#6B6B6B',
  textMuted: '#3D3D3D',
  /// Text on primary green — white for contrast
  textOnPrimary: '#FFFFFF',

  // ═══════════════════════════════════════════════════════════════════════════
  // FITNESS-SPECIFIC COLORS
  // ═══════════════════════════════════════════════════════════════════════════
  /// Personal records — gold
  pr: '#F59E0B',
  /// Failed sets / RIR 0
  failure: '#F87171',
  /// Drop sets — electric violet alias
  dropSet: '#8B5CF6',
  /// Accent — Sky blue (metric highlights, secondary data)
  accentCyan: '#0EA5E9',
  /// Accent alias
  accent: '#0EA5E9',
} as const;

export type ColorKey = keyof typeof Colors;

// ═══════════════════════════════════════════════════════════════════════════
// GRADIENTS — Equivalent to AppTheme in Flutter
// ═══════════════════════════════════════════════════════════════════════════
export const Gradients = {
  /// Emerald gradient — primary CTAs (like AppTheme.primaryGradient)
  primary: {
    colors: [Colors.primary, Colors.primaryBright],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  /// Deep grove — hero backgrounds
  hero: {
    colors: ['#0A1F14', Colors.background],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  /// Violet gradient — AI/secondary features
  violet: {
    colors: [Colors.secondary, Colors.secondaryBright],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  /// Subtle card gradient — surfaces
  card: {
    colors: ['#2A2A2A', '#212121'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SHADOWS — Equivalent to AppTheme shadows
// ═══════════════════════════════════════════════════════════════════════════
export const Shadows = {
  /// Primary glow for buttons
  primaryGlow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  /// Card shadow
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  /// Violet glow for AI features
  violetGlow: {
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 4,
  },
} as const;
