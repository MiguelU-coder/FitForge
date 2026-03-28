// lib/features/auth/presentation/screens/onboarding/steps/goal_step.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../../core/theme/app_theme.dart';
import '../../../providers/onboarding_provider.dart';
import '../../../widgets/onboarding_selection_card.dart';

class GoalStep extends ConsumerWidget {
  const GoalStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(onboardingProvider);
    final notifier = ref.read(onboardingProvider.notifier);

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
                child: const Icon(Icons.flag_rounded, color: AppTheme.neon, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'What is your goal?',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPri,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      'This helps us personalize your journey',
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
          const SizedBox(height: 32),
          OnboardingSelectionCard(
            title: 'Lose weight',
            subtitle: 'Burn fat and get leaner',
            icon: Icons.trending_down,
            isSelected: state.mainGoal == 'LOSE_WEIGHT',
            onTap: () => notifier.setMainGoal('LOSE_WEIGHT'),
          ),
          const SizedBox(height: 16),
          OnboardingSelectionCard(
            title: 'Keep fit',
            subtitle: 'Maintain your current fitness level',
            icon: Icons.eco_outlined,
            isSelected: state.mainGoal == 'KEEP_FIT',
            onTap: () => notifier.setMainGoal('KEEP_FIT'),
          ),
          const SizedBox(height: 16),
          OnboardingSelectionCard(
            title: 'Get stronger',
            subtitle: 'Increase your overall strength',
            icon: Icons.fitness_center,
            isSelected: state.mainGoal == 'GET_STRONGER',
            onTap: () => notifier.setMainGoal('GET_STRONGER'),
          ),
          const SizedBox(height: 16),
          OnboardingSelectionCard(
            title: 'Gain muscle mass',
            subtitle: 'Build muscle and size',
            icon: Icons.biotech_outlined,
            isSelected: state.mainGoal == 'GAIN_MUSCLE_MASS',
            onTap: () => notifier.setMainGoal('GAIN_MUSCLE_MASS'),
          ),
        ],
      ),
    );
  }
}
