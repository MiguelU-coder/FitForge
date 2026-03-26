// lib/features/auth/presentation/screens/onboarding/steps/activities_step.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../../core/theme/app_colors.dart';
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
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.directions_run, color: AppColors.primary, size: 22),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'What activities do you enjoy?',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Padding(
            padding: EdgeInsets.only(left: 52),
            child: Text(
              'Select activities you like to personalize your plan',
              style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
            ),
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
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.auto_awesome, color: AppColors.primary, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'AI Suggestion',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    state.workoutPlanSuggestion!.workoutPlan!.length > 200
                        ? '${state.workoutPlanSuggestion!.workoutPlan!.substring(0, 200)}...'
                        : state.workoutPlanSuggestion!.workoutPlan!,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Show nutrition advice if available
          if (state.workoutPlanSuggestion != null &&
              state.workoutPlanSuggestion!.nutritionAdvice != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(
                        Icons.restaurant_menu,
                        color: Colors.green,
                        size: 20,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Nutrition Advice',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    state.workoutPlanSuggestion!.nutritionAdvice!.length > 200
                        ? '${state.workoutPlanSuggestion!.nutritionAdvice!.substring(0, 200)}...'
                        : state.workoutPlanSuggestion!.nutritionAdvice!,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Show loading state
          if (state.isLoading) ...[
            const SizedBox(height: 16),
            const Center(
              child: Column(
                children: [
                  CircularProgressIndicator(color: AppColors.primary),
                  SizedBox(height: 8),
                  Text(
                    'Generating your personalized plan...',
                    style: TextStyle(color: AppColors.textSecondary),
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
