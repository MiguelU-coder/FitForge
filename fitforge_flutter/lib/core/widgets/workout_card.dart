// lib/core/widgets/workout_card.dart
// Design System — WorkoutCard para listados de entrenamientos (Strong / Hevy style)

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';

/// Tarjeta de entrenamiento para listados y home.
/// Muestra nombre, duración, ejercicios y acción principal.
class WorkoutCard extends StatelessWidget {
  const WorkoutCard({
    super.key,
    required this.title,
    this.subtitle,
    this.duration,
    this.exerciseCount = 0,
    this.onTap,
    this.trailing,
    this.isActive,
  });

  final String title;
  final String? subtitle;
  final Duration? duration;
  final int exerciseCount;
  final VoidCallback? onTap;
  final Widget? trailing;
  /// Si está en curso (highlight verde).
  final bool? isActive;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final active = isActive ?? false;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: active
                  ? AppColors.primaryWithOpacity(0.5)
                  : AppColors.border,
              width: active ? 1.5 : 0.5,
            ),
            boxShadow: active ? AppTheme.primaryGlow : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  if (trailing != null) trailing!,
                ],
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 4),
                Text(
                  subtitle!,
                  style: theme.textTheme.bodyMedium,
                ),
              ],
              if (duration != null || exerciseCount > 0) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    if (duration != null)
                      _StatChip(
                        icon: Icons.schedule_outlined,
                        label: _formatDuration(duration!),
                      ),
                    if (duration != null && exerciseCount > 0)
                      const SizedBox(width: 12),
                    if (exerciseCount > 0)
                      _StatChip(
                        icon: Icons.fitness_center_outlined,
                        label: '$exerciseCount ejercicios',
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  static String _formatDuration(Duration d) {
    final m = d.inMinutes;
    if (m < 60) return '${m}min';
    final h = m ~/ 60;
    final rest = m % 60;
    return rest > 0 ? '${h}h ${rest}min' : '${h}h';
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textTertiary),
        const SizedBox(width: 4),
        Text(
          label,
          style: theme.textTheme.labelMedium,
        ),
      ],
    );
  }
}
