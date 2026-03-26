// lib/features/auth/presentation/screens/onboarding/onboarding_flow_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fitforge/core/theme/app_theme.dart';
import 'package:fitforge/core/router/app_router.dart';
import '../../providers/onboarding_provider.dart';
import '../../providers/auth_provider.dart';
import 'steps/goal_step.dart';
import 'steps/level_step.dart';
import 'steps/gender_step.dart';
import 'steps/height_step.dart';
import 'steps/weight_step.dart';
import 'steps/goal_weight_step.dart';
import 'steps/dob_step.dart';
import 'steps/activities_step.dart';
import 'steps/summary_step.dart';

class OnboardingFlowScreen extends ConsumerWidget {
  const OnboardingFlowScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(onboardingProvider);
    final notifier = ref.read(onboardingProvider.notifier);

    const totalSteps = 9;

    final stepName = _getStepName(state.currentStep);
    final progress = state.currentStep / totalSteps;

    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: Column(
          children: [
            // Custom App Bar with Circular Progress
            _buildAppBar(
              context,
              state,
              notifier,
              totalSteps,
              stepName,
              progress,
            ),

            // Main Content with transitions
            Expanded(child: _buildAnimatedContent(state)),

            // Continue Button
            _buildContinueButton(context, ref, state, notifier, totalSteps),
          ],
        ),
      ),
    );
  }

  String _getStepName(int step) {
    switch (step) {
      case 1:
        return 'Goal';
      case 2:
        return 'Level';
      case 3:
        return 'Gender';
      case 4:
        return 'Height';
      case 5:
        return 'Weight';
      case 6:
        return 'Goal Weight';
      case 7:
        return 'Birthday';
      case 8:
        return 'Activities';
      case 9:
        return 'Summary';
      default:
        return 'Step $step';
    }
  }

  Widget _buildAppBar(
    BuildContext context,
    OnboardingState state,
    OnboardingNotifier notifier,
    int totalSteps,
    String stepName,
    double progress,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          // Back button
          if (state.currentStep > 1)
            IconButton(
              icon: const Icon(
                Icons.arrow_back_ios_new,
                color: AppTheme.textPri,
                size: 20,
              ),
              onPressed: () => notifier.prevStep(),
            )
          else
            const SizedBox(width: 48),

          // Circular Progress Indicator
          Expanded(
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 60,
                    height: 60,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        CircularProgressIndicator(
                          value: progress,
                          strokeWidth: 4,
                          backgroundColor: AppTheme.border.withValues(
                            alpha: 0.3,
                          ),
                          valueColor: const AlwaysStoppedAnimation<Color>(
                            AppTheme.neon,
                          ),
                        ),
                        Center(
                          child: Text(
                            '${(progress * 100).toInt()}%',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.textPri,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$stepName - ${state.currentStep}/$totalSteps',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textSec,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Skip button
          TextButton(
            onPressed: () => context.go(AppRoutes.home),
            child: const Text(
              'Skip',
              style: TextStyle(color: AppTheme.textSec),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnimatedContent(OnboardingState state) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 400),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      transitionBuilder: (child, animation) {
        final slideAnimation =
            Tween<Offset>(
              begin: const Offset(1.0, 0.0),
              end: Offset.zero,
            ).animate(
              CurvedAnimation(parent: animation, curve: Curves.easeOutCubic),
            );

        return SlideTransition(
          position: slideAnimation,
          child: FadeTransition(opacity: animation, child: child),
        );
      },
      child: _buildStep(state.currentStep, key: ValueKey(state.currentStep)),
    );
  }

  Widget _buildStep(int step, {Key? key}) {
    return switch (step) {
      1 => GoalStep(key: key),
      2 => LevelStep(key: key),
      3 => GenderStep(key: key),
      4 => HeightStep(key: key),
      5 => WeightStep(key: key),
      6 => GoalWeightStep(key: key),
      7 => DobStep(key: key),
      8 => ActivitiesStep(key: key),
      9 => SummaryStep(key: key),
      _ => SizedBox(key: key),
    };
  }

  Widget _buildContinueButton(
    BuildContext context,
    WidgetRef ref,
    OnboardingState state,
    OnboardingNotifier notifier,
    int totalSteps,
  ) {
    final isLastStep = state.currentStep == totalSteps;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: FilledButton(
        onPressed:
            _canContinue(state) &&
                !state.isLoading &&
                !ref.watch(authStateProvider).isLoading
            ? () => _handleContinue(context, ref, state, notifier)
            : null,
        style: FilledButton.styleFrom(
          minimumSize: const Size(double.infinity, 56),
          backgroundColor: AppTheme.neon,
          foregroundColor: Colors.black,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child: state.isLoading || ref.watch(authStateProvider).isLoading
            ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.black,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    isLastStep ? 'Start Training' : 'Continue',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  if (!isLastStep) ...[
                    const SizedBox(width: 8),
                    const Icon(Icons.arrow_forward, size: 20),
                  ],
                ],
              ),
      ),
    );
  }

  bool _canContinue(OnboardingState state) {
    return switch (state.currentStep) {
      1 => state.mainGoal != null,
      2 => state.trainingLevel != null,
      3 => state.gender != null,
      4 => state.heightCm != null && state.heightCm! > 0,
      5 => state.weightKg != null && state.weightKg! > 0,
      6 => state.goalWeightKg != null && state.goalWeightKg! > 0,
      7 => true, // Date is optional
      8 => true, // Activities now optional
      9 => true, // Summary - always can continue
      _ => false,
    };
  }

  Future<void> _handleContinue(
    BuildContext context,
    WidgetRef ref,
    OnboardingState state,
    OnboardingNotifier notifier,
  ) async {
    // Validate current step before proceeding
    final validationError = notifier.validateCurrentStep();
    if (validationError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(validationError),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Step 2: After selecting Level (goal was selected at step 1), get nutrition advice from API
    if (state.currentStep == 2) {
      notifier.getNutritionAdvice();
    }

    // We no longer auto-generate the workout plan when clicking continue on Step 9
    // as it traps the submit button in a loading state. The user must click the dedicated
    // "Generate Plan" button to receive it, or it will generate in the background later.

    if (state.currentStep < 9) {
      notifier.nextStep();
    } else {
      try {
        // Save workout plan suggestion to user profile if available
        await ref.read(authStateProvider.notifier).updateProfile({
          'gender': state.gender,
          'mainGoal': state.mainGoal,
          'heightCm': state.heightCm,
          if (state.dateOfBirth != null)
            'dateOfBirth': state.dateOfBirth!.toUtc().toIso8601String(),
          'trainingLevel': state.trainingLevel,
          'activities': state.activities,
          'goalWeightKg': state.goalWeightKg,
          'has_completed_onboarding': true,
          if (state.workoutPlanSuggestion != null)
            'workoutPlanSuggestion': state.workoutPlanSuggestion!.toJson(),
        });

        // Navigate directly using GoRouter - bypass redirect logic temporarily
        if (!context.mounted) return;
        GoRouter.of(context).go(AppRoutes.home);
      } catch (e) {
        if (!context.mounted) return;
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error saving profile: $e')));
      }
    }
  }
}
