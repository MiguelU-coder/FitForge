// lib/core/widgets/stats_display.dart
// Design System — Stats para peso, reps, sets (workout tracker / progress)

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Display de una estadística (peso, reps, sets) para workout y progreso.
class StatsDisplay extends StatelessWidget {
  const StatsDisplay({
    super.key,
    required this.value,
    this.label,
    this.unit,
    this.isPr = false,
    this.size = StatsDisplaySize.medium,
  });

  final String value;
  final String? label;
  final String? unit;
  /// Resaltar como personal record.
  final bool isPr;
  final StatsDisplaySize size;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final valueStyle = _valueStyle(theme.textTheme);
    final labelStyle = theme.textTheme.labelMedium;
    const prColor = AppColors.pr;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: isPr
            ? prColor.withValues(alpha: 0.12)
            : AppColors.elevated,
        borderRadius: BorderRadius.circular(10),
        border: isPr
            ? Border.all(color: prColor.withValues(alpha: 0.4), width: 1)
            : Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: valueStyle?.copyWith(
                  color: isPr ? prColor : null,
                  fontWeight: FontWeight.w700,
                ),
              ),
              if (unit != null) ...[
                const SizedBox(width: 2),
                Text(
                  unit!,
                  style: labelStyle?.copyWith(
                    color: isPr ? prColor.withValues(alpha: 0.9) : null,
                  ),
                ),
              ],
            ],
          ),
          if (label != null) ...[
            const SizedBox(height: 2),
            Text(
              label!,
              style: labelStyle,
            ),
          ],
        ],
      ),
    );
  }

  TextStyle? _valueStyle(TextTheme textTheme) {
    switch (size) {
      case StatsDisplaySize.small:
        return textTheme.titleMedium;
      case StatsDisplaySize.medium:
        return textTheme.headlineSmall;
      case StatsDisplaySize.large:
        return textTheme.headlineMedium;
    }
  }
}

enum StatsDisplaySize { small, medium, large }

/// Fila de estadísticas (ej: 3 columnas peso / reps / sets).
class StatsRow extends StatelessWidget {
  const StatsRow({
    super.key,
    required this.children,
    this.spacing = 8,
  });

  final List<Widget> children;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (var i = 0; i < children.length; i++) ...[
          if (i > 0) SizedBox(width: spacing),
          Expanded(child: children[i]),
        ],
      ],
    );
  }
}
