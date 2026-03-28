// lib/features/auth/presentation/screens/onboarding/steps/level_step.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../../core/theme/app_theme.dart';
import '../../../providers/onboarding_provider.dart';
import '../../../widgets/onboarding_selection_card.dart';

class LevelStep extends ConsumerWidget {
  const LevelStep({super.key});

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
                child: const Icon(Icons.bolt_rounded, color: AppTheme.neon, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Training Level',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPri,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      'This helps us adjust workout intensity',
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
            title: 'Beginner',
            subtitle: 'I want to start training',
            icon: Icons.spa_outlined,
            isSelected: state.trainingLevel == 'BEGINNER',
            onTap: () => notifier.setTrainingLevel('BEGINNER'),
          ),
          const SizedBox(height: 16),
          OnboardingSelectionCard(
            title: 'Irregular training',
            subtitle: 'I train 1-2 times a week',
            icon: Icons.directions_run,
            isSelected: state.trainingLevel == 'IRREGULAR',
            onTap: () => notifier.setTrainingLevel('IRREGULAR'),
          ),
          const SizedBox(height: 16),
          OnboardingSelectionCard(
            title: 'Medium',
            subtitle: 'I train 3-4 times a week',
            icon: Icons.flash_on,
            isSelected: state.trainingLevel == 'MEDIUM',
            onTap: () => notifier.setTrainingLevel('MEDIUM'),
          ),
          const SizedBox(height: 16),
          OnboardingSelectionCard(
            title: 'Advanced',
            subtitle: 'I train more than 5 times a week',
            icon: Icons.local_fire_department,
            isSelected: state.trainingLevel == 'ADVANCED',
            onTap: () => notifier.setTrainingLevel('ADVANCED'),
          ),
        ],
      ),
    );
  }
}
