// lib/core/widgets/ff_widgets.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../services/notification_service.dart';

class NeonButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool outlined;
  final IconData? icon;
  final double height;
  final double? width;

  const NeonButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.outlined = false,
    this.icon,
    this.height = 52,
    this.width,
  });

  @override
  Widget build(BuildContext context) {
    Widget child = isLoading
        ? const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              color: Colors.black,
            ),
          )
        : Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18),
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
            foregroundColor: AppColors.primary,
            side: const BorderSide(color: AppColors.primary, width: 1.5),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
          ),
          child: child,
        ),
      );
    }

    // Filled button with gradient for premium look
    return SizedBox(
      width: width ?? double.infinity,
      height: height,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF1A7A3A), AppColors.primary],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(AppRadius.lg),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.30),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: FilledButton(
          onPressed: isLoading ? null : onPressed,
          style: FilledButton.styleFrom(
            backgroundColor: Colors.transparent,
            foregroundColor: Colors.black,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
            elevation: 0,
          ),
          child: child,
        ),
      ),
    );
  }
}

class GlassCard extends StatelessWidget {
  final Widget child;
  final double radius;
  final bool neonBorder;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  const GlassCard({
    super.key,
    required this.child,
    this.radius = 20,
    this.neonBorder = false,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      decoration: neonBorder
          ? AppColors.neonCard(radius: radius)
          : AppColors.glassCard(radius: radius),
      padding: padding,
      child: child,
    ),
  );
}

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
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: effectiveColor.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 18, color: effectiveColor),
          ),
          const SizedBox(height: 8),
        ],
        // Number: Barlow ExtraBold for maximum impact
        Text(
          value,
          style: GoogleFonts.barlow(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: color ?? AppColors.textPrimary,
            height: 1,
          ),
        ),
        const SizedBox(height: 3),
        // Label: Inter Light, muted grey
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w300,
            color: const Color(0xFF888888),
            letterSpacing: 0.3,
          ),
        ),
      ],
    );
  }
}

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
      children: [
        if (icon != null) ...[
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 8),
        ],
        Text(
          title,
          style: theme.textTheme.titleMedium,
        ),
        const Spacer(),
        if (action != null)
          GestureDetector(
            onTap: onAction,
            child: Text(
              action!,
              style: theme.textTheme.labelLarge?.copyWith(
                color: AppColors.primary,
              ),
            ),
          ),
      ],
    );
  }
}

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
    'GLUTES' || 'CALVES' => const Color(0xFF39FF14),
    'ABS' || 'OBLIQUES' => AppColors.error,
    _ => AppColors.textSecondary,
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
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: small ? AppSpacing.sm : AppSpacing.md,
          vertical: small ? 3 : 6,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? c.withValues(alpha: 0.15)
              : AppColors.elevated.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(small ? AppRadius.sm : AppRadius.md),
          border: Border.all(
            color: isSelected ? c : AppColors.border.withValues(alpha: 0.5),
            width: isSelected ? 1 : 0.5,
          ),
        ),
        child: Text(
          label(muscle),
          style: (small ? theme.textTheme.labelSmall : theme.textTheme.labelMedium)?.copyWith(
            color: isSelected ? c : AppColors.textSecondary,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

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

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.elevated,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Timer section (Text + icon o mini indicador)
          Row(
            children: [
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 36,
                    height: 36,
                    child: CircularProgressIndicator(
                      value: progress,
                      strokeWidth: 3,
                      backgroundColor: AppColors.background,
                      color: isLow ? AppColors.error : AppColors.primary,
                      strokeCap: StrokeCap.round,
                    ),
                  ),
                  if (_remaining == 0)
                    const Icon(Icons.check, size: 18, color: AppColors.primary)
                  else
                    Icon(
                      Icons.timer_outlined,
                      size: 16,
                      color: isLow ? AppColors.error : AppColors.primary,
                    ),
                ],
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'REST TIMER',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: AppColors.textSecondary,
                      letterSpacing: 1.5,
                    ),
                  ),
                  AnimatedBuilder(
                    animation: _pulse,
                    builder: (ctx, child) => Opacity(
                      opacity: isLow && _remaining > 0
                          ? (0.6 + _pulse.value * 0.4)
                          : 1.0,
                      child: Text(
                        _remaining == 0 ? 'Done!' : _display,
                        style: theme.textTheme.headlineSmall?.copyWith(
                          color: _remaining == 0
                              ? AppColors.primary
                              : isLow
                                  ? AppColors.error
                                  : AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Action sections
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
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.border.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: Icon(
                    _remaining == 0 ? Icons.close : Icons.refresh,
                    size: 18,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms).slideY(begin: -0.1, end: 0);
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
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: accent ? AppColors.primary.withValues(alpha: 0.15) : AppColors.background,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: accent
              ? AppColors.primary.withValues(alpha: 0.5)
              : AppColors.border,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: accent ? AppColors.primary : AppColors.textSecondary,
        ),
      ),
    ),
  );
}

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
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: AppColors.elevated,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
            ),
            child: Icon(icon, size: 32, color: AppColors.textMuted),
          ),
          const SizedBox(height: 20),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 8),
            Text(
              subtitle!,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
              textAlign: TextAlign.center,
            ),
          ],
          if (action != null) ...[
            const SizedBox(height: 24),
            action!,
          ] else if (actionLabel != null) ...[
            const SizedBox(height: 24),
            SizedBox(
              width: 200,
              child: NeonButton(
                label: actionLabel!,
                onPressed: onAction,
                height: 44,
              ),
            ),
          ],
        ],
      ),
    ),
  );
}
