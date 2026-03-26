import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/workout_models.dart';
import '../providers/coach_provider.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class SessionSummaryDialog extends ConsumerStatefulWidget {
  final WorkoutSession session;
  const SessionSummaryDialog({super.key, required this.session});

  @override
  ConsumerState<SessionSummaryDialog> createState() =>
      _SessionSummaryDialogState();
}

class _SessionSummaryDialogState extends ConsumerState<SessionSummaryDialog> {
  int _rpe = 7;
  bool _showSummary = false;

  String _label(int r) => switch (r) {
    1 || 2 => 'Muy fácil',
    3 || 4 => 'Fácil',
    5 || 6 => 'Moderado',
    7 || 8 => 'Duro',
    9 => 'Muy difícil',
    _ => 'Esfuerzo máximo ',
  };

  Future<void> _fetchSummary() async {
    final userId = ref.read(authStateProvider).user?.id;
    if (userId == null) return;

    final exercisesData = widget.session.exerciseBlocks.map((b) {
      return {
        'exercise': b.exerciseName,
        'isPR': b.sets.any((s) => s.isPr),
        'sets': b.sets
            .map(
              (s) => {
                'weight': s.weightKg,
                'reps': s.reps,
                'rpe': s.rpe ?? 8.0,
              },
            )
            .toList(),
      };
    }).toList();

    final totalVolume = widget.session.exerciseBlocks
        .expand((b) => b.sets)
        .where((s) => s.setType == 'WORKING' && !s.isFailed)
        .fold<double>(0, (sum, s) => sum + ((s.weightKg ?? 0) * (s.reps ?? 0)));

    final durationMin = DateTime.now()
        .difference(widget.session.startedAt)
        .inMinutes;

    setState(() => _showSummary = true);

    await ref
        .read(coachProvider('SESSION').notifier)
        .fetchSessionFeedback(
          userId: userId,
          exercises: List<Map<String, dynamic>>.from(exercisesData),
          durationMin: durationMin,
          totalVolume: totalVolume,
        );
  }

  @override
  Widget build(BuildContext context) {
    final coachState = ref.watch(coachProvider('SESSION'));

    return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 24,
          ),
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.background.withValues(alpha: 0.95),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.2),
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  blurRadius: 20,
                  spreadRadius: 5,
                ),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
                    child: Column(
                      children: [
                        const Icon(
                          Icons.check_circle_outline_rounded,
                          color: AppColors.primary,
                          size: 48,
                        ).animate().scale(
                          duration: 400.ms,
                          curve: Curves.easeOutBack,
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          '¡ENTRENAMIENTO COMPLETADO!',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),

                  if (!_showSummary) ...[
                    // RPE Selection
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Column(
                        children: [
                          const Text(
                            '¿Qué tan intenso fue hoy?',
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 20),
                          Text(
                                '$_rpe / 10',
                                style: const TextStyle(
                                  fontSize: 48,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.primary,
                                  letterSpacing: -2,
                                ),
                              )
                              .animate(target: _rpe.toDouble())
                              .scale(duration: 200.ms),
                          Text(
                            _label(_rpe),
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 32),
                          SliderTheme(
                            data: SliderTheme.of(context).copyWith(
                              trackHeight: 8,
                              thumbShape: const RoundSliderThumbShape(
                                enabledThumbRadius: 12,
                              ),
                              overlayShape: const RoundSliderOverlayShape(
                                overlayRadius: 24,
                              ),
                              activeTrackColor: AppColors.primary,
                              inactiveTrackColor: AppColors.border,
                              thumbColor: AppColors.primary,
                            ),
                            child: Slider(
                              value: _rpe.toDouble(),
                              min: 1,
                              max: 10,
                              divisions: 9,
                              onChanged: (v) =>
                                  setState(() => _rpe = v.round()),
                            ),
                          ),
                          const SizedBox(height: 40),
                          ElevatedButton(
                            onPressed: _fetchSummary,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.black,
                              minimumSize: const Size.fromHeight(56),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              elevation: 0,
                            ),
                            child: const Text(
                              'VER RESUMEN IA',
                              style: TextStyle(fontWeight: FontWeight.w800),
                            ),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(context, _rpe),
                            child: const Text(
                              'Saltar resumen',
                              style: TextStyle(color: AppColors.textSecondary),
                            ),
                          ),
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ] else ...[
                    // AI Summary View
                    _AiSummaryContent(state: coachState, rpe: _rpe),
                  ],
                ],
              ),
            ),
          ),
        )
        .animate()
        .fadeIn(duration: 300.ms)
        .scale(begin: const Offset(0.9, 0.9), curve: Curves.easeOut);
  }
}

class _AiSummaryContent extends StatelessWidget {
  final CoachState state;
  final int rpe;
  const _AiSummaryContent({required this.state, required this.rpe});

  @override
  Widget build(BuildContext context) {
    if (state.isLoading) {
      return Padding(
        padding: const EdgeInsets.all(48.0),
        child: Column(
          children: [
            const CircularProgressIndicator(color: AppColors.primary),
            const SizedBox(height: 24),
            const Text(
              'Analizando tu sesión...',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontStyle: FontStyle.italic,
              ),
            ).animate(onPlay: (c) => c.repeat()).shimmer(duration: 2000.ms),
          ],
        ),
      );
    }

    final r = state.response;
    if (r == null) {
      return Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const Icon(Icons.error_outline, color: AppColors.error, size: 40),
            const SizedBox(height: 16),
            const Text(
              'No pudimos obtener el resumen.',
              style: TextStyle(color: Colors.white),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, rpe),
              child: const Text('FINALIZAR'),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.3),
              ),
            ),
            child: Text(
              r.headline,
              style: const TextStyle(
                color: AppColors.primary,
                fontSize: 15,
                fontWeight: FontWeight.w700,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
          ).animate().slideY(begin: 0.2, end: 0, duration: 400.ms).fadeIn(),

          const SizedBox(height: 24),
          _buildSection(
            'Insights',
            r.insights,
            Icons.lightbulb_outline_rounded,
            AppColors.accentCyan,
          ),
          _buildSection(
            'Recomendaciones',
            r.recommendations,
            Icons.star_border_rounded,
            AppColors.warning,
          ),

          if (r.motivation.isNotEmpty) ...[
            const SizedBox(height: 16),
            Center(
              child: Text(
                '"${r.motivation}"',
                style: TextStyle(
                  color: AppColors.textSecondary.withValues(alpha: 0.7),
                  fontStyle: FontStyle.italic,
                  fontSize: 13,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],

          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, rpe),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.black,
              minimumSize: const Size.fromHeight(56),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: const Text(
              'FINALIZAR',
              style: TextStyle(fontWeight: FontWeight.w900),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(
    String title,
    List<String> items,
    IconData icon,
    Color groupColor,
  ) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: groupColor),
            const SizedBox(width: 8),
            Text(
              title.toUpperCase(),
              style: TextStyle(
                color: groupColor,
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.1,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        ...items.map(
          (item) => Padding(
            padding: const EdgeInsets.only(bottom: 8, left: 24),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 6),
                  width: 4,
                  height: 4,
                  decoration: BoxDecoration(
                    color: groupColor,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    item,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      height: 1.4,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
      ],
    ).animate().fadeIn(delay: 200.ms).slideX(begin: 0.1, end: 0);
  }
}
