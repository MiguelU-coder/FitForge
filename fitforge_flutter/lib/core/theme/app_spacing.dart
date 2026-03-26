// lib/core/theme/app_spacing.dart
// Design System — Spacing and Radius constants for consistent UI

import 'package:flutter/material.dart';

/// Centralized spacing values for consistent layouts.
/// Usage: padding: AppSpacing.md, SizedBox(height: AppSpacing.lg)
class AppSpacing {
  AppSpacing._();

  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  static const double xxl = 32.0;
  static const double xxxl = 48.0;

  // Edge insets shortcuts
  static const EdgeInsets edgeAllXs = EdgeInsets.all(xs);
  static const EdgeInsets edgeAllSm = EdgeInsets.all(sm);
  static const EdgeInsets edgeAllMd = EdgeInsets.all(md);
  static const EdgeInsets edgeAllLg = EdgeInsets.all(lg);
  static const EdgeInsets edgeAllXl = EdgeInsets.all(xl);

  static const EdgeInsets edgeHorizontalLg = EdgeInsets.symmetric(horizontal: lg);
  static const EdgeInsets edgeHorizontalXl = EdgeInsets.symmetric(horizontal: xl);

  static const EdgeInsets edgeVerticalSm = EdgeInsets.symmetric(vertical: sm);
  static const EdgeInsets edgeVerticalMd = EdgeInsets.symmetric(vertical: md);
  static const EdgeInsets edgeVerticalLg = EdgeInsets.symmetric(vertical: lg);

  // Screen padding (standard horizontal edge inset)
  static const EdgeInsets screenHorizontal = EdgeInsets.symmetric(horizontal: lg);
  static const EdgeInsets screenVertical = EdgeInsets.symmetric(vertical: xl);

  // Card padding
  static const EdgeInsets cardPadding = EdgeInsets.all(lg);
  static const EdgeInsets cardPaddingCompact = EdgeInsets.all(md);
}

/// Centralized border radius values for consistent shapes.
/// Usage: borderRadius: BorderRadius.circular(AppRadius.lg)
class AppRadius {
  AppRadius._();

  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 20.0;
  static const double xxl = 24.0;
  static const double full = 999.0;

  // Pre-made border radius
  static BorderRadius get radiusXs => BorderRadius.circular(xs);
  static BorderRadius get radiusSm => BorderRadius.circular(sm);
  static BorderRadius get radiusMd => BorderRadius.circular(md);
  static BorderRadius get radiusLg => BorderRadius.circular(lg);
  static BorderRadius get radiusXl => BorderRadius.circular(xl);
  static BorderRadius get radiusXxl => BorderRadius.circular(xxl);

  // Shapes for cards, buttons, etc.
  static ShapeBorder get cardShape => RoundedRectangleBorder(
    borderRadius: radiusLg,
  );
  static ShapeBorder get buttonShape => RoundedRectangleBorder(
    borderRadius: radiusMd,
  );
  static ShapeBorder get inputShape => RoundedRectangleBorder(
    borderRadius: radiusMd,
  );
}

/// Animation durations for consistent timing.
class AppDurations {
  AppDurations._();

  static const Duration instant = Duration(milliseconds: 0);
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration normal = Duration(milliseconds: 300);
  static const Duration slow = Duration(milliseconds: 500);
  static const Duration page = Duration(milliseconds: 800);
}