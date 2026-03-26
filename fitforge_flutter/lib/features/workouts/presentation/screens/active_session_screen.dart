// lib/features/workouts/presentation/screens/active_session_screen.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/ff_widgets.dart';
import '../../data/models/workout_models.dart';
import '../providers/workouts_provider.dart';
import '../providers/coach_provider.dart';
import '../widgets/ai_suggestion_banner.dart';
import '../widgets/session_summary_dialog.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../exercises/data/models/exercise_model.dart';
import '../../../exercises/data/sources/exercises_remote_source.dart';

class ActiveSessionScreen extends ConsumerStatefulWidget {
  const ActiveSessionScreen({super.key});
  @override
  ConsumerState<ActiveSessionScreen> createState() =>
      _ActiveSessionScreenState();
}

class _ActiveSessionScreenState extends ConsumerState<ActiveSessionScreen> {
  late Timer _timer;
  int _elapsed = 0;
  bool _showRestTimer = false;
  int _expandedIndex = -1; // acordeón
  bool _isFinishing = false;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      final s = ref.read(activeSessionProvider).session;
      if (s != null) {
        setState(
          () => _elapsed = DateTime.now().difference(s.startedAt).inSeconds,
        );
      }
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  String get _timerStr {
    final h = _elapsed ~/ 3600, m = (_elapsed % 3600) ~/ 60, s = _elapsed % 60;
    if (h > 0) {
      return '$h:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
    }
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  Future<void> _addExercise() async {
    final ex = await Navigator.push<Exercise>(
      context,
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => const _ExercisePickerPage(),
      ),
    );
    if (ex != null) {
      await ref.read(activeSessionProvider.notifier).addExercise(ex.id);
      // Auto-expand el nuevo ejercicio
      final blocks =
          ref.read(activeSessionProvider).session?.exerciseBlocks ?? [];
      setState(() => _expandedIndex = blocks.length - 1);
    }
  }

