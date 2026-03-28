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
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.neon.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.cake_rounded, color: AppTheme.neon, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Your Birthday',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPri,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      'Used for age-specific training metrics',
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
            child: Container(
              padding: EdgeInsets.all(state.dateOfBirth != null ? 36 : 48),
              decoration: BoxDecoration(
                color: state.dateOfBirth != null
                    ? AppTheme.neon.withValues(alpha: 0.08)
                    : AppTheme.bgCard,
                shape: BoxShape.circle,
                border: Border.all(
                  color: state.dateOfBirth != null
                      ? AppTheme.neon.withValues(alpha: 0.6)
                      : AppTheme.border.withValues(alpha: 0.8),
                  width: 2,
                ),
                boxShadow: state.dateOfBirth != null
                    ? [
                        BoxShadow(
                          color: AppTheme.neon.withValues(alpha: 0.1),
                          blurRadius: 24,
                          spreadRadius: 0,
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
                            fontSize: 36,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.neon,
                            letterSpacing: -1,
                          ),
                        ),
                        Text(
                          state.dateOfBirth!.year.toString(),
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPri.withValues(alpha: 0.9),
                            letterSpacing: 1,
                          ),
                        ),
                      ],
                    )
                  : Icon(
                      Icons.calendar_month_rounded,
                      size: 56,
                      color: AppTheme.textSec.withValues(alpha: 0.4),
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
