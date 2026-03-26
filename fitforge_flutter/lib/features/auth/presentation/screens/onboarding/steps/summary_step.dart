// lib/features/auth/presentation/screens/onboarding/steps/summary_step.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../../core/theme/app_theme.dart';
import '../../../providers/onboarding_provider.dart';

class SummaryStep extends ConsumerWidget {
  const SummaryStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(onboardingProvider);
    final suggestion = state.workoutPlanSuggestion;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '📋 Review your profile',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: AppTheme.textPri,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Review your information and get your personalized plan',
            style: TextStyle(fontSize: 14, color: AppTheme.textSec),
          ),
          const SizedBox(height: 24),

          // User Data Summary
          _buildSectionTitle('Your Profile'),
          const SizedBox(height: 12),
          _buildSummaryCard([
            _buildSummaryRow('Goal', _getGoalLabel(state.mainGoal), Icons.flag),
            _buildSummaryRow(
              'Level',
              _getLevelLabel(state.trainingLevel),
              Icons.speed,
            ),
            _buildSummaryRow(
              'Gender',
              _getGenderLabel(state.gender),
              Icons.person,
            ),
            _buildSummaryRow(
              'Height',
              '${state.heightCm?.toStringAsFixed(0)} cm',
              Icons.height,
            ),
            _buildSummaryRow(
              'Weight',
              '${state.weightKg?.toStringAsFixed(1)} kg',
              Icons.monitor_weight,
            ),
            _buildSummaryRow(
              'Goal Weight',
              '${state.goalWeightKg?.toStringAsFixed(1)} kg',
              Icons.flag_circle,
            ),
            if (state.dateOfBirth != null)
              _buildSummaryRow(
                'Age',
                '${_calculateAge(state.dateOfBirth!)} years',
                Icons.cake,
              ),
            _buildSummaryRow(
              'Activities',
              state.activities.isEmpty
                  ? 'None selected'
                  : state.activities.map(_getActivityLabel).join(', '),
              Icons.sports,
            ),
          ]),

          const SizedBox(height: 24),

          // BMI Display
          if (state.heightCm != null && state.weightKg != null) ...[
            _buildSectionTitle('Your BMI'),
            const SizedBox(height: 12),
            _buildBMICard(state.heightCm!, state.weightKg!),
            const SizedBox(height: 24),
          ],

          // Nutrition Advice (from API)
          if (suggestion?.nutritionAdvice != null) ...[
            _buildSectionTitle('Nutrition Advice'),
            const SizedBox(height: 12),
            _buildAdviceCard(suggestion!.nutritionAdvice!),
            const SizedBox(height: 24),
          ],

          // Workout Plan
          _buildSectionTitle('Your Workout Plan'),
          const SizedBox(height: 12),
          if (suggestion?.isLoading == true)
            _buildLoadingCard()
          else if (suggestion?.workoutPlan != null)
            _buildPlanCard(suggestion!.workoutPlan!)
          else
            _buildGeneratePlanCard(ref),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: AppTheme.textPri,
      ),
    );
  }

  Widget _buildSummaryCard(List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgElevated.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(children: children),
    );
  }

  Widget _buildSummaryRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.neon),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(color: AppTheme.textSec, fontSize: 14),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: AppTheme.textPri,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBMICard(double heightCm, double weightKg) {
    final heightM = heightCm / 100;
    final bmi = weightKg / (heightM * heightM);
    final bmiCategory = _getBMICategoryLabel(bmi);
    final bmiColor = _getBMIColor(bmi);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bmiColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: bmiColor, width: 2),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                bmi.toStringAsFixed(1),
                style: TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.w800,
                  color: bmiColor,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'BMI',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: bmiColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: bmiColor.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              bmiCategory,
              style: TextStyle(color: bmiColor, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 12),
          // BMI Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: SizedBox(
              height: 8,
              child: Row(
                children: [
                  Expanded(
                    flex: 185,
                    child: Container(color: Colors.blue.shade300),
                  ),
                  Expanded(
                    flex: 15,
                    child: Container(color: Colors.green.shade400),
                  ),
                  Expanded(
                    flex: 10,
                    child: Container(color: Colors.orange.shade400),
                  ),
                  Expanded(
                    flex: 10,
                    child: Container(color: Colors.red.shade400),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 4),
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Underweight',
                style: TextStyle(fontSize: 10, color: AppTheme.textSec),
              ),
              Text(
                'Normal',
                style: TextStyle(fontSize: 10, color: AppTheme.textSec),
              ),
              Text(
                'Overweight',
                style: TextStyle(fontSize: 10, color: AppTheme.textSec),
              ),
              Text(
                'Obese',
                style: TextStyle(fontSize: 10, color: AppTheme.textSec),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAdviceCard(String advice) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.green.withValues(alpha: 0.1),
            Colors.teal.withValues(alpha: 0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.restaurant, color: Colors.green, size: 20),
              SizedBox(width: 8),
              Text(
                'Nutrition',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: Colors.green,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            advice,
            style: const TextStyle(
              color: AppTheme.textPri,
              fontSize: 14,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingCard() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: AppTheme.bgElevated.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: const Center(
        child: Column(
          children: [
            CircularProgressIndicator(color: AppTheme.neon),
            SizedBox(height: 16),
            Text(
              'Generating your personalized workout plan...',
              style: TextStyle(color: AppTheme.textSec),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGeneratePlanCard(WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.bgElevated.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.neon.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          const Icon(Icons.fitness_center, size: 48, color: AppTheme.neon),
          const SizedBox(height: 16),
          const Text(
            'Get Your Personalized Plan',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPri,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Tap Continue to generate your AI-powered workout plan based on your profile.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppTheme.textSec, fontSize: 14),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () {
              ref
                  .read(onboardingProvider.notifier)
                  .generateWorkoutPlanSuggestion();
            },
            icon: const Icon(Icons.auto_awesome),
            label: const Text('Generate Plan'),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.neon,
              foregroundColor: Colors.black,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlanCard(String plan) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.neon.withValues(alpha: 0.1),
            Colors.purple.withValues(alpha: 0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.neon.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.fitness_center, color: AppTheme.neon, size: 20),
              const SizedBox(width: 8),
              const Text(
                'Workout Plan',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppTheme.neon,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'AI Generated',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: Colors.green,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            plan,
            style: const TextStyle(
              color: AppTheme.textPri,
              fontSize: 14,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  String _getGoalLabel(String? goal) {
    switch (goal) {
      case 'LOSE_WEIGHT':
        return 'Lose Weight';
      case 'KEEP_FIT':
        return 'Keep Fit';
      case 'GET_STRONGER':
        return 'Get Stronger';
      case 'GAIN_MUSCLE_MASS':
        return 'Gain Muscle';
      default:
        return 'Not set';
    }
  }

  String _getLevelLabel(String? level) {
    switch (level) {
      case 'BEGINNER':
        return 'Beginner';
      case 'IRREGULAR':
        return 'Irregular';
      case 'MEDIUM':
        return 'Medium';
      case 'ADVANCED':
        return 'Advanced';
      default:
        return 'Not set';
    }
  }

  String _getGenderLabel(String? gender) {
    switch (gender) {
      case 'MALE':
        return 'Male';
      case 'FEMALE':
        return 'Female';
      case 'NON_BINARY':
        return 'Non-binary';
      default:
        return 'Not set';
    }
  }

  String _getActivityLabel(String activity) {
    switch (activity) {
      case 'STRETCH':
        return 'Stretching';
      case 'CARDIO':
        return 'Cardio';
      case 'YOGA':
        return 'Yoga';
      case 'POWER_TRAINING':
        return 'Weight Training';
      case 'DANCING':
        return 'Dancing';
      default:
        return activity;
    }
  }

  int _calculateAge(DateTime dob) {
    int age = DateTime.now().year - dob.year;
    if (DateTime.now().month < dob.month ||
        (DateTime.now().month == dob.month && DateTime.now().day < dob.day)) {
      age--;
    }
    return age;
  }

  String _getBMICategoryLabel(double bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  Color _getBMIColor(double bmi) {
    if (bmi < 18.5) return Colors.blue;
    if (bmi < 25) return Colors.green;
    if (bmi < 30) return Colors.orange;
    return Colors.red;
  }
}