  Future<void> _finish() async {
    if (_isFinishing) return;
    final sessionState = ref.read(activeSessionProvider);
    final session = sessionState.session;

    if (session == null) {
      setState(() => _isFinishing = false);
      return;
    }

    setState(() => _isFinishing = true);

    try {
      final rpe = await showDialog<int>(
        context: context,
        barrierDismissible: true,
        builder: (_) => SessionSummaryDialog(session: session),
      );

      if (rpe == null) {
        setState(() => _isFinishing = false);
        return;
      }

      final actualRpe = rpe == -1 ? null : rpe;

      if (!context.mounted) return;
      await ref
          .read(activeSessionProvider.notifier)
          .finishSession(rpe: actualRpe);

      if (!context.mounted) return;
      final error = ref.read(activeSessionProvider).error;
      if (error != null) {
        if (!mounted) return;
        setState(() => _isFinishing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $error'),
            backgroundColor: AppColors.error,
          ),
        );
      } else {
        if (!mounted) return;
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isFinishing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final sessionState = ref.watch(activeSessionProvider);
    final session = sessionState.session;

    if (session == null) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              // ── Top bar ────────────────────────────────────────────────
              SliverAppBar(
                pinned: true,
                backgroundColor: AppColors.background,
                expandedHeight: 88,
                collapsedHeight: 56,
                leading: IconButton(
                  icon: const Icon(
                    Icons.close,
                    size: 20,
                    color: AppColors.error,
                  ),
                  onPressed: () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Cancel workout?'),
                        content: const Text('All progress will be lost.'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(ctx, false),
                            child: const Text('No'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(ctx, true),
                            child: const Text(
                              'Yes, cancel',
                              style: TextStyle(color: AppColors.error),
                            ),
                          ),
                        ],
                      ),
                    );
                    if (confirm == true) {
                      await ref
                          .read(activeSessionProvider.notifier)
                          .cancelSession();
                      if (!context.mounted) return;
                      context.pop();
                    }
                  },
                ),
                flexibleSpace: FlexibleSpaceBar(
                  titlePadding: const EdgeInsets.only(
                    left: 56,
                    bottom: 8,
                    right: 80,
                  ),
                  title: _SessionStatsBar(
                    session: session,
                    timerStr: _timerStr,
                  ),
                ),
                actions: [
                  GestureDetector(
                    onTap: sessionState.isLoading ? null : _finish,
                    child: Container(
                      margin: const EdgeInsets.only(right: 16),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 7,
                      ),
                      decoration: BoxDecoration(
                        color: sessionState.isLoading
                            ? AppColors.textMuted
                            : AppColors.primary,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: sessionState.isLoading
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.black,
                              ),
                            )
                          : const Text(
                              'Finish',
                              style: TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                              ),
                            ),
                    ),
                  ),
                ],
              ),

              if (_showRestTimer)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    child: RestTimerWidget(
                      initialSeconds: 150,
                      onFinished: () => setState(() => _showRestTimer = false),
                    ),
                  ),
                ),

              // ── Exercises accordion ────────────────────────────────────
              if (session.exerciseBlocks.isEmpty)
                const SliverFillRemaining(
                  child: EmptyState(
                    icon: Icons.add_box_outlined,
                    title: 'No exercises yet',
                    subtitle: 'Add your first exercise below',
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
                  sliver: SliverReorderableList(
                    itemCount: session.exerciseBlocks.length,
                    onReorder: (oldIndex, newIndex) {
                      ref
                          .read(activeSessionProvider.notifier)
                          .reorderExercises(oldIndex, newIndex);
                    },
                    itemBuilder: (ctx2, i) {
                      final block = session.exerciseBlocks[i];
                      return Material(
                        key: ValueKey(block.id),
                        color: Colors.transparent,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          child: _ExerciseAccordion(
                            block: block,
                            index: i,
                            isExpanded: _expandedIndex == i,
                            onToggle: () => setState(
                              () =>
                                  _expandedIndex = _expandedIndex == i ? -1 : i,
                            ),
                            onLogSet:
                                (
                                  setId,
                                  setNumber,
                                  weight,
                                  reps,
                                  rir,
                                  type,
                                  failed, {
                                  wL,
                                  wR,
                                  rL,
                                  rR,
                                }) async {
                                  await ref
                                      .read(activeSessionProvider.notifier)
                                      .logSet(
                                        blockId: block.id,
                                        setId: setId,
                                        setNumber: setNumber,
                                        weightKg: weight,
                                        weightKgLeft: wL,
                                        weightKgRight: wR,
                                        reps: reps,
                                        repsLeft: rL,
                                        repsRight: rR,
                                        rir: rir,
                                        isFailed: failed,
                                        setType: type,
                                      );
                                  setState(() => _showRestTimer = true);
                                },
                            onUnlogSet: (setId) async {
                              await ref
                                  .read(activeSessionProvider.notifier)
                                  .unlogSet(blockId: block.id, setId: setId);
                            },
                            onDeleteSet: (setId) async {
                              await ref
                                  .read(activeSessionProvider.notifier)
                                  .deleteSet(blockId: block.id, setId: setId);
                            },
                          ),
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),

          // ── FAB row ────────────────────────────────────────────────────
          Positioned(
            bottom: 24,
            left: 16,
            right: 16,
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: _addExercise,
                    child: Container(
                      height: 52,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add, color: Colors.black, size: 22),
                          SizedBox(width: 6),
                          Text(
                            'Add Exercise',
                            style: TextStyle(
                              color: Colors.black,
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: () => setState(() => _showRestTimer = !_showRestTimer),
                  child: Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: _showRestTimer
                          ? AppColors.primary.withValues(alpha: 0.2)
                          : AppColors.card,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: _showRestTimer
                            ? AppColors.primary
                            : AppColors.border,
                      ),
                    ),
                    child: Icon(
                      Icons.timer_outlined,
                      color: _showRestTimer
                          ? AppColors.primary
                          : AppColors.textSecondary,
                      size: 22,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Live session stats bar ────────────────────────────────────────────────────
class _SessionStatsBar extends StatelessWidget {
  final WorkoutSession session;
  final String timerStr;

  const _SessionStatsBar({required this.session, required this.timerStr});

  @override
  Widget build(BuildContext context) {
    // Compute live stats from all logged sets
    final allSets = session.exerciseBlocks
        .expand((b) => b.sets)
        .where((s) => s.setType == 'WORKING' && !s.isFailed)
        .toList();

    final totalSets = allSets.length;
    final totalVolume = allSets.fold<double>(
      0,
      (sum, s) => sum + ((s.weightKg ?? 0) * (s.reps ?? 0)),
    );
    final volStr = totalVolume >= 1000
        ? '${(totalVolume / 1000).toStringAsFixed(1)}k'
        : totalVolume.toStringAsFixed(0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          session.name,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 2),
        Row(
          children: [
            // Timer
            Text(
              timerStr,
              style:
                  Theme.of(context).textTheme.displaySmall?.copyWith(
                    fontSize: 13,
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ) ??
                  const TextStyle(
                    fontSize: 13,
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(width: 8),
            // Sets badge
            _StatPill(
              icon: Icons.fitness_center_rounded,
              label: '$totalSets sets',
              color: AppColors.accentCyan,
            ),
            const SizedBox(width: 6),
            // Volume badge
            _StatPill(
              icon: Icons.show_chart_rounded,
              label: '${volStr}kg',
              color: AppColors.warning,
            ),
          ],
        ),
      ],
    );
  }
}

class _StatPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _StatPill({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, size: 9, color: color),
      const SizedBox(width: 3),
      Text(
        label,
        style:
            Theme.of(context).textTheme.displaySmall?.copyWith(
              fontSize: 10,
              color: color,
              fontWeight: FontWeight.w700,
            ) ??
            TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w700),
      ),
    ],
  );
}

// ── Exercise Accordion ────────────────────────────────────────────────────────
class _ExerciseAccordion extends ConsumerStatefulWidget {
  final ExerciseBlock block;
  final int index;
  final bool isExpanded;
  final VoidCallback onToggle;
  final void Function(
    String? setId,
    int setNumber,
    double? weight,
    int? reps,
    int? rir,
    String type,
    bool failed, {
    double? wL,
    double? wR,
    int? rL,
    int? rR,
  })
  onLogSet;
  final void Function(String setId) onUnlogSet;
  final void Function(String setId) onDeleteSet;

  const _ExerciseAccordion({
    required this.block,
    required this.index,
    required this.isExpanded,
    required this.onToggle,
    required this.onLogSet,
    required this.onUnlogSet,
    required this.onDeleteSet,
  });

  @override
  ConsumerState<_ExerciseAccordion> createState() => _ExerciseAccordionState();
}

class _ExerciseAccordionState extends ConsumerState<_ExerciseAccordion>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _expand;

  // Track sets in a table-like state
  final List<_SetRowData> _rows = [];

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _expand = CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut);
    if (widget.isExpanded) _ctrl.forward();

    _initRows();
  }

  void _initRows() {
    _rows.clear();
    // 1. Add existing logged sets
    for (final s in widget.block.sets) {
      _rows.add(_SetRowData.fromSet(s));
    }
    // 2. Add an empty "draft" set if none exists or to continue
    if (_rows.isEmpty || _rows.last.isLoged) {
      _addEmptyRow();
    }
  }

  void _addEmptyRow() {
    setState(() {
      String? lastW, lastWL, lastWR;
      String? lastR, lastRL, lastRR;

      if (_rows.isNotEmpty) {
        final last = _rows.last;
        lastW = last.weightCtrl.text;
        lastWL = last.weightLCtrl.text;
        lastWR = last.weightRCtrl.text;
        lastR = last.repsCtrl.text;
        lastRL = last.repsLCtrl.text;
        lastRR = last.repsRCtrl.text;
      }

      _rows.add(
        _SetRowData(
          setNumber: _rows.length + 1,
          weight: lastW,
          weightL: lastWL,
          weightR: lastWR,
          reps: lastR,
          repsL: lastRL,
          repsR: lastRR,
        ),
      );
    });
  }

  @override
  void didUpdateWidget(_ExerciseAccordion old) {
    super.didUpdateWidget(old);
    widget.isExpanded ? _ctrl.forward() : _ctrl.reverse();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    for (final row in _rows) {
      row.dispose();
    }
    super.dispose();
  }

  // No longer using _fetchAiSuggestion as it is handled in _logRow

  void _logRow(_SetRowData row) {
    double? weight, wL, wR;
    int? reps, rL, rR;

    if (widget.block.isUnilateral) {
      wL = double.tryParse(row.weightLCtrl.text.replaceAll(',', '.'));
      wR = double.tryParse(row.weightRCtrl.text.replaceAll(',', '.'));
      rL = int.tryParse(row.repsLCtrl.text);
      rR = int.tryParse(row.repsRCtrl.text);

      if (wL == null || wR == null || rL == null || rR == null) {
        _showError('Enter weight and reps for both sides');
        return;
      }
    } else {
      weight = double.tryParse(row.weightCtrl.text.replaceAll(',', '.'));
      reps = int.tryParse(row.repsCtrl.text);

      if (weight == null || reps == null) {
        _showError('Enter weight and reps');
        return;
      }
    }

    HapticFeedback.lightImpact();
    final rir = int.tryParse(row.rirCtrl.text);

    widget.onLogSet(
      row.setId,
      row.setNumber,
      weight,
      reps,
      rir,
      row.setType,
      row.setType == 'FAILURE',
      wL: wL,
      wR: wR,
      rL: rL,
      rR: rR,
    );

    // ── Phase 3 AI Coach Trigger ──
    final userId = ref.read(authStateProvider).user?.id;
    if (userId != null) {
      final w = weight ?? (wL ?? 0);
      final r = reps ?? (rL ?? 0);
      
      // Get most recent 3 sets including this one
      final currentSets = widget.block.sets.reversed.take(2).map((s) => {
        'weight': s.weightKg ?? s.weightKgLeft ?? 0,
        'reps': s.reps ?? s.repsLeft ?? 0,
        'rpe': 8.0,
      }).toList();
      currentSets.insert(0, {'weight': w, 'reps': r, 'rpe': 8.0});

      ref.read(coachProvider(widget.block.id).notifier).fetchCoachFeedback(
        userId: userId,
        exercise: widget.block.exerciseName,
        sets: currentSets,
        fatigueScore: 60.0,
        estimated1RM: w * (1 + r / 30),
        isPR: false,
        injuryRisk: 'LOW',
      );
    }

    setState(() {
      row.isLoged = true;
    });
    HapticFeedback.lightImpact();
  }

  void _unlogRow(_SetRowData row) {
    if (row.setId != null) {
      widget.onUnlogSet(row.setId!);
      setState(() {
        row.isLoged = false;
      });
      HapticFeedback.lightImpact();
    }
  }

  void _deleteRow(_SetRowData row) {
    if (row.setId != null) {
      widget.onDeleteSet(row.setId!);
    }
    setState(() {
      _rows.remove(row);
    });
    HapticFeedback.heavyImpact();
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final workSets = widget.block.sets
        .where((s) => s.setType == 'WORKING')
        .length;
    final warmupSets = widget.block.sets
        .where((s) => s.setType == 'WARMUP')
        .length;

    return Container(
      decoration: widget.isExpanded
          ? AppColors.neonCard()
          : AppColors.glassCard(),
      child: Column(
        children: [
          // ── Accordion header ──────────────────────────────────────────
          GestureDetector(
            onTap: widget.onToggle,
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  // Exercise Thumbnail / Badge
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.elevated,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: widget.isExpanded
                                ? AppColors.primary.withValues(alpha: 0.3)
                                : AppColors.border,
                          ),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child:
                            widget.block.imageUrl != null &&
                                widget.block.imageUrl!.isNotEmpty
                            ? CachedNetworkImage(
                                imageUrl: widget.block.imageUrl!,
                                fit: BoxFit.cover,
                                placeholder: (ctx, url) => Container(
                                  color: AppColors.elevated,
                                  child: const Center(
                                    child: SizedBox(
                                      width: 14,
                                      height: 14,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 1.5,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                  ),
                                ),
                                errorWidget: (ctx, url, error) => const Icon(
                                  Icons.fitness_center,
                                  size: 18,
                                  color: AppColors.textMuted,
                                ),
                              )
                            : const Icon(
                                Icons.fitness_center,
                                size: 18,
                                color: AppColors.textMuted,
                              ),
                      ),
                      Positioned(
                        bottom: -2,
                        right: -2,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 5,
                            vertical: 1,
                          ),
                          decoration: BoxDecoration(
                            color: widget.isExpanded
                                ? AppColors.primary
                                : AppColors.card,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: widget.isExpanded
                                  ? AppColors.primary
                                  : AppColors.border,
                              width: 1,
                            ),
                          ),
                          child: Text(
                            '${widget.index + 1}',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              color: widget.isExpanded
                                  ? Colors.black
                                  : AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.block.exerciseName,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            if (workSets > 0)
                              _HeaderBadge(
                                count: workSets,
                                label: 'working',
                                color: AppColors.primary,
                              ),
                            if (workSets > 0 && warmupSets > 0)
                              const SizedBox(width: 6),
                            if (warmupSets > 0)
                              _HeaderBadge(
                                count: warmupSets,
                                label: 'warmup',
                                color: AppColors.warning,
                              ),
                            if (workSets == 0 && warmupSets == 0)
                              const Text(
                                'No sets yet',
                                style: TextStyle(
                                  color: AppColors.textMuted,
                                  fontSize: 12,
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Drag handle for reordering
                  ReorderableDragStartListener(
                    index: widget.index,
                    child: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 4),
                      child: Icon(
                        Icons.drag_indicator,
                        color: AppColors.textMuted,
                        size: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  AnimatedRotation(
                    turns: widget.isExpanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 300),
                    child: const Icon(
                      Icons.keyboard_arrow_down,
                      color: AppColors.textSecondary,
                      size: 20,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Expanded body ─────────────────────────────────────────────
          SizeTransition(
            sizeFactor: _expand,
            child: Column(
              children: [
                Container(height: 0.5, color: AppColors.border),
                Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Sets Table (Strong Style)
                      _StrongTableHeader(
                        isUnilateral: widget.block.isUnilateral,
                      ),
                      const SizedBox(height: 2),
                      ListView.builder(
                        padding: EdgeInsets.zero,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _rows.length,
                        itemBuilder: (context, i) {
                          final row = _rows[i];
                          final performances =
                              ref
                                  .read(activeSessionProvider)
                                  .lastPerformances[widget.block.exerciseId]
                                  ?.sets ??
                              [];

                          return _StrongSetRow(
                            row: row,
                            isUnilateral: widget.block.isUnilateral,
                            previous: i < performances.length
                                ? performances[i]
                                : null,
                            onLog: () => _logRow(row),
                            onUnlog: () => _unlogRow(row),
                            onDelete: () => _deleteRow(row),
                            onTypeChange: (type) =>
                                setState(() => row.setType = type),
                          );
                        },
                      ),

                      const SizedBox(height: 4),
                      Center(
                        child: TextButton.icon(
                          onPressed: _addEmptyRow,
                          icon: const Icon(
                            Icons.add,
                            size: 16,
                            color: AppColors.primary,
                          ),
                          label: const Text('Add Set'),
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.primary,
                            textStyle: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),

                      // AI Coach Banner (Phase 3 upgrade)
                      CoachBanner(coachState: ref.watch(coachProvider(widget.block.id))),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Exercise picker (full-screen, Strong/Lyfta style) ─────────────────────────
class _ExercisePickerPage extends ConsumerStatefulWidget {
  const _ExercisePickerPage();
  @override
  ConsumerState<_ExercisePickerPage> createState() =>
      _ExercisePickerPageState();
}

class _ExercisePickerPageState extends ConsumerState<_ExercisePickerPage> {
  final _searchCtrl = TextEditingController();
  List<Exercise> _results = [];
  bool _loading = true;
  String? _selectedMuscle;
  String? _selectedEquipment;
  Timer? _debounce;

  static const _muscles = [
    'CHEST',
    'BACK',
    'SHOULDERS',
    'BICEPS',
    'TRICEPS',
    'QUADS',
    'HAMSTRINGS',
    'GLUTES',
    'CALVES',
    'ABS',
    'OBLIQUES',
    'TRAPS',
    'LATS',
    'FOREARMS',
  ];

  static const _equipment = [
    'BARBELL',
    'DUMBBELL',
    'CABLE',
    'MACHINE',
    'BODYWEIGHT',
    'KETTLEBELL',
    'RESISTANCE_BAND',
    'SMITH_MACHINE',
  ];

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final page = await ref
          .read(exercisesRemoteSourceProvider)
          .getExercises(
            search: _searchCtrl.text,
            muscle: _selectedMuscle,
            equipment: _selectedEquipment,
            limit: 100,
            useExternal: true,
          );
      if (mounted) setState(() => _results = page.exercises);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onSearchChanged(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), _fetch);
  }

  void _onMuscleSelected(String? muscle) {
    setState(() => _selectedMuscle = muscle);
    _fetch();
  }

  void _onEquipmentSelected(String? equip) {
    setState(() => _selectedEquipment = equip);
    _fetch();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Add Exercise',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 18,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
        elevation: 0,
      ),
      body: Column(
        children: [
          // ── Search bar ──────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: TextField(
              controller: _searchCtrl,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 14,
              ),
              decoration: InputDecoration(
                hintText: 'Search exercises…',
                prefixIcon: const Icon(
                  Icons.search,
                  size: 20,
                  color: AppColors.textSecondary,
                ),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(
                          Icons.clear,
                          size: 16,
                          color: AppColors.textSecondary,
                        ),
                        onPressed: () {
                          _searchCtrl.clear();
                          _onSearchChanged('');
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                filled: true,
                fillColor: AppColors.card,
                border: const OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(12)),
                  borderSide: BorderSide(color: AppColors.border),
                ),
                enabledBorder: const OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(12)),
                  borderSide: BorderSide(color: AppColors.border),
                ),
                focusedBorder: const OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(12)),
                  borderSide: BorderSide(color: AppColors.primary, width: 1.5),
                ),
              ),
              onChanged: _onSearchChanged,
            ),
          ),

          // ── Muscle group chips ──────────────────────────────────
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _muscles.length + 1,
              separatorBuilder: (_, __) => const SizedBox(width: 6),
              itemBuilder: (ctx, i) {
                if (i == 0) {
                  return _FilterChip(
                    label: 'All',
                    selected: _selectedMuscle == null,
                    onTap: () => _onMuscleSelected(null),
                  );
                }
                final m = _muscles[i - 1];
                return _FilterChip(
                  label: MuscleTag.label(m),
                  selected: _selectedMuscle == m,
                  color: MuscleTag.color(m),
                  onTap: () =>
                      _onMuscleSelected(_selectedMuscle == m ? null : m),
                );
              },
            ),
          ),
          const SizedBox(height: 6),

          // ── Equipment chips ─────────────────────────────────────
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _equipment.length + 1,
              separatorBuilder: (_, __) => const SizedBox(width: 6),
              itemBuilder: (ctx, i) {
                if (i == 0) {
                  return _FilterChip(
                    label: 'All',
                    selected: _selectedEquipment == null,
                    icon: Icons.fitness_center,
                    onTap: () => _onEquipmentSelected(null),
                  );
                }
                final e = _equipment[i - 1];
                return _FilterChip(
                  label: MuscleTag.label(e),
                  selected: _selectedEquipment == e,
                  icon: Icons.fitness_center,
                  onTap: () =>
                      _onEquipmentSelected(_selectedEquipment == e ? null : e),
                );
              },
            ),
          ),
          const SizedBox(height: 8),

          // ── Results count ───────────────────────────────────────
          if (!_loading)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  '${_results.length} exercises',
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          const SizedBox(height: 4),

          // ── Exercise list ───────────────────────────────────────
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: AppColors.primary,
                      strokeWidth: 2,
                    ),
                  )
                : _results.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.search_off,
                          size: 48,
                          color: AppColors.textMuted,
                        ),
                        SizedBox(height: 12),
                        Text(
                          'No exercises found',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 14,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Try different filters or search terms',
                          style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 0.85,
                        ),
                    itemCount: _results.length,
                    itemBuilder: (ctx, i) {
                      final ex = _results[i];
                      return GestureDetector(
                        onTap: () => Navigator.pop(context, ex),
                        child: Stack(
                          children: [
                            Positioned.fill(
                              child: _GridExerciseCard(exercise: ex),
                            ),
                            // Optional overlay to indicate it's selectable, or simply rely on the card visuals.
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

// ── Filter chip widget ────────────────────────────────────────────────────────
class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final Color? color;
  final IconData? icon;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.selected,
    this.color,
    this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final chipColor = color ?? AppColors.primary;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? chipColor.withValues(alpha: 0.15) : AppColors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected
                ? chipColor.withValues(alpha: 0.5)
                : AppColors.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 12,
                color: selected ? chipColor : AppColors.textMuted,
              ),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: selected ? chipColor : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Grid Exercise Card (Premium Vertical Layout) ──────────────────────────────
class _GridExerciseCard extends StatelessWidget {
  final Exercise exercise;
  const _GridExerciseCard({required this.exercise});

  @override
  Widget build(BuildContext context) {
    final primaryColor = exercise.primaryMuscles.isNotEmpty
        ? MuscleTag.color(exercise.primaryMuscles.first)
        : AppColors.primary;

    final hasImage = exercise.imageUrl != null && exercise.imageUrl!.isNotEmpty;

    return Container(
      decoration: AppColors.glassCard(),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Upper Image Area
          Expanded(
            flex: 3,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Image Placeholder / Background / Cached Net Image
                Container(
                  color: Colors.white,
                  child: hasImage
                      ? CachedNetworkImage(
                          imageUrl: exercise.imageUrl!,
                          fit: BoxFit
                              .contain, // Changed to contain to fit the full illustration
                          placeholder: (ctx, url) => Shimmer.fromColors(
                            baseColor: Colors.grey[200]!,
                            highlightColor: Colors.white,
                            child: Container(color: Colors.white),
                          ),
                          errorWidget: (ctx, url, error) =>
                              _buildPlaceholder(primaryColor),
                        )
                      : _buildPlaceholder(primaryColor),
                ),
                // Colored Muscle Indicator Overlay
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          primaryColor,
                          primaryColor.withValues(alpha: 0),
                        ],
                      ),
                    ),
                  ),
                ),
                // Add Icon Overlay
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.add,
                      size: 20,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Lower Details Area
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  exercise.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  exercise.primaryMuscles.isNotEmpty
                      ? MuscleTag.label(exercise.primaryMuscles.first)
                      : 'Full Body',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: primaryColor.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder(Color primaryColor) {
    return Center(
      child: Opacity(
        opacity: 0.8,
        child: Icon(
          Icons.fitness_center,
          size: 48,
          color: primaryColor.withValues(alpha: 0.2),
        ),
      ),
    );
  }
}

class _SetRowData {
  final String? setId;
  final int setNumber;
  final TextEditingController weightCtrl;
  final TextEditingController weightLCtrl;
  final TextEditingController weightRCtrl;
  final TextEditingController repsCtrl;
  final TextEditingController repsLCtrl;
  final TextEditingController repsRCtrl;
  final TextEditingController rirCtrl;
  String setType;
  bool isLoged;

  _SetRowData({
    this.setId,
    required this.setNumber,
    String? weight,
    String? weightL,
    String? weightR,
    String? reps,
    String? repsL,
    String? repsR,
    this.setType = 'WORKING',
    this.isLoged = false,
  }) : weightCtrl = TextEditingController(text: weight),
       weightLCtrl = TextEditingController(text: weightL),
       weightRCtrl = TextEditingController(text: weightR),
       repsCtrl = TextEditingController(text: reps),
       repsLCtrl = TextEditingController(text: repsL),
       repsRCtrl = TextEditingController(text: repsR),
       rirCtrl = TextEditingController(text: '2');

  factory _SetRowData.fromSet(SetLog s) => _SetRowData(
    setId: s.id,
    setNumber: s.setNumber,
    weight: s.weightKg?.toString(),
    weightL: s.weightKgLeft?.toString(),
    weightR: s.weightKgRight?.toString(),
    reps: s.reps?.toString(),
    repsL: s.repsLeft?.toString(),
    repsR: s.repsRight?.toString(),
    setType: s.setType,
    isLoged: s.completedAt != null,
  );

  void dispose() {
    weightCtrl.dispose();
    weightLCtrl.dispose();
    weightRCtrl.dispose();
    repsCtrl.dispose();
    repsLCtrl.dispose();
    repsRCtrl.dispose();
    rirCtrl.dispose();
  }
}

class _StrongTableHeader extends StatelessWidget {
  final bool isUnilateral;
  const _StrongTableHeader({required this.isUnilateral});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Row(
        children: [
          const SizedBox(
            width: 46,
            child: Text('SET', style: _hStyle, textAlign: TextAlign.center),
          ),
          Expanded(
            flex: isUnilateral ? 4 : 2,
            child: Text(
              isUnilateral ? 'KG (L/R)' : 'KG',
              style: _hStyle,
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(width: 5),
          Expanded(
            flex: isUnilateral ? 3 : 2,
            child: Text(
              isUnilateral ? 'REPS (L/R)' : 'REPS',
              style: _hStyle,
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(width: 5),
          const SizedBox(
            width: 110,
            child: Text('RIR', style: _hStyle, textAlign: TextAlign.center),
          ),
          const SizedBox(width: 5),
          const SizedBox(width: 32),
        ],
      ),
    );
  }

  static const _hStyle = TextStyle(
    fontSize: 10,
    fontWeight: FontWeight.w700,
    color: AppColors.textSecondary,
    letterSpacing: 0.8,
  );
}

class _StrongSetRow extends StatefulWidget {
  final _SetRowData row;
  final bool isUnilateral;
  final LastPerformanceSet? previous;
  final VoidCallback onLog;
  final VoidCallback onUnlog;
  final VoidCallback onDelete;
  final Function(String) onTypeChange;

  const _StrongSetRow({
    required this.row,
    required this.isUnilateral,
    this.previous,
    required this.onLog,
    required this.onUnlog,
    required this.onDelete,
    required this.onTypeChange,
  });

  @override
  State<_StrongSetRow> createState() => _StrongSetRowState();
}

class _StrongSetRowState extends State<_StrongSetRow> {
  int _selectedRir = 2;

  @override
  void initState() {
    super.initState();
    final parsed = int.tryParse(widget.row.rirCtrl.text);
    if (parsed != null && parsed >= 0 && parsed <= 4) {
      _selectedRir = parsed;
    }
  }

  void _selectRir(int rir) {
    if (widget.row.isLoged) return;
    setState(() => _selectedRir = rir);
    widget.row.rirCtrl.text = '$rir';
  }

  Color _rirColor(int rir) => switch (rir) {
    0 => AppColors.error,
    1 => const Color(0xFFFF6B35),
    2 => AppColors.warning,
    3 => const Color(0xFF84CC16),
    _ => AppColors.primary,
  };

  Color _typeColor(String t) => switch (t) {
    'WARMUP' => AppColors.warning,
    'WORKING' => AppColors.primary,
    'FAILURE' => AppColors.error,
    'DROP' => AppColors.accentCyan,
    _ => AppColors.textSecondary,
  };

  String _typeLabel(String t, int n) => switch (t) {
    'WARMUP' => 'W',
    'FAILURE' => 'F',
    'DROP' => 'D',
    _ => '$n',
  };

  @override
  Widget build(BuildContext context) {
    final isDone = widget.row.isLoged;
    final typeC = _typeColor(widget.row.setType);

    return Dismissible(
      key: ValueKey(widget.row.setId ?? widget.row.hashCode.toString()),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => widget.onDelete(),
      background: Container(
        margin: const EdgeInsets.only(bottom: 2),
        decoration: BoxDecoration(
          color: AppColors.error.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(8),
        ),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: const Icon(Icons.delete_outline, color: AppColors.error),
      ),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 2),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          decoration: BoxDecoration(
            color: isDone
                ? AppColors.primary.withValues(alpha: 0.05)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isDone
                  ? AppColors.primary.withValues(alpha: 0.2)
                  : AppColors.border.withValues(alpha: 0.4),
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            child: Column(
              children: [
                // ── Fila principal: badge / KG / REPS / RIR chips / ✓ ──
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Badge tipo + historial anterior
                    GestureDetector(
                      onTap: isDone
                          ? null
                          : () {
                              final types = [
                                'WORKING',
                                'WARMUP',
                                'FAILURE',
                                'DROP',
                              ];
                              final idx = types.indexOf(widget.row.setType);
                              widget.onTypeChange(
                                types[(idx + 1) % types.length],
                              );
                            },
                      child: SizedBox(
                        width: 40,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 26,
                              height: 26,
                              decoration: BoxDecoration(
                                color: typeC.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(7),
                                border: Border.all(
                                  color: typeC.withValues(alpha: 0.5),
                                ),
                              ),
                              child: Center(
                                child: Text(
                                  _typeLabel(
                                    widget.row.setType,
                                    widget.row.setNumber,
                                  ),
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w900,
                                    color: typeC,
                                  ),
                                ),
                              ),
                            ),
                            if (widget.previous != null) ...[
                              const SizedBox(height: 2),
                              Text(
                                '${widget.previous!.weightKg?.toStringAsFixed(widget.previous!.weightKg! == widget.previous!.weightKg!.roundToDouble() ? 0 : 1)}×${widget.previous!.reps}',
                                style: const TextStyle(
                                  fontSize: 8,
                                  color: AppColors.textMuted,
                                ),
                                textAlign: TextAlign.center,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),

                    // KG
                    Expanded(
                      flex: widget.isUnilateral ? 4 : 2,
                      child: widget.isUnilateral
                          ? Row(
                              children: [
                                Expanded(
                                  child: _MiniInput(
                                    controller: widget.row.weightLCtrl,
                                    readOnly: isDone,
                                    hint: 'L',
                                  ),
                                ),
                                const SizedBox(width: 3),
                                Expanded(
                                  child: _MiniInput(
                                    controller: widget.row.weightRCtrl,
                                    readOnly: isDone,
                                    hint: 'R',
                                  ),
                                ),
                              ],
                            )
                          : _MiniInput(
                              controller: widget.row.weightCtrl,
                              readOnly: isDone,
                              hint: '0',
                            ),
                    ),
                    const SizedBox(width: 5),

                    // REPS
                    Expanded(
                      flex: widget.isUnilateral ? 3 : 2,
                      child: widget.isUnilateral
                          ? Row(
                              children: [
                                Expanded(
                                  child: _MiniInput(
                                    controller: widget.row.repsLCtrl,
                                    readOnly: isDone,
                                    hint: 'L',
                                  ),
                                ),
                                const SizedBox(width: 3),
                                Expanded(
                                  child: _MiniInput(
                                    controller: widget.row.repsRCtrl,
                                    readOnly: isDone,
                                    hint: 'R',
                                  ),
                                ),
                              ],
                            )
                          : _MiniInput(
                              controller: widget.row.repsCtrl,
                              readOnly: isDone,
                              hint: '0',
                            ),
                    ),
                    const SizedBox(width: 5),

                    // RIR chips compactos
                    SizedBox(
                      width: 110,
                      child: Row(
                        children: List.generate(5, (i) {
                          final sel = _selectedRir == i;
                          final c = _rirColor(i);
                          return Expanded(
                            child: GestureDetector(
                              onTap: () => _selectRir(i),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 150),
                                margin: const EdgeInsets.only(right: 2),
                                height: 26,
                                decoration: BoxDecoration(
                                  color: sel
                                      ? c.withValues(alpha: 0.2)
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(5),
                                  border: Border.all(
                                    color: sel
                                        ? c.withValues(alpha: 0.8)
                                        : AppColors.border,
                                    width: sel ? 1.5 : 0.8,
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    '$i',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: sel ? c : AppColors.textMuted,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          );
                        }),
                      ),
                    ),
                    const SizedBox(width: 5),

                    // Check
                    isDone
                        ? GestureDetector(
                            onTap: widget.onUnlog,
                            child: const Icon(
                              Icons.check_circle,
                              color: AppColors.primary,
                              size: 24,
                            ),
                          )
                        : GestureDetector(
                            onTap: widget.onLog,
                            child: Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary.withValues(
                                      alpha: 0.3,
                                    ),
                                    blurRadius: 5,
                                    offset: const Offset(0, 1),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.check_rounded,
                                color: Colors.black,
                                size: 18,
                              ),
                            ),
                          ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MiniInput extends StatelessWidget {
  final TextEditingController controller;
  final bool readOnly;
  final String hint;

  const _MiniInput({
    required this.controller,
    required this.readOnly,
    required this.hint,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 32,
      decoration: BoxDecoration(
        color: readOnly
            ? AppColors.primary.withValues(alpha: 0.06)
            : AppColors.elevated,
        borderRadius: BorderRadius.circular(7),
        border: Border.all(
          color: readOnly
              ? AppColors.primary.withValues(alpha: 0.25)
              : AppColors.border,
          width: 1,
        ),
      ),
      child: TextField(
        controller: controller,
        readOnly: readOnly,
        textAlign: TextAlign.center,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        style:
            Theme.of(context).textTheme.displaySmall?.copyWith(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: readOnly ? AppColors.primary : AppColors.textPrimary,
            ) ??
            TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: readOnly ? AppColors.primary : AppColors.textPrimary,
            ),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 12),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.only(bottom: 12), // Ajuste vertical
        ),
      ),
    );
  }
}

class _HeaderBadge extends StatelessWidget {
  final int count;
  final String label;
  final Color color;

  const _HeaderBadge({
    required this.count,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Text(
        '$count $label',
        style: TextStyle(
          fontSize: 11,
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
