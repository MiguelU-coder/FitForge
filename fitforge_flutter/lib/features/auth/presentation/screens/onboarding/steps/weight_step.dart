// lib/features/auth/presentation/screens/onboarding/steps/weight_step.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../../core/theme/app_theme.dart';
import '../../../providers/onboarding_provider.dart';

import '../../../widgets/animated_number_wheel.dart';

class WeightStep extends ConsumerStatefulWidget {
  const WeightStep({super.key});

  @override
  ConsumerState<WeightStep> createState() => _WeightStepState();
}

class _WeightStepState extends ConsumerState<WeightStep> {
  @override
  Widget build(BuildContext context) {
    final currentWeight = ref.watch(onboardingProvider).weightKg ?? 70.0;
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.neon.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.monitor_weight_outlined, color: AppTheme.neon, size: 22),
              ),
              const SizedBox(width: 12),
              const Text(
                'What is your current weight?',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPri,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Padding(
            padding: EdgeInsets.only(left: 52),
            child: Text(
              'Used to calculate BMI and daily calorie needs',
              style: TextStyle(fontSize: 14, color: AppTheme.textSec),
            ),
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
                      // Dummy switcher for aesthetics
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
                AnimatedNumberWheel(
                  minValue: 30,
                  maxValue: 200,
                  initialValue: currentWeight,
                  suffix: 'kg',
                  isDecimal: true,
                  onChanged: (val) {
                    ref.read(onboardingProvider.notifier).setWeight(val);
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
