// lib/features/auth/presentation/screens/onboarding/steps/dob_step.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../../core/theme/app_theme.dart';
import '../../../providers/onboarding_provider.dart';

class DobStep extends ConsumerWidget {
  const DobStep({super.key});

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
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.neon.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.cake_outlined, color: AppTheme.neon, size: 22),
              ),
              const SizedBox(width: 12),
              const Text(
                'When were you born?',
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
              'Used to calculate your age and metabolic rate',
              style: TextStyle(fontSize: 14, color: AppTheme.textSec),
            ),
          ),
          const SizedBox(height: 48),
          Center(
            child: Container(
              padding: EdgeInsets.all(state.dateOfBirth != null ? 32 : 40),
              decoration: BoxDecoration(
                color: state.dateOfBirth != null
                    ? AppTheme.neon.withValues(alpha: 0.1)
                    : AppTheme.bgElevated.withValues(alpha: 0.5),
                shape: BoxShape.circle,
                border: Border.all(
                  color: state.dateOfBirth != null
                      ? AppTheme.neon
                      : AppTheme.border,
                  width: 2,
                ),
                boxShadow: state.dateOfBirth != null
                    ? [
                        BoxShadow(
                          color: AppTheme.neon.withValues(alpha: 0.2),
                          blurRadius: 20,
                          spreadRadius: 2,
                        ),
                      ]
                    : null,
              ),
              child: state.dateOfBirth != null
                  ? Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${state.dateOfBirth!.day.toString().padLeft(2, '0')}/${state.dateOfBirth!.month.toString().padLeft(2, '0')}',
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.neon,
                          ),
                        ),
                        Text(
                          state.dateOfBirth!.year.toString(),
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPri,
                          ),
                        ),
                      ],
                    )
                  : const Icon(
                      Icons.calendar_today_rounded,
                      size: 64,
                      color: AppTheme.neon,
                    ),
            ),
          ),
          const SizedBox(height: 48),
          Center(
            child: OutlinedButton(
              onPressed: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate:
                      state.dateOfBirth ??
                      DateTime.now().subtract(const Duration(days: 365 * 25)),
                  firstDate: DateTime(1900),
                  lastDate: DateTime.now(),
                  builder: (context, child) {
                    return Theme(
                      data: Theme.of(context).copyWith(
                        colorScheme: const ColorScheme.dark(
                          primary: AppTheme.neon,
                          onPrimary: Colors.black,
                          surface: AppTheme.bgElevated,
                          onSurface: AppTheme.textPri,
                        ),
                      ),
                      child: child!,
                    );
                  },
                );
                if (picked != null) {
                  notifier.setDateOfBirth(picked);
                }
              },
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppTheme.neon),
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                state.dateOfBirth != null ? 'Change Date' : 'Select Date',
                style: const TextStyle(
                  color: AppTheme.neon,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
