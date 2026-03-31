// lib/core/widgets/ff_widgets.dart
// "Midnight Forge" shared widget library
// All widgets updated for the new orange+violet+navy color system.

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../services/notification_service.dart';

// ─────────────────────────────────────────────────────────────────────────────
// NeonButton — Forge Edition
// Primary: orange gradient with white text + glow shadow.
// Outlined: orange border, no fill.
// ─────────────────────────────────────────────────────────────────────────────

class NeonButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool outlined;
  final IconData? icon;
  final double height;
  final double? width;
  final Color? color;

  const NeonButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.outlined = false,
    this.icon,
    this.height = 56,
    this.width,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor = color ?? AppColors.primary;

    Widget content = isLoading
        ? SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              color: outlined ? effectiveColor : Colors.white,
            ),
          )
        : Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 20),
                const SizedBox(width: 8),
              ],
              Text(label),
            ],
          );

    if (outlined) {
      return SizedBox(
        width: width ?? double.infinity,
        height: height,
        child: OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            foregroundColor: effectiveColor,
            side: BorderSide(color: effectiveColor, width: 1.5),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
            textStyle: GoogleFonts.dmSans(
              fontWeight: FontWeight.w700,
              fontSize: 16,
              letterSpacing: 0.3,
            ),
          ),
          child: content,
        ),
      );
    }

    // Filled — orange gradient with glow shadow
    return SizedBox(
      width: width ?? double.infinity,
      height: height,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              effectiveColor,
              Color.lerp(effectiveColor, Colors.white, 0.15) ?? effectiveColor,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(AppRadius.lg),
          boxShadow: [
            BoxShadow(
              color: effectiveColor.withValues(alpha: 0.35),
              blurRadius: 16,
              offset: const Offset(0, 5),
            ),
            BoxShadow(
              color: effectiveColor.withValues(alpha: 0.12),
              blurRadius: 32,
              offset: const Offset(0, 0),
            ),
          ],
        ),
        child: FilledButton(
          onPressed: isLoading ? null : onPressed,
          style: FilledButton.styleFrom(
            backgroundColor: Colors.transparent,
            foregroundColor: Colors.white,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
            textStyle: GoogleFonts.dmSans(
              fontWeight: FontWeight.w700,
              fontSize: 16,
              letterSpacing: 0.3,
            ),
            elevation: 0,
          ),
          child: content,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GlassCard — Navy glassmorphism
// ─────────────────────────────────────────────────────────────────────────────

class GlassCard extends StatelessWidget {
  final Widget child;
  final double radius;
  final bool neonBorder;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? accentColor;

  const GlassCard({
    super.key,
    required this.child,
    this.radius = 20,
    this.neonBorder = false,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
    this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    final accent = accentColor ?? AppColors.primary;

    BoxDecoration decoration;
    if (neonBorder) {
      decoration = BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.elevated.withValues(alpha: 0.9),
            AppColors.card.withValues(alpha: 0.7),
          ],
        ),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: accent.withValues(alpha: 0.45), width: 1),
        boxShadow: [
          BoxShadow(
            color: accent.withValues(alpha: 0.14),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      );
    } else {
      decoration = BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.elevated.withValues(alpha: 0.85),
            AppColors.card.withValues(alpha: 0.6),
          ],
        ),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(
          color: AppColors.border.withValues(alpha: 0.6),
          width: 1,
        ),
      );
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(decoration: decoration, padding: padding, child: child),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// StatBadge — Bebas Neue numbers + DM Sans labels
// ─────────────────────────────────────────────────────────────────────────────

class StatBadge extends StatelessWidget {
  final String value, label;
  final Color? color;
  final IconData? icon;

