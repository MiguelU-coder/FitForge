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
          const Text(
            '🎯 What is your goal weight?',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: AppTheme.textPri,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Your target weight to achieve your fitness goal',
            style: TextStyle(fontSize: 14, color: AppTheme.textSec),
          ),
          const SizedBox(height: 48),
          Center(
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.bgElevated.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Kilogram',
                        style: TextStyle(
                          color: AppTheme.textSec,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Dummy switcher
                      Container(
                        width: 40,
                        height: 20,
                        decoration: BoxDecoration(
                          color: AppTheme.border,
                          borderRadius: BorderRadius.circular(10),
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
