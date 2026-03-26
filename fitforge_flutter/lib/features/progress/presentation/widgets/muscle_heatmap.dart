import 'package:flutter/material.dart';
import 'package:muscle_selector/muscle_selector.dart';
import '../../../../core/theme/app_colors.dart';
import 'package:google_fonts/google_fonts.dart';

class MuscleHeatmap extends StatefulWidget {
  final Map<String, String> muscleStatus;
  const MuscleHeatmap({super.key, required this.muscleStatus});

  @override
  State<MuscleHeatmap> createState() => _MuscleHeatmapState();
}

class _MuscleHeatmapState extends State<MuscleHeatmap> {
  // Map backend names to package names for muscle_selector 1.0.4
  String _mapMuscle(String muscle) {
    switch (muscle) {
      case 'CHEST':
        return 'chest';
      case 'BACK':
        return 'upper_back';
      case 'SHOULDERS':
        return 'shoulders';
      case 'BICEPS':
        return 'biceps';
      case 'TRICEPS':
        return 'triceps';
      case 'QUADS':
        return 'quads';
      case 'HAMSTRINGS':
        return 'hamstrings';
      case 'GLUTES':
        return 'glutes';
      case 'CALVES':
        return 'calves';
      case 'ABS':
        return 'abs';
      default:
        return muscle.toLowerCase();
    }
  }

  @override
  Widget build(BuildContext context) {
    // Group muscles by status
    final optimal = widget.muscleStatus.entries
        .where((e) => e.value == 'optimal')
        .map((e) => _mapMuscle(e.key))
        .toList();

    final overmrv = widget.muscleStatus.entries
        .where((e) => e.value == 'over_mrv')
        .map((e) => _mapMuscle(e.key))
        .toList();

    final undermev = widget.muscleStatus.entries
        .where((e) => e.value == 'under_mev')
        .map((e) => _mapMuscle(e.key))
        .toList();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black26,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        children: [
          const _HeatmapHeader(),
          const SizedBox(height: 24),
          AspectRatio(
            aspectRatio: 1.0,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Base Map (Grey/Stroke)
                MusclePickerMap(
                  width: 400,
                  height: 400,
                  map: Maps.BODY,
                  isEditing: false,
                  strokeColor: Colors.white24,
                  selectedColor: Colors.transparent,
                  dotColor: Colors.transparent,
                  onChanged: (_) {},
                ),

                // Optimal Layer (Neon Green)
                if (optimal.isNotEmpty)
                  MusclePickerMap(
                    width: 400,
                    height: 400,
                    map: Maps.BODY,
                    isEditing: false,
                    actAsToggle: false,
                    initialSelectedGroups: optimal,
                    selectedColor: AppColors.primary.withValues(alpha: 0.7),
                    strokeColor: Colors.transparent,
                    dotColor: Colors.transparent,
                    onChanged: (_) {},
                  ),

                // Over MRV Layer (Neon Red)
                if (overmrv.isNotEmpty)
                  MusclePickerMap(
                    width: 400,
                    height: 400,
                    map: Maps.BODY,
                    isEditing: false,
                    actAsToggle: false,
                    initialSelectedGroups: overmrv,
                    selectedColor: AppColors.error.withValues(alpha: 0.7),
                    strokeColor: Colors.transparent,
                    dotColor: Colors.transparent,
                    onChanged: (_) {},
                  ),

                // Under MEV Layer (Yellow/Orange)
                if (undermev.isNotEmpty)
                  MusclePickerMap(
                    width: 400,
                    height: 400,
                    map: Maps.BODY,
                    isEditing: false,
                    actAsToggle: false,
                    initialSelectedGroups: undermev,
                    selectedColor: Colors.orange.withValues(alpha: 0.7),
                    strokeColor: Colors.transparent,
                    dotColor: Colors.transparent,
                    onChanged: (_) {},
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const _HeatmapLegend(),
        ],
      ),
    );
  }
}

class _HeatmapHeader extends StatelessWidget {
  const _HeatmapHeader();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.accessibility_new_rounded,
            color: AppColors.primary,
            size: 16,
          ),
        ),
        const SizedBox(width: 12),
        Text(
          'MUSCLE HEATMAP',
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            letterSpacing: 2,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }
}

class _HeatmapLegend extends StatelessWidget {
  const _HeatmapLegend();

  @override
  Widget build(BuildContext context) {
    return const Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _LegendItem(color: AppColors.primary, label: 'Optimal'),
        SizedBox(width: 16),
        _LegendItem(color: AppColors.error, label: 'Overload'),
        SizedBox(width: 16),
        _LegendItem(color: Colors.orange, label: 'Under MEV'),
      ],
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendItem({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            boxShadow: [
              if (color != const Color(0xFF222222))
                BoxShadow(color: color.withValues(alpha: 0.5), blurRadius: 4),
            ],
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 10,
            color: Colors.white38,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