  const StatBadge({
    super.key,
    required this.value,
    required this.label,
    this.color,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor = color ?? AppColors.primary;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  effectiveColor.withValues(alpha: 0.18),
                  effectiveColor.withValues(alpha: 0.08),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
              border: Border.all(
                color: effectiveColor.withValues(alpha: 0.3),
                width: 1,
              ),
            ),
            child: Icon(icon, size: 20, color: effectiveColor),
          ),
          const SizedBox(height: 10),
        ],
        // Number: Bebas Neue for maximum athletic impact
        Text(
          value,
          style: GoogleFonts.bebasNeue(
            fontSize: 36,
            color: color ?? AppColors.textPrimary,
            height: 0.95,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 5),
        // Label: DM Sans small, muted
        Text(
          label.toUpperCase(),
          style: GoogleFonts.dmSans(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: AppColors.textTertiary,
            letterSpacing: 0.8,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionHeader
// ─────────────────────────────────────────────────────────────────────────────

class SectionHeader extends StatelessWidget {
  final String title;
  final String? action;
  final VoidCallback? onAction;
  final IconData? icon;

  const SectionHeader({
    super.key,
    required this.title,
    this.action,
    this.onAction,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        if (icon != null) ...[
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, size: 17, color: AppColors.primary),
          ),
          const SizedBox(width: 10),
        ],
        Text(title, style: theme.textTheme.titleLarge),
        const Spacer(),
        if (action != null)
          GestureDetector(
            onTap: onAction,
            child: Row(
              children: [
                Text(
                  action!,
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: 2),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 11,
                  color: AppColors.primary,
                ),
              ],
            ),
          ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MuscleTag — color-coded muscle group chips
// ─────────────────────────────────────────────────────────────────────────────

class MuscleTag extends StatelessWidget {
  final String muscle;
  final bool isSelected, small;
  final VoidCallback? onTap;

  const MuscleTag({
    super.key,
    required this.muscle,
    this.isSelected = false,
    this.onTap,
    this.small = true,
  });

  static Color color(String m) => switch (m.toUpperCase()) {
    'CHEST' || 'TRICEPS' => AppColors.primary,
    'BACK' || 'BICEPS' => AppColors.accentCyan,
    'SHOULDERS' => AppColors.pr,
    'QUADS' || 'HAMSTRINGS' => AppColors.warning,
    'GLUTES' || 'CALVES' => AppColors.success,
    'ABS' || 'OBLIQUES' => AppColors.error,
    _ => AppColors.secondary,
  };

  static String label(String m) => m
      .replaceAll('_', ' ')
      .toLowerCase()
      .split(' ')
      .map((w) => w.isEmpty ? '' : '${w[0].toUpperCase()}${w.substring(1)}')
      .join(' ');

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = color(muscle);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: EdgeInsets.symmetric(
          horizontal: small ? AppSpacing.sm : AppSpacing.md,
          vertical: small ? 4 : 7,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? c.withValues(alpha: 0.18)
              : AppColors.elevated.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(
            small ? AppRadius.sm : AppRadius.md,
          ),
          border: Border.all(
            color: isSelected ? c : AppColors.border,
            width: isSelected ? 1 : 0.8,
          ),
        ),
        child: Text(
          label(muscle),
          style:
              (small ? theme.textTheme.labelSmall : theme.textTheme.labelMedium)
                  ?.copyWith(
                    color: isSelected ? c : AppColors.textSecondary,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    letterSpacing: 0.2,
                  ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RestTimerWidget — with forge orange/error color transitions
// ─────────────────────────────────────────────────────────────────────────────

class RestTimerWidget extends StatefulWidget {
  final int initialSeconds;
  final VoidCallback? onFinished;
  const RestTimerWidget({
    super.key,
    this.initialSeconds = 150,
    this.onFinished,
  });

  @override
  State<RestTimerWidget> createState() => _RestTimerWidgetState();
}

class _RestTimerWidgetState extends State<RestTimerWidget>
    with SingleTickerProviderStateMixin {
  late int _remaining, _total;
  Timer? _timer;
  late AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _remaining = _total = widget.initialSeconds;
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat(reverse: true);
    _start();
  }

  @override
  void dispose() {
    _timer?.cancel();
    NotificationService().cancelNotification(hashCode);
    _pulse.dispose();
    super.dispose();
  }

  void _start() {
    if (_remaining > 0) {
      NotificationService().scheduleRestTimerNotification(hashCode, _remaining);
    }
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_remaining <= 0) {
        _timer?.cancel();
        NotificationService().cancelNotification(hashCode);
        widget.onFinished?.call();
        return;
      }
      setState(() => _remaining--);
    });
  }

  void _adjust(int s) {
    setState(() => _remaining = (_remaining + s).clamp(0, 600));
    NotificationService().cancelNotification(hashCode);
    if (_remaining > 0) {
      _timer?.cancel();
      _start();
    }
  }

  String get _display {
    final m = _remaining ~/ 60, s = _remaining % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isLow = _remaining <= 10 && _remaining > 0;
    final progress = _total > 0 ? (_total - _remaining) / _total : 1.0;
    final timerColor = _remaining == 0
        ? AppColors.primary
        : isLow
        ? AppColors.error
        : AppColors.primary;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.elevated.withValues(alpha: 0.9),
            AppColors.card.withValues(alpha: 0.7),
          ],
        ),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(
          color: timerColor.withValues(alpha: 0.3),
          width: 0.8,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 48,
                    height: 48,
                    child: CircularProgressIndicator(
                      value: progress,
                      strokeWidth: 3.5,
                      backgroundColor: AppColors.border,
                      color: timerColor,
                      strokeCap: StrokeCap.round,
                    ),
                  ),
                  if (_remaining == 0)
                    const Icon(
                      Icons.check_rounded,
                      size: 20,
                      color: AppColors.primary,
                    )
                  else
                    Icon(Icons.timer_outlined, size: 18, color: timerColor),
                ],
              ),
              const SizedBox(width: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'REST TIMER',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: AppColors.textTertiary,
                      letterSpacing: 1.5,
                      fontSize: 10,
                    ),
                  ),
                  AnimatedBuilder(
                    animation: _pulse,
                    builder: (ctx, child) => Opacity(
                      opacity: isLow && _remaining > 0
                          ? (0.6 + _pulse.value * 0.4)
                          : 1.0,
                      child: Text(
                        _remaining == 0 ? 'Ready!' : _display,
                        style: GoogleFonts.bebasNeue(
                          fontSize: 34,
                          letterSpacing: 1,
                          color: timerColor,
                          height: 0.95,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          Row(
            children: [
              if (_remaining > 0) ...[
                _MiniAdjBtn(label: '-15', onTap: () => _adjust(-15)),
                const SizedBox(width: 6),
                _MiniAdjBtn(
                  label: '+30',
                  onTap: () => _adjust(30),
                  accent: true,
                ),
                const SizedBox(width: 6),
              ],
              GestureDetector(
                onTap: () {
                  NotificationService().cancelNotification(hashCode);
                  if (_remaining == 0) {
                    widget.onFinished?.call();
                  } else {
                    setState(() => _remaining = _total);
                    _timer?.cancel();
                    _start();
                  }
                },
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.border.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                    border: Border.all(color: AppColors.border, width: 1),
                  ),
                  child: Icon(
                    _remaining == 0
                        ? Icons.close_rounded
                        : Icons.refresh_rounded,
                    size: 20,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms).slideY(begin: -0.08, end: 0);
  }
}

class _MiniAdjBtn extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final bool accent;
  const _MiniAdjBtn({
    required this.label,
    required this.onTap,
    this.accent = false,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 120),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: accent
            ? AppColors.primary.withValues(alpha: 0.18)
            : AppColors.background.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(9),
        border: Border.all(
          color: accent
              ? AppColors.primary.withValues(alpha: 0.5)
              : AppColors.border,
          width: 1,
        ),
      ),
      child: Text(
        label,
        style: GoogleFonts.dmSans(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: accent ? AppColors.primary : AppColors.textSecondary,
        ),
      ),
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState — with animated icon container
// ─────────────────────────────────────────────────────────────────────────────

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Widget? action;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
    this.action,
  });

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.elevated.withValues(alpha: 0.8),
                      AppColors.card,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.border, width: 1),
                ),
                child: Icon(icon, size: 38, color: AppColors.textMuted),
              )
              .animate(onPlay: (c) => c.repeat(reverse: true))
              .scaleXY(
                begin: 1.0,
                end: 1.04,
                duration: 2000.ms,
                curve: Curves.easeInOut,
              ),
          const SizedBox(height: 24),
          Text(
            title,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 10),
            Text(
              subtitle!,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 15,
                height: 1.55,
              ),
              textAlign: TextAlign.center,
            ),
          ],
          if (action != null) ...[
            const SizedBox(height: 28),
            action!,
          ] else if (actionLabel != null) ...[
            const SizedBox(height: 28),
            SizedBox(
              width: 200,
              child: NeonButton(
                label: actionLabel!,
                onPressed: onAction,
                height: 46,
              ),
            ),
          ],
        ],
      ),
    ),
  );
}
