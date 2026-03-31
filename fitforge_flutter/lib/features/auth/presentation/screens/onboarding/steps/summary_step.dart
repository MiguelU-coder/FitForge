// lib/features/auth/presentation/screens/onboarding/steps/summary_step.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../../../core/theme/app_theme.dart';
import '../../../providers/onboarding_provider.dart';

class SummaryStep extends ConsumerWidget {
  const SummaryStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(onboardingProvider);
    final suggestion = state.workoutPlanSuggestion;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header ─────────────────────────────────────────────────────────
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.neon.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.person_outline_rounded,
                  color: AppTheme.neon,
                  size: 26,
                ),
              ),
              const SizedBox(width: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Profile Summary',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textPri,
                      letterSpacing: -0.5,
                    ),
                  ),
                  Text(
                    'Review your info before generating your plan',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSec.withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 28),

          // ── Profile Card ───────────────────────────────────────────────────
          _buildSectionLabel('Your Profile'),
          const SizedBox(height: 10),
          _buildProfileCard(state),

          // ── BMI Card ───────────────────────────────────────────────────────
          if (state.heightCm != null && state.weightKg != null) ...[
            const SizedBox(height: 20),
            _buildSectionLabel('Body Mass Index'),
            const SizedBox(height: 10),
            _buildBMICard(state.heightCm!, state.weightKg!),
          ],

          // ── Nutrition Advice ───────────────────────────────────────────────
          if (suggestion?.nutritionAdvice != null) ...[
            const SizedBox(height: 20),
            _buildSectionLabel('Nutrition Advice'),
            const SizedBox(height: 10),
            _buildAdviceCard(suggestion!.nutritionAdvice!),
          ],

          // ── Workout Plan ───────────────────────────────────────────────────
          const SizedBox(height: 20),
          _buildSectionLabel('Your Workout Plan'),
          const SizedBox(height: 10),
          if (suggestion?.isLoading == true)
            _buildLoadingCard()
          else if (suggestion?.workoutPlan != null)
            _buildPlanCard(
              context,
              suggestion!.workoutPlan!,
              routineId: suggestion.routineId,
              routineName: suggestion.routineName,
            )
          else
            _buildGeneratePlanCard(ref),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  // ── Section label ────────────────────────────────────────────────────────

  Widget _buildSectionLabel(String label) {
    return Row(
      children: [
        Container(
          width: 3,
          height: 18,
          decoration: BoxDecoration(
            color: AppTheme.neon,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: AppTheme.textSec,
            letterSpacing: 1.2,
          ),
        ),
      ],
    );
  }

  // ── Profile Card ─────────────────────────────────────────────────────────

  Widget _buildProfileCard(dynamic state) {
    final rows = [
      _ProfileItem('Goal', _getGoalLabel(state.mainGoal), Icons.flag_outlined),
      _ProfileItem('Level', _getLevelLabel(state.trainingLevel), Icons.speed_outlined),
      _ProfileItem('Gender', _getGenderLabel(state.gender), Icons.person_outline),
      _ProfileItem('Height', '${state.heightCm?.toStringAsFixed(0)} cm', Icons.height),
      _ProfileItem('Weight', '${state.weightKg?.toStringAsFixed(1)} kg', Icons.monitor_weight_outlined),
      _ProfileItem('Goal Weight', '${state.goalWeightKg?.toStringAsFixed(1)} kg', Icons.flag_circle_outlined),
      if (state.dateOfBirth != null)
        _ProfileItem('Age', '${_calculateAge(state.dateOfBirth!)} years', Icons.cake_outlined),
      _ProfileItem(
        'Activities',
        state.activities.isEmpty ? 'None selected' : state.activities.map(_getActivityLabel).join(', '),
        Icons.sports_outlined,
      ),
    ];

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border.withValues(alpha: 0.6)),
      ),
      child: Column(
        children: [
          for (int i = 0; i < rows.length; i++) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
              child: Row(
                children: [
                  Icon(rows[i].icon, size: 18, color: AppTheme.neon.withValues(alpha: 0.8)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      rows[i].label,
                      style: TextStyle(
                        color: AppTheme.textSec.withValues(alpha: 0.9),
                        fontSize: 14,
                      ),
                    ),
                  ),
                  Text(
                    rows[i].value,
                    style: const TextStyle(
                      color: AppTheme.textPri,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            if (i < rows.length - 1)
              Divider(
                height: 1,
                thickness: 0.5,
                color: AppTheme.border.withValues(alpha: 0.4),
                indent: 16,
                endIndent: 16,
              ),
          ],
        ],
      ),
    );
  }

  // ── BMI Card ─────────────────────────────────────────────────────────────

  Widget _buildBMICard(double heightCm, double weightKg) {
    final heightM = heightCm / 100;
    final bmi = weightKg / (heightM * heightM);
    final category = _getBMICategoryLabel(bmi);
    final color = _getBMIColor(bmi);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                bmi.toStringAsFixed(1),
                style: TextStyle(
                  fontSize: 52,
                  fontWeight: FontWeight.w900,
                  color: color,
                  letterSpacing: -2,
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 8, left: 4),
                child: Text(
                  'BMI',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: color.withValues(alpha: 0.7),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              category,
              style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 14),
            ),
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: SizedBox(
              height: 6,
              child: Row(
                children: [
                  Expanded(flex: 185, child: Container(color: Colors.blue.shade400)),
                  Expanded(flex: 15, child: Container(color: Colors.green.shade500)),
                  Expanded(flex: 10, child: Container(color: Colors.orange.shade500)),
                  Expanded(flex: 10, child: Container(color: Colors.red.shade500)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 6),
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Underweight', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
              Text('Normal', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
              Text('Overweight', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
              Text('Obese', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
            ],
          ),
        ],
      ),
    );
  }

  // ── Nutrition Card ───────────────────────────────────────────────────────

  Widget _buildAdviceCard(String advice) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.green.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.restaurant_outlined, color: Colors.green, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              advice,
              style: const TextStyle(color: AppTheme.textPri, fontSize: 13, height: 1.5),
            ),
          ),
        ],
      ),
    );
  }

  // ── Loading Card ─────────────────────────────────────────────────────────

  Widget _buildLoadingCard() {
    return Container(
      padding: const EdgeInsets.all(36),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border.withValues(alpha: 0.6)),
      ),
      child: Column(
        children: [
          SizedBox(
            width: 44,
            height: 44,
            child: CircularProgressIndicator(
              color: AppTheme.neon,
              strokeWidth: 3,
              backgroundColor: AppTheme.neon.withValues(alpha: 0.1),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Generating your plan...',
            style: TextStyle(
              color: AppTheme.textPri,
              fontWeight: FontWeight.w600,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'AI is designing your personalized routine',
            style: TextStyle(color: AppTheme.textSec, fontSize: 13),
          ),
        ],
      ),
    );
  }

  // ── Generate Plan Card ───────────────────────────────────────────────────

  Widget _buildGeneratePlanCard(WidgetRef ref) {
    final state = ref.watch(onboardingProvider);

    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.neon.withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
            color: AppTheme.neon.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.neon.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.auto_awesome, size: 32, color: AppTheme.neon),
          ),
          const SizedBox(height: 16),
          const Text(
            'Get Your AI Workout Plan',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppTheme.textPri,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Powered by LLM + real exercise data.\nPersonalized to your goal and fitness level.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppTheme.textSec.withValues(alpha: 0.8),
              fontSize: 13,
              height: 1.5,
            ),
          ),
          if (state.error != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppTheme.error.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.error.withValues(alpha: 0.25)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: AppTheme.error, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      state.error!,
                      style: const TextStyle(color: AppTheme.error, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: state.isLoading
                ? null
                : () => ref.read(onboardingProvider.notifier).generateAndSaveRoutine(),
            icon: state.isLoading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.auto_awesome, size: 18),
            label: Text(
              state.isLoading ? 'Generating...' : 'Generate My Plan',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.neon,
              foregroundColor: Colors.white,
              disabledBackgroundColor: AppTheme.neon.withValues(alpha: 0.4),
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 28),
            ),
          ),
        ],
      ),
    );
  }

  // ── Plan Card ────────────────────────────────────────────────────────────

  Widget _buildPlanCard(
    BuildContext context,
    String plan, {
    String? routineId,
    String? routineName,
  }) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.neon.withValues(alpha: 0.35), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: AppTheme.neon.withValues(alpha: 0.07),
            blurRadius: 20,
            spreadRadius: 0,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(9),
                  decoration: BoxDecoration(
                    color: AppTheme.neon.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.fitness_center, color: AppTheme.neon, size: 18),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    routineName ?? 'Your Workout Plan',
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textPri,
                      fontSize: 16,
                      letterSpacing: -0.3,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.neon,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'AI',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, thickness: 0.5, color: AppTheme.border.withValues(alpha: 0.5)),
          // Plan body
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              plan,
              style: TextStyle(
                color: AppTheme.textPri.withValues(alpha: 0.88),
                fontSize: 13,
                height: 1.65,
              ),
            ),
          ),
          // Action buttons
          if (routineId != null) ...[
            Divider(height: 1, thickness: 0.5, color: AppTheme.border.withValues(alpha: 0.4)),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => context.go('/workouts'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.textSec,
                        side: BorderSide(color: AppTheme.border.withValues(alpha: 0.8)),
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('View Routine', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton(
                      onPressed: () => context.go('/workouts/active?routine=$routineId'),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppTheme.neon,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Start Training', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  String _getGoalLabel(String? goal) => switch (goal) {
        'LOSE_WEIGHT' => 'Lose Weight',
        'KEEP_FIT' => 'Keep Fit',
        'GET_STRONGER' => 'Get Stronger',
        'GAIN_MUSCLE_MASS' => 'Gain Muscle',
        _ => 'Not set',
      };

  String _getLevelLabel(String? level) => switch (level) {
        'BEGINNER' => 'Beginner',
        'IRREGULAR' => 'Irregular',
        'MEDIUM' => 'Intermediate',
        'ADVANCED' => 'Advanced',
        _ => 'Not set',
      };

  String _getGenderLabel(String? gender) => switch (gender) {
        'MALE' => 'Male',
        'FEMALE' => 'Female',
        'NON_BINARY' => 'Non-binary',
        _ => 'Not set',
      };

  String _getActivityLabel(String activity) => switch (activity) {
        'STRETCH' => 'Stretching',
        'CARDIO' => 'Cardio',
        'YOGA' => 'Yoga',
        'POWER_TRAINING' => 'Weight Training',
        'DANCING' => 'Dancing',
        _ => activity,
      };

  int _calculateAge(DateTime dob) {
    final now = DateTime.now();
    int age = now.year - dob.year;
    if (now.month < dob.month || (now.month == dob.month && now.day < dob.day)) {
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

// ── Data class for profile rows ────────────────────────────────────────────────
class _ProfileItem {
  final String label;
  final String value;
  final IconData icon;
  const _ProfileItem(this.label, this.value, this.icon);
}
