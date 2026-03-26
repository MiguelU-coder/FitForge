// lib/core/widgets/exercise_card.dart
// Design System — ExerciseCard para listados y sesión activa (set logging)

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Tarjeta de ejercicio para listados y durante el workout.
/// Muestra nombre, músculo, sets/reps o peso reciente.
class ExerciseCard extends StatelessWidget {
  const ExerciseCard({
    super.key,
    required this.name,
    this.muscleGroup,
    this.setsSummary,
    this.lastPerformance,
    this.onTap,
    this.trailing,
    this.isSelected,
  });

  final String name;
  final String? muscleGroup;
  /// Ej: "3 sets × 10 reps"
  final String? setsSummary;
  /// Ej: "60 kg × 8" (último rendimiento)
  final String? lastPerformance;
  final VoidCallback? onTap;
  final Widget? trailing;
  final bool? isSelected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final selected = isSelected ?? false;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.elevated,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected
                  ? AppColors.primaryWithOpacity(0.5)
                  : AppColors.border,
              width: selected ? 1 : 0.5,
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      name,
                      style: theme.textTheme.titleMedium,
                    ),
                    if (muscleGroup != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        muscleGroup!,
                        style: theme.textTheme.labelMedium,
                      ),
                    ],
                    if (setsSummary != null || lastPerformance != null) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          if (setsSummary != null)
                            Text(
                              setsSummary!,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: AppColors.primaryBright,
                              ),
                            ),
                          if (setsSummary != null && lastPerformance != null)
                            Text(
                              ' · ',
                              style: theme.textTheme.labelSmall,
                            ),
                          if (lastPerformance != null)
                            Text(
                              lastPerformance!,
                              style: theme.textTheme.labelSmall,
                            ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
        ),
      ),
    );
  }
}
