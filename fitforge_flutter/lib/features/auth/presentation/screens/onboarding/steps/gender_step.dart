// lib/features/auth/presentation/screens/onboarding/steps/gender_step.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../../core/theme/app_theme.dart';
import '../../../providers/onboarding_provider.dart';
import '../../../widgets/onboarding_selection_card.dart';

class GenderStep extends ConsumerWidget {
  const GenderStep({super.key});

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
                child: const Icon(Icons.person_outline_rounded, color: AppTheme.neon, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'What is your gender?',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPri,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      'This affects calorie and health metrics',
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
            title: 'Women',
            subtitle: 'Female physiology calculation',
            icon: Icons.female,
            isSelected: state.gender == 'FEMALE',
            onTap: () => notifier.setGender('FEMALE'),
          ),
          const SizedBox(height: 16),
          OnboardingSelectionCard(
            title: 'Men',
            subtitle: 'Male physiology calculation',
            icon: Icons.male,
            isSelected: state.gender == 'MALE',
            onTap: () => notifier.setGender('MALE'),
          ),
          const SizedBox(height: 16),
          OnboardingSelectionCard(
            title: 'Gender neutral',
            subtitle: 'Average calculation model',
            icon: Icons.person,
            isSelected: state.gender == 'NON_BINARY',
            onTap: () => notifier.setGender('NON_BINARY'),
          ),
        ],
      ),
    );
  }
}
