// lib/features/auth/presentation/screens/onboarding/steps/height_step.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../../core/theme/app_theme.dart';
import '../../../providers/onboarding_provider.dart';
import '../../../widgets/animated_number_wheel.dart';

class HeightStep extends ConsumerStatefulWidget {
  const HeightStep({super.key});

  @override
  ConsumerState<HeightStep> createState() => _HeightStepState();
}

class _HeightStepState extends ConsumerState<HeightStep> {
  @override
  Widget build(BuildContext context) {
    final currentHeight = ref.watch(onboardingProvider).heightCm ?? 175.0;
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
                child: const Icon(Icons.height, color: AppTheme.neon, size: 22),
              ),
              const SizedBox(width: 12),
              const Text(
                'What is your height?',
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
              'Used to calculate BMI and ideal weight',
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
                        'Centimeter',
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
                const SizedBox(height: 48),
                AnimatedNumberWheel(
                  minValue: 100,
                  maxValue: 250,
                  initialValue: currentHeight,
                  suffix: 'cm',
                  isDecimal: false,
                  onChanged: (val) {
                    ref.read(onboardingProvider.notifier).setHeight(val);
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
