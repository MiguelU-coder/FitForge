// lib/features/auth/presentation/screens/onboarding/steps/activities_step.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../../core/theme/app_theme.dart';
import '../../../providers/onboarding_provider.dart';
import '../../../widgets/onboarding_selection_card.dart';

class ActivitiesStep extends ConsumerWidget {
  const ActivitiesStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(onboardingProvider);
    final notifier = ref.read(onboardingProvider.notifier);

    final activities = [
      {
        'id': 'STRETCH',
        'title': 'Stretch',
        'icon': Icons.self_improvement,
        'subtitle': 'Improve flexibility',
      },
      {
        'id': 'CARDIO',
        'title': 'Cardio',
        'icon': Icons.directions_run,
        'subtitle': 'Boost heart health',
      },
      {
        'id': 'YOGA',
        'title': 'Yoga',
        'icon': Icons.spa_outlined,
        'subtitle': 'Mind and body balance',
      },
      {
        'id': 'POWER_TRAINING',
        'title': 'Power training',
        'icon': Icons.fitness_center,
        'subtitle': 'Lift heavy weights',
      },
      {
        'id': 'DANCING',
        'title': 'Dancing',
        'icon': Icons.music_note,
        'subtitle': 'Fun cardio movement',
      },
    ];

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
                child: const Icon(Icons.directions_run_rounded, color: AppTheme.neon, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Favorite Activities',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPri,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      'We use these to personalize your plan',
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
          Expanded(
            child: ListView.separated(
              itemCount: activities.length,
              separatorBuilder: (_, __) => const SizedBox(height: 16),
              itemBuilder: (context, index) {
                final activity = activities[index];
                final id = activity['id']! as String;
                return OnboardingSelectionCard(
                  title: activity['title']! as String,
                  subtitle: activity['subtitle']! as String,
                  icon: activity['icon'] as IconData,
                  isSelected: state.activities.contains(id),
                  onTap: () => notifier.toggleActivity(id),
                );
              },
            ),
          ),

          // Show workout plan suggestion if available
          if (state.workoutPlanSuggestion != null &&
              state.workoutPlanSuggestion!.workoutPlan != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.neon.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.neon.withValues(alpha: 0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.auto_awesome, color: AppTheme.neon, size: 18),
                      SizedBox(width: 10),
                      Text(
                        'AI PREVIEW',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.neon,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    state.workoutPlanSuggestion!.workoutPlan!.length > 150
                        ? '${state.workoutPlanSuggestion!.workoutPlan!.substring(0, 150)}...'
                        : state.workoutPlanSuggestion!.workoutPlan!,
                    style: TextStyle(
                      fontSize: 13,
                      color: AppTheme.textSec.withValues(alpha: 0.9),
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ],

          if (state.workoutPlanSuggestion != null &&
              state.workoutPlanSuggestion!.nutritionAdvice != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.green.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(
                        Icons.restaurant_menu_rounded,
                        color: Colors.green,
                        size: 18,
                      ),
                      SizedBox(width: 10),
                      Text(
                        'NUTRITION ADVICE',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: Colors.green,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    state.workoutPlanSuggestion!.nutritionAdvice!.length > 150
                        ? '${state.workoutPlanSuggestion!.nutritionAdvice!.substring(0, 150)}...'
                        : state.workoutPlanSuggestion!.nutritionAdvice!,
                    style: TextStyle(
                      fontSize: 13,
                      color: AppTheme.textSec.withValues(alpha: 0.9),
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Show loading state
          if (state.isLoading) ...[
            const SizedBox(height: 16),
            Center(
              child: Column(
                children: [
                  const CircularProgressIndicator(color: AppTheme.neon),
                  const SizedBox(height: 12),
                  Text(
                    'Generating your personalized plan...',
                    style: TextStyle(color: AppTheme.textSec.withValues(alpha: 0.7), fontSize: 13),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
