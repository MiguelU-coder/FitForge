// lib/features/auth/presentation/screens/onboarding/steps/goal_weight_step.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../../core/theme/app_theme.dart';
import '../../../providers/onboarding_provider.dart';

import '../../../widgets/animated_number_wheel.dart';

class GoalWeightStep extends ConsumerStatefulWidget {
  const GoalWeightStep({super.key});

  @override
  ConsumerState<GoalWeightStep> createState() => _GoalWeightStepState();
}

class _GoalWeightStepState extends ConsumerState<GoalWeightStep> {
  @override
  Widget build(BuildContext context) {
    final currentGoalWeight =
        ref.watch(onboardingProvider).goalWeightKg ?? 65.0;
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.neon.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.track_changes_rounded, color: AppTheme.neon, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Target Weight',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPri,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      'Select the weight you want to reach',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSec.withValues(alpha: 0.7),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 48),
          Center(
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.bgCard,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.border.withValues(alpha: 0.8)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'KILOGRAM',
                        style: TextStyle(
                          color: AppTheme.neon,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        width: 1,
                        height: 12,
                        color: AppTheme.border,
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'KG',
                        style: TextStyle(
                          color: AppTheme.textSec,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 48),
                AnimatedNumberWheel(
                  minValue: 30,
                  maxValue: 200,
                  initialValue: currentGoalWeight,
                  suffix: 'kg',
                  isDecimal: true,
                  onChanged: (val) {
                    ref.read(onboardingProvider.notifier).setGoalWeight(val);
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
