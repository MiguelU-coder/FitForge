// lib/features/workouts/presentation/screens/workout_logger_screen.dart
//
// Strong-app style workout logger with:
//   • Inline set rows (weight / reps / RIR / check)
//   • ADD SET button per exercise
//   • Auto rest timer after set completion
//   • Real-time AI suggestion per exercise
//   • Plate calculator dialog
//   • Finish workout with RPE + summary

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/ff_widgets.dart';
import '../../data/models/workout_models.dart';
import '../providers/workouts_provider.dart';
import '../providers/coach_provider.dart';
import '../widgets/ai_suggestion_banner.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../widgets/plate_calculator_dialog.dart';
import '../widgets/rest_timer_overlay.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

class WorkoutLoggerScreen extends ConsumerStatefulWidget {
  const WorkoutLoggerScreen({super.key});

  @override
  ConsumerState<WorkoutLoggerScreen> createState() =>
      _WorkoutLoggerScreenState();
}

class _WorkoutLoggerScreenState extends ConsumerState<WorkoutLoggerScreen>
    with TickerProviderStateMixin {
  // ── Timer ─────────────────────────────────────────────────────────────────
  late Timer _sessionTimer;
  int _sessionSeconds = 0;

  // ── Rest timer overlay ────────────────────────────────────────────────────
  OverlayEntry? _restTimerOverlay;
  int _restSeconds = 150; // 2:30 default

  // ── Scroll ────────────────────────────────────────────────────────────────
  final _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    _sessionTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _sessionSeconds++);
    });
  }

  @override
  void dispose() {
    _sessionTimer.cancel();
    _scrollCtrl.dispose();
    _dismissRestTimer();
    super.dispose();
  }

  // ── Session timer display ─────────────────────────────────────────────────
  String get _timerDisplay {
    final h = _sessionSeconds ~/ 3600;
    final m = (_sessionSeconds % 3600) ~/ 60;
    final s = _sessionSeconds % 60;
    if (h > 0) {
      return '$h:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
    }
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  // ── Rest timer ────────────────────────────────────────────────────────────
  void _showRestTimer() {
    _dismissRestTimer();
    _restTimerOverlay = OverlayEntry(
      builder: (_) => RestTimerOverlay(
        initialSeconds: _restSeconds,
        onDismiss: _dismissRestTimer,
        onSetDuration: (s) => setState(() => _restSeconds = s),
      ),
    );
    Overlay.of(context).insert(_restTimerOverlay!);
  }

  void _dismissRestTimer() {
    _restTimerOverlay?.remove();
    _restTimerOverlay = null;
  }

  // ── Finish workout ────────────────────────────────────────────────────────
  Future<void> _finishWorkout() async {
    _dismissRestTimer();

    // Confirm dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Finish Workout?'),
        content: Text('Session time: $_timerDisplay'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppTheme.textSec),
            ),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Finish'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    // RPE dialog
    final rpe = await showDialog<int>(
      context: context,
      builder: (_) => const _RpeDialog(),
    );
    if (!mounted) return;

    await ref
        .read(activeSessionProvider.notifier)
        .finishSession(rpe: rpe, durationSeconds: _sessionSeconds);

    if (mounted) {
      _showWorkoutSummary();
    }
  }

  void _showWorkoutSummary() {
    // final session = ref.read(activeSessionProvider);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      isDismissible: false,
      builder: (_) => _WorkoutSummarySheet(
        sessionSeconds: _sessionSeconds,
        onDone: () {
          Navigator.pop(context);
          context.go('/home');
        },
      ),
    );
  }

  // ── Add exercise ──────────────────────────────────────────────────────────
  Future<void> _addExercise() async {
    // Navigate to exercise picker and await result
    final exerciseId = await context.push<String>('/exercises/picker');
    if (exerciseId == null || !mounted) return;
    await ref.read(activeSessionProvider.notifier).addExercise(exerciseId);

    // Scroll to bottom to show new exercise
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final sessionState = ref.watch(activeSessionProvider);
    final session = sessionState.session;

    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: Column(
        children: [
          // ── Header ────────────────────────────────────────────────────
          _WorkoutHeader(
            timerDisplay: _timerDisplay,
            sessionName: session?.name ?? 'Workout',
            onFinish: _finishWorkout,
            onCancel: () => context.pop(),
          ),

          // ── Exercise list ──────────────────────────────────────────────
          Expanded(
            child: session == null || session.exerciseBlocks.isEmpty
                ? _EmptyWorkout(onAddExercise: _addExercise)
                : ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.only(bottom: 100),
                    physics: const BouncingScrollPhysics(),
                    itemCount: session.exerciseBlocks.length,
                    itemBuilder: (ctx, i) {
                      final block = session.exerciseBlocks[i];
                      return _ExerciseBlock(
                        key: ValueKey(block.id),
                        block: block,
                        onSetCompleted: (weight, reps, rir, type) async {
                          HapticFeedback.lightImpact();
                          await ref
                              .read(activeSessionProvider.notifier)
                              .logSet(
                                blockId: block.id,
                                setNumber: block.sets.length + 1,
                                weightKg: weight,
                                reps: reps,
                                rir: rir,
                                setType: type,
                              );
                          _showRestTimer();

                            // ── Call AI Coach (Phase 3) ───────────────────
                            final userId = ref.read(authStateProvider).user?.id;
                            if (userId != null) {
                              final updatedBlock = ref
                                  .read(activeSessionProvider)
                                  .session
                                  ?.exerciseBlocks
                                  .firstWhere(
                                    (b) => b.id == block.id,
                                    orElse: () => block,
                                  );

                              final workingSets =
                                  (updatedBlock?.sets ?? block.sets)
                                      .where((s) => s.setType == 'WORKING')
                                      .toList();

                              // Estimate RPE from RIR (if not provided)
                              final estimatedRpe = (rir != null)
                                  ? (10 - rir).clamp(1, 10).toDouble()
                                  : 7.5;

                              final recentSets = workingSets.map((s) => {
                                'weight': s.weightKg ?? weight,
                                'reps':   s.reps ?? reps,
                                'rpe':    estimatedRpe,
                              }).toList();

                              // Simple volume estimate
                              final weeklyVol = recentSets.fold<double>(
                                0.0,
                                (acc, s) => acc +
                                    (s['weight'] as double) *
                                    (s['reps'] as int),
                              ) * 3; // rough 3-session/week estimate

                              // No-await: coach feedback is non-blocking
                              ref
                                  .read(coachProvider(block.id).notifier)
                                  .fetchCoachFeedback(
                                    userId:       userId,
                                    exercise:     block.exerciseName,
                                    sets:         recentSets.reversed.take(3).toList(),
                                    fatigueScore: (estimatedRpe * 10).clamp(0, 100),
                                    estimated1RM: weight * (1 + reps / 30),
                                    isPR:         false,
                                    injuryRisk:   estimatedRpe >= 9.5
                                        ? 'HIGH'
                                        : estimatedRpe >= 8.5
                                            ? 'MODERATE'
                                            : 'LOW',
                                    weeklyVolume: weeklyVol,
                                  );
                            }
                            // ─────────────────────────────────────────────
                        },
                        onDeleteSet: (setId) async {
                          await ref
                              .read(activeSessionProvider.notifier)
                              .deleteSet(blockId: block.id, setId: setId);
                        },
                        onDeleteExercise: () async {
                          await ref
                              .read(activeSessionProvider.notifier)
                              .removeExercise(blockId: block.id);
                        },
                        restSeconds: _restSeconds,
                        onChangeRestTime: (s) =>
                            setState(() => _restSeconds = s),
                      ).animate().fadeIn(
                        delay: Duration(milliseconds: 50 * i),
                        duration: const Duration(milliseconds: 300),
                      );
                    },
                  ),
          ),

          // ── Bottom bar ─────────────────────────────────────────────────
          _BottomBar(onAddExercise: _addExercise),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────

class _WorkoutHeader extends StatelessWidget {
  final String timerDisplay, sessionName;
  final VoidCallback onFinish, onCancel;

  const _WorkoutHeader({
    required this.timerDisplay,
    required this.sessionName,
    required this.onFinish,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        MediaQuery.of(context).padding.top + 12,
        16,
        12,
      ),
      decoration: const BoxDecoration(
        color: AppTheme.bgCard,
        border: Border(bottom: BorderSide(color: AppTheme.border, width: 0.5)),
      ),
      child: Row(
        children: [
          // Cancel
          GestureDetector(
            onTap: onCancel,
            child: const Icon(Icons.close, color: AppTheme.textSec, size: 22),
          ),
          const SizedBox(width: 12),

          // Session info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  sessionName,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPri,
                  ),
                ),
                Row(
                  children: [
                    const Icon(
                      Icons.timer_outlined,
                      size: 13,
                      color: AppTheme.neon,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      timerDisplay,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppTheme.neon,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Finish button
          GestureDetector(
            onTap: onFinish,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.neon,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'Finish',
                style: TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercise Block — the core of the Strong-style UI
// ─────────────────────────────────────────────────────────────────────────────

class _ExerciseBlock extends ConsumerStatefulWidget {
  final ExerciseBlock block;
  final void Function(double weight, int reps, int? rir, String type)
  onSetCompleted;
  final void Function(String setId) onDeleteSet;
  final VoidCallback onDeleteExercise;
  final int restSeconds;
  final void Function(int) onChangeRestTime;

  const _ExerciseBlock({
    super.key,
    required this.block,
    required this.onSetCompleted,
    required this.onDeleteSet,
    required this.onDeleteExercise,
    required this.restSeconds,
    required this.onChangeRestTime,
  });

  @override
  ConsumerState<_ExerciseBlock> createState() => _ExerciseBlockState();
}

class _ExerciseBlockState extends ConsumerState<_ExerciseBlock> {
  // Input controllers for the "add set" row
  final _weightCtrl = TextEditingController();
  final _repsCtrl = TextEditingController();
  final _rirCtrl = TextEditingController(text: '2');
  String _setType = 'WORKING';

  // When weight field is tapped, pre-fill with last set weight
  @override
  void initState() {
    super.initState();
    _prefillFromLastSet();
  }

  @override
  void didUpdateWidget(_ExerciseBlock old) {
    super.didUpdateWidget(old);
    if (widget.block.sets.length != old.block.sets.length) {
      _prefillFromLastSet();
    }
  }

  void _prefillFromLastSet() {
    final sets = widget.block.sets;
    if (sets.isEmpty) return;

    final last = sets.last;
    if (last.weightKg != null) {
      // Pre-fill weight (keep last weight)
      _weightCtrl.text = last.weightKg!.toStringAsFixed(
        last.weightKg! == last.weightKg!.roundToDouble() ? 0 : 1,
      );
    }
    // Clear reps for new set
    _repsCtrl.clear();
  }

  @override
  void dispose() {
    _weightCtrl.dispose();
    _repsCtrl.dispose();
    _rirCtrl.dispose();
    super.dispose();
  }

  void _submitSet() {
    final weight = double.tryParse(_weightCtrl.text.replaceAll(',', '.'));
    final reps = int.tryParse(_repsCtrl.text);

    if (weight == null || reps == null || reps <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Enter weight and reps'),
          backgroundColor: AppTheme.error,
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    final rir = int.tryParse(_rirCtrl.text);
    widget.onSetCompleted(weight, reps, rir, _setType);
    _repsCtrl.clear();
  }

  void _openPlateCalculator() {
    final weight = double.tryParse(_weightCtrl.text.replaceAll(',', '.')) ?? 0;
    showDialog(
      context: context,
      builder: (_) => PlateCalculatorDialog(targetWeight: weight),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      decoration: AppTheme.glassCard(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Exercise title bar ──────────────────────────────────────
          _ExerciseTitleBar(
            name: widget.block.exerciseName,
            muscles: widget.block.primaryMuscles,
            onDelete: widget.onDeleteExercise,
            restSeconds: widget.restSeconds,
            onChangeRest: widget.onChangeRestTime,
            onPlateCalc: _openPlateCalculator,
          ),

          // ── AI Coach Banner (Phase 3) ────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
            child: CoachBanner(coachState: ref.watch(coachProvider(widget.block.id))),
          ),

          // ── Column headers ──────────────────────────────────────────
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: _SetTableHeader(),
          ),

          const Divider(height: 1),

          // ── Logged sets ─────────────────────────────────────────────
          ...widget.block.sets.asMap().entries.map((entry) {
            final i = entry.key;
            final set = entry.value;
            return _LoggedSetRow(
              set: set,
              index: i,
              onDelete: () => widget.onDeleteSet(set.id),
            ).animate().fadeIn(duration: 200.ms).slideX(begin: -0.05);
          }),

          // ── Input row ───────────────────────────────────────────────
          _AddSetRow(
            weightCtrl: _weightCtrl,
            repsCtrl: _repsCtrl,
            rirCtrl: _rirCtrl,
            setType: _setType,
            onTypeChanged: (t) => setState(() => _setType = t),
            onSubmit: _submitSet,
            setNumber: widget.block.sets.length + 1,
          ),

          const SizedBox(height: 4),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercise title bar
// ─────────────────────────────────────────────────────────────────────────────

class _ExerciseTitleBar extends StatelessWidget {
  final String name;
  final List<String> muscles;
  final VoidCallback onDelete, onPlateCalc;
  final int restSeconds;
  final void Function(int) onChangeRest;

  const _ExerciseTitleBar({
    required this.name,
    required this.muscles,
    required this.onDelete,
    required this.onPlateCalc,
    required this.restSeconds,
    required this.onChangeRest,
  });

  @override
  Widget build(BuildContext context) {
    final m = restSeconds ~/ 60;
    final s = restSeconds % 60;
    final restLabel = '$m:${s.toString().padLeft(2, '0')}';

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 8, 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPri,
                  ),
                ),
                if (muscles.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 5,
                    children: muscles.map((m) => MuscleTag(muscle: m)).toList(),
                  ),
                ],
              ],
            ),
          ),

          // Rest timer chip
          GestureDetector(
            onTap: () => _showRestPicker(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.bgElevated,
                borderRadius: BorderRadius.circular(7),
                border: Border.all(color: AppTheme.border),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.timer_outlined,
                    size: 12,
                    color: AppTheme.textSec,
                  ),
                  const SizedBox(width: 3),
                  Text(
                    restLabel,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppTheme.textSec,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 4),

          // Plate calc
          IconButton(
            icon: const Icon(
              Icons.calculate_outlined,
              size: 18,
              color: AppTheme.textSec,
            ),
            onPressed: onPlateCalc,
            tooltip: 'Plate calculator',
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
          ),

          // Delete exercise
          IconButton(
            icon: const Icon(
              Icons.delete_outline,
              size: 18,
              color: AppTheme.textMuted,
            ),
            onPressed: onDelete,
            tooltip: 'Remove exercise',
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
          ),
        ],
      ),
    );
  }

  void _showRestPicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (_) =>
          _RestTimePicker(current: restSeconds, onChanged: onChangeRest),
    );
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Set table header
// ─────────────────────────────────────────────────────────────────────────────

class _SetTableHeader extends StatelessWidget {
  const _SetTableHeader();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        SizedBox(width: 32, child: Text('SET', style: _h)),
        SizedBox(width: 12),
        Expanded(child: Text('PESO (KG)', style: _h)),
        SizedBox(
          width: 60,
          child: Text('REPS', style: _h, textAlign: TextAlign.center),
        ),
        SizedBox(width: 8),
        SizedBox(
          width: 80,
          child: Text('RIR', style: _h, textAlign: TextAlign.center),
        ),
        SizedBox(width: 32),
      ],
    );
  }

  static const _h = TextStyle(
    fontSize: 10,
    fontWeight: FontWeight.w700,
    color: AppTheme.textMuted,
    letterSpacing: 0.8,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Logged set row — shows past sets
// ─────────────────────────────────────────────────────────────────────────────

class _LoggedSetRow extends StatelessWidget {
  final SetLog set;
  final int index;
  final VoidCallback onDelete;

  const _LoggedSetRow({
    required this.set,
    required this.index,
    required this.onDelete,
  });

  Color _typeColor() => switch (set.setType) {
    'WARMUP' => AppTheme.warning,
    'DROP' => AppTheme.cyan,
    _ => AppTheme.neon,
  };

  // Color semántico del RIR: 0=rojo (al fallo), 1=naranja, 2=amarillo, 3+=verde
  Color _rirColor(int rir) => switch (rir) {
    0 => AppTheme.error,
    1 => const Color(0xFFFF6B35),
    2 => AppTheme.warning,
    3 => const Color(0xFF84CC16),
    _ => AppTheme.neon,
  };

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(set.id),
      direction: DismissDirection.endToStart,
      background: Container(
        color: AppTheme.error.withValues(alpha: 0.15),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 16),
        child: const Icon(Icons.delete, color: AppTheme.error, size: 20),
      ),
      onDismissed: (_) => onDelete(),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: set.isPr
              ? AppTheme.gold.withValues(alpha: 0.04)
              : Colors.transparent,
          border: const Border(
            bottom: BorderSide(color: AppTheme.border, width: 0.3),
          ),
        ),
        child: Row(
          children: [
            // Set number badge
            SizedBox(
              width: 32,
              child: Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: _typeColor().withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Center(
                  child: Text(
                    set.setType == 'WARMUP' ? 'W' : '${index + 1}',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: _typeColor(),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Weight
            Expanded(
              child: Row(
                children: [
                  Text(
                    set.weightKg != null
                        ? '${set.weightKg!.toStringAsFixed(set.weightKg! == set.weightKg!.roundToDouble() ? 0 : 1)} kg'
                        : '--',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPri,
                    ),
                  ),
                  if (set.isPr) ...[
                    const SizedBox(width: 5),
                    const Text('🏆', style: TextStyle(fontSize: 13)),
                  ],
                ],
              ),
            ),

            // Reps
            SizedBox(
              width: 60,
              child: Text(
                set.reps != null ? '${set.reps}' : '--',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPri,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(width: 8),

            // RIR badge
            SizedBox(
              width: 80,
              child: set.rir != null
                  ? Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: _rirColor(set.rir!).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: _rirColor(set.rir!).withValues(alpha: 0.4),
                          ),
                        ),
                        child: Text(
                          'RIR ${set.rir}',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: _rirColor(set.rir!),
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    )
                  : const Center(
                      child: Text(
                        '--',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppTheme.textMuted,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
            ),

            // Checkmark
            SizedBox(
              width: 32,
              child: Icon(Icons.check_circle, color: _typeColor(), size: 18),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Set Row — the primary input row, like Strong's "Add Set" button
// ─────────────────────────────────────────────────────────────────────────────

class _AddSetRow extends StatefulWidget {
  final TextEditingController weightCtrl, repsCtrl, rirCtrl;
  final String setType;
  final void Function(String) onTypeChanged;
  final VoidCallback onSubmit;
  final int setNumber;

  const _AddSetRow({
    required this.weightCtrl,
    required this.repsCtrl,
    required this.rirCtrl,
    required this.setType,
    required this.onTypeChanged,
    required this.onSubmit,
    required this.setNumber,
  });

  @override
  State<_AddSetRow> createState() => _AddSetRowState();
}

class _AddSetRowState extends State<_AddSetRow> {
  bool _showTypeSelector = false;
  int _selectedRir = 2; // valor por defecto

  // Colores semánticos: 0=al fallo, 1=muy cerca, 2=normal, 3=cómodo, 4=fácil
  Color _rirColor(int rir) => switch (rir) {
    0 => AppTheme.error,
    1 => const Color(0xFFFF6B35),
    2 => AppTheme.warning,
    3 => const Color(0xFF84CC16),
    _ => AppTheme.neon,
  };

  String _rirLabel(int rir) => switch (rir) {
    0 => 'Fallo',
    1 => '1 rep',
    2 => '2 reps',
    3 => '3 reps',
    _ => '4+ reps',
  };

  @override
  void initState() {
    super.initState();
    final parsed = int.tryParse(widget.rirCtrl.text);
    if (parsed != null && parsed >= 0 && parsed <= 4) {
      _selectedRir = parsed;
    }
  }

  void _selectRir(int rir) {
    setState(() => _selectedRir = rir);
    widget.rirCtrl.text = '$rir';
  }

  @override
  Widget build(BuildContext context) {
    Color typeColor = switch (widget.setType) {
      'WARMUP' => AppTheme.warning,
      'DROP' => AppTheme.cyan,
      _ => AppTheme.neon,
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Divider antes del input row
        const Divider(height: 1),

        // Type selector (expandable)
        if (_showTypeSelector)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Row(
              children: ['WORKING', 'WARMUP', 'DROP'].map((t) {
                final c = switch (t) {
                  'WARMUP' => AppTheme.warning,
                  'DROP' => AppTheme.cyan,
                  _ => AppTheme.neon,
                };
                return GestureDetector(
                  onTap: () {
                    widget.onTypeChanged(t);
                    setState(() => _showTypeSelector = false);
                  },
                  child: Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: widget.setType == t
                          ? c.withValues(alpha: 0.15)
                          : AppTheme.bgElevated,
                      borderRadius: BorderRadius.circular(7),
                      border: Border.all(
                        color: widget.setType == t
                            ? c.withValues(alpha: 0.5)
                            : AppTheme.border,
                      ),
                    ),
                    child: Text(
                      t.toLowerCase(),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: widget.setType == t ? c : AppTheme.textMuted,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

        // ── Fila principal de inputs ───────────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
          child: Row(
            children: [
              // Set number / type badge
              GestureDetector(
                onTap: () =>
                    setState(() => _showTypeSelector = !_showTypeSelector),
                child: Container(
                  width: 32,
                  height: 40,
                  decoration: BoxDecoration(
                    color: typeColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: typeColor.withValues(alpha: 0.5)),
                  ),
                  child: Center(
                    child: Text(
                      widget.setType == 'WARMUP' ? 'W' : '${widget.setNumber}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: typeColor,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),

              // Weight input
              Expanded(
                child: _SetInputField(
                  controller: widget.weightCtrl,
                  hint: 'kg',
                  label: 'Peso',
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Reps input
              SizedBox(
                width: 68,
                child: _SetInputField(
                  controller: widget.repsCtrl,
                  hint: '0',
                  label: 'Reps',
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(width: 8),

              // Check button
              GestureDetector(
                onTap: widget.onSubmit,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppTheme.neon,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.neon.withValues(alpha: 0.35),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    color: Colors.black,
                    size: 22,
                  ),
                ),
              ),
            ],
          ),
        ),

        // ── Selector de RIR ────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.speed_outlined,
                    size: 12,
                    color: AppTheme.textMuted,
                  ),
                  const SizedBox(width: 5),
                  const Text(
                    'RIR — Repeticiones en Reserva',
                    style: TextStyle(
                      fontSize: 10,
                      color: AppTheme.textMuted,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.4,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    _rirLabel(_selectedRir),
                    style: TextStyle(
                      fontSize: 10,
                      color: _rirColor(_selectedRir),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 7),
              Row(
                children: List.generate(5, (i) {
                  final isSelected = _selectedRir == i;
                  final color = _rirColor(i);
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => _selectRir(i),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        curve: Curves.easeOut,
                        margin: const EdgeInsets.only(right: 4),
                        height: 36,
                        decoration: BoxDecoration(
                          color: isSelected
                              ? color.withValues(alpha: 0.18)
                              : AppTheme.bgElevated,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isSelected
                                ? color.withValues(alpha: 0.7)
                                : AppTheme.border,
                            width: isSelected ? 1.5 : 1.0,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              '$i',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: isSelected ? color : AppTheme.textSec,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared input field for sets
// ─────────────────────────────────────────────────────────────────────────────

class _SetInputField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final String? label;
  final TextInputType? keyboardType;
  final TextAlign textAlign;

  const _SetInputField({
    required this.controller,
    required this.hint,
    this.label,
    this.keyboardType,
    this.textAlign = TextAlign.left,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: textAlign == TextAlign.center
          ? CrossAxisAlignment.center
          : CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: const TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w700,
              color: AppTheme.textMuted,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 3),
        ],
        Container(
          height: 40,
          decoration: BoxDecoration(
            color: AppTheme.bgElevated,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppTheme.border),
          ),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            textAlign: textAlign,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPri,
            ),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(
                fontSize: 14,
                color: AppTheme.textMuted,
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 10,
                vertical: 10,
              ),
              isDense: true,
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bottom bar — Add Exercise
// ─────────────────────────────────────────────────────────────────────────────

class _BottomBar extends StatelessWidget {
  final VoidCallback onAddExercise;
  const _BottomBar({required this.onAddExercise});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        12,
        16,
        MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: const BoxDecoration(
        color: AppTheme.bgCard,
        border: Border(top: BorderSide(color: AppTheme.border, width: 0.5)),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 48,
        child: OutlinedButton.icon(
          onPressed: onAddExercise,
          icon: const Icon(Icons.add, size: 18),
          label: const Text('ADD EXERCISE'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppTheme.neon,
            side: const BorderSide(color: AppTheme.neon, width: 1.5),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            textStyle: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

class _EmptyWorkout extends StatelessWidget {
  final VoidCallback onAddExercise;
  const _EmptyWorkout({required this.onAddExercise});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppTheme.bgCard,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppTheme.neon.withValues(alpha: 0.3)),
            ),
            child: const Icon(
              Icons.fitness_center,
              size: 36,
              color: AppTheme.neon,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Start your workout',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPri,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Tap the button below to add exercises',
            style: TextStyle(color: AppTheme.textSec, fontSize: 14),
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: 200,
            child: FilledButton.icon(
              onPressed: onAddExercise,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add Exercise'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Rest time picker
// ─────────────────────────────────────────────────────────────────────────────

class _RestTimePicker extends StatefulWidget {
  final int current;
  final void Function(int) onChanged;
  const _RestTimePicker({required this.current, required this.onChanged});

  @override
  State<_RestTimePicker> createState() => _RestTimePickerState();
}

class _RestTimePickerState extends State<_RestTimePicker> {
  late int _selected;

  static const _presets = [60, 90, 120, 150, 180, 240, 300];

  @override
  void initState() {
    super.initState();
    _selected = widget.current;
  }

  String _fmt(int s) {
    final m = s ~/ 60;
    final sec = s % 60;
    return '${m}m${sec > 0 ? ' ${sec}s' : ''}';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Rest Timer',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _presets
                .map(
                  (s) => GestureDetector(
                    onTap: () {
                      setState(() => _selected = s);
                      widget.onChanged(s);
                      Navigator.pop(context);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: _selected == s
                            ? AppTheme.neon.withValues(alpha: 0.15)
                            : AppTheme.bgElevated,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: _selected == s
                              ? AppTheme.neon.withValues(alpha: 0.6)
                              : AppTheme.border,
                        ),
                      ),
                      child: Text(
                        _fmt(s),
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: _selected == s
                              ? AppTheme.neon
                              : AppTheme.textSec,
                        ),
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RPE dialog
// ─────────────────────────────────────────────────────────────────────────────

class _RpeDialog extends StatefulWidget {
  const _RpeDialog();
  @override
  State<_RpeDialog> createState() => _RpeDialogState();
}

class _RpeDialogState extends State<_RpeDialog> {
  double _rpe = 7;

  String _label(double r) => switch (r.round()) {
    1 || 2 => 'Very easy 😴',
    3 || 4 => 'Easy 😊',
    5 || 6 => 'Moderate 💪',
    7 || 8 => 'Hard 😤',
    9 => 'Very hard 🥵',
    _ => 'Absolute max 🔥',
  };

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Session RPE'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '${_rpe.round()} / 10',
            style: const TextStyle(
              fontSize: 40,
              fontWeight: FontWeight.w800,
              color: AppTheme.neon,
              letterSpacing: -2,
            ),
          ),
          Text(
            _label(_rpe),
            style: const TextStyle(color: AppTheme.textSec, fontSize: 14),
          ),
          const SizedBox(height: 20),
          Slider(
            value: _rpe,
            min: 1,
            max: 10,
            divisions: 9,
            activeColor: AppTheme.neon,
            inactiveColor: AppTheme.border,
            onChanged: (v) => setState(() => _rpe = v),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, null),
          child: const Text('Skip', style: TextStyle(color: AppTheme.textSec)),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(context, _rpe.round()),
          child: const Text('Finish Workout'),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Workout summary bottom sheet
// ─────────────────────────────────────────────────────────────────────────────

class _WorkoutSummarySheet extends ConsumerWidget {
  final int sessionSeconds;
  final VoidCallback onDone;

  const _WorkoutSummarySheet({
    required this.sessionSeconds,
    required this.onDone,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final m = sessionSeconds ~/ 60;
    final s = sessionSeconds % 60;
    final durationStr = '${m}m ${s}s';

    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 24),
            decoration: BoxDecoration(
              color: AppTheme.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Trophy icon
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: AppTheme.neon.withValues(alpha: 0.1),
              shape: BoxShape.circle,
              border: Border.all(
                color: AppTheme.neon.withValues(alpha: 0.4),
                width: 1.5,
              ),
            ),
            child: const Center(
              child: Text('🏆', style: TextStyle(fontSize: 32)),
            ),
          ),
          const SizedBox(height: 16),

          const Text(
            'Workout Complete!',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: AppTheme.textPri,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Great job — session saved',
            style: TextStyle(color: AppTheme.textSec, fontSize: 14),
          ),
          const SizedBox(height: 28),

          // Stats row
          GlassCard(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                StatBadge(value: durationStr, label: 'Duration'),
                Container(width: 0.5, height: 36, color: AppTheme.border),
                const StatBadge(value: '—', label: 'Total Sets'),
                Container(width: 0.5, height: 36, color: AppTheme.border),
                const StatBadge(value: '—', label: 'Volume'),
              ],
            ),
          ),
          const SizedBox(height: 28),

          NeonButton(label: 'Done', onPressed: onDone),
        ],
      ),
    );
  }
}
