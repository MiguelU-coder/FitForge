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
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.neon.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.straighten_rounded, color: AppTheme.neon, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'How tall are you?',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPri,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      'Used to calculate BMI and ideal weight',
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
                        'CENTIMETER',
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
                        'CM',
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
