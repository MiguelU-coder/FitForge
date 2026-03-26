// lib/features/exercises/presentation/screens/exercises_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/ff_widgets.dart';
import '../../data/models/exercise_model.dart';
import '../providers/exercises_provider.dart';
import 'create_exercise_screen.dart';

class ExercisesScreen extends ConsumerStatefulWidget {
  const ExercisesScreen({super.key});
  @override
  ConsumerState<ExercisesScreen> createState() => _ExercisesScreenState();
}

class _ExercisesScreenState extends ConsumerState<ExercisesScreen> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filters = ref.watch(exerciseFiltersProvider);
    final exercises = ref.watch(exercisesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // ── Header & Search sliver ─────────────────────────────
          SliverToBoxAdapter(
            child: SafeArea(
              bottom: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title row
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 12, 0),
                    child: Row(
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Library',
                              style: GoogleFonts.inter(
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                color: AppColors.textPrimary,
                                letterSpacing: -0.5,
                              ),
                            ),
                            Text(
                              'Global exercise database',
                              style: GoogleFonts.inter(
                                color: const Color(0xFF888888),
                                fontSize: 12,
                                fontWeight: FontWeight.w300,
                              ),
                            ),
                          ],
                        ),
                        const Spacer(),
                        IconButton(
                          onPressed: () => _showFilterSheet(context, ref, filters),
                          icon: Badge(
                            isLabelVisible: filters.equipment != null || !filters.useExternal,
                            child: const Icon(
                              Icons.tune_rounded,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const CreateExerciseScreen()),
                          ).then((_) => ref.invalidate(exercisesProvider)),
                          icon: const Icon(Icons.add_rounded, color: AppColors.primary, size: 28),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Search bar
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: TextField(
                      controller: _ctrl,
                      style: GoogleFonts.inter(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Search exercises...',
                        hintStyle: GoogleFonts.inter(
                          color: AppColors.textMuted,
                          fontSize: 14,
                          fontWeight: FontWeight.w300,
                        ),
                        prefixIcon: const Icon(
                          Icons.search_rounded,
                          size: 20,
                          color: AppColors.textSecondary,
                        ),
                        suffixIcon: filters.search.isNotEmpty
                            ? IconButton(
                                icon: const Icon(
                                  Icons.close_rounded,
                                  size: 16,
                                  color: AppColors.textSecondary,
                                ),
                                onPressed: () {
                                  _ctrl.clear();
                                  ref
                                      .read(exerciseFiltersProvider.notifier)
                                      .state = filters.copyWith(search: '');
                                },
                              )
                            : null,
                        contentPadding: const EdgeInsets.symmetric(vertical: 10),
                        filled: true,
                        fillColor: AppColors.card,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: AppColors.border.withValues(alpha: 0.5)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: AppColors.border.withValues(alpha: 0.5)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.primary, width: 1.0),
                        ),
                      ),
                      onChanged: (v) =>
                          ref.read(exerciseFiltersProvider.notifier).state =
                              filters.copyWith(search: v),
                    ),
                  ),
                  const SizedBox(height: 14),

                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),

          // ── Exercise Grid ───────────────────────────────────────
          exercises.when(
            loading: () => SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, __) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Shimmer.fromColors(
                      baseColor: AppColors.card,
                      highlightColor: AppColors.elevated,
                      child: Container(
                        height: 68,
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  childCount: 6,
                ),
              ),
            ),
            error: (e, _) => SliverFillRemaining(
              child: Center(
                child: EmptyState(
                  icon: Icons.wifi_off_outlined,
                  title: 'Connection error',
                  subtitle: e.toString(),
                  actionLabel: 'Retry',
                  onAction: () => ref.invalidate(exercisesProvider),
                ),
              ),
            ),
            data: (page) => page.exercises.isEmpty
                ? SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 72,
                            height: 72,
                            decoration: const BoxDecoration(
                              color: AppColors.elevated,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.search_rounded,
                              size: 34,
                              color: AppColors.textMuted.withValues(alpha: 0.5),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No results found',
                            style: GoogleFonts.inter(
                              color: AppColors.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 40),
                            child: Text(
                              'Try a different search term or clear the filters',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                color: const Color(0xFF888888),
                                fontSize: 13,
                                fontWeight: FontWeight.w300,
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          if (filters.muscle != null || filters.equipment != null)
                            GestureDetector(
                              onTap: () =>
                                  ref
                                      .read(exerciseFiltersProvider.notifier)
                                      .state = filters.copyWith(
                                    clearMuscle: true,
                                    clearEquipment: true,
                                  ),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: AppColors.primary.withValues(alpha: 0.3),
                                    width: 0.5,
                                  ),
                                ),
                                child: Text(
                                  'Clear Filters',
                                  style: GoogleFonts.inter(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  )
                : SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.78,
                            crossAxisSpacing: 14,
                            mainAxisSpacing: 14,
                          ),
                      delegate: SliverChildBuilderDelegate(
                        (ctx, i) =>
                            _GridExerciseCard(exercise: page.exercises[i]),
                        childCount: page.exercises.length,
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  void _showFilterSheet(BuildContext context, WidgetRef ref, ExerciseFilters filters) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _FilterBottomSheet(initialFilters: filters),
    ).then((newFilters) {
      if (newFilters != null && newFilters is ExerciseFilters) {
        ref.read(exerciseFiltersProvider.notifier).state = newFilters;
      }
    });
  }
}

class _FilterBottomSheet extends StatefulWidget {
  final ExerciseFilters initialFilters;
  const _FilterBottomSheet({required this.initialFilters});

  @override
  State<_FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<_FilterBottomSheet> {
  late ExerciseFilters _filters;

  @override
  void initState() {
    super.initState();
    _filters = widget.initialFilters;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        border: Border(top: BorderSide(color: AppColors.border, width: 0.5)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'ADVANCED FILTERS',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textMuted,
                  letterSpacing: 1.5,
                ),
              ),
              TextButton(
                onPressed: () {
                  setState(() {
                    _filters = const ExerciseFilters();
                  });
                },
                child: const Text('Reset', style: TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Source Toggle
          const Text('EXERCISE SOURCE', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 12),
          Row(
            children: [
              _SourceChip(
                label: 'Global Library',
                selected: _filters.useExternal,
                onTap: () => setState(() => _filters = _filters.copyWith(useExternal: true)),
              ),
              const SizedBox(width: 12),
              _SourceChip(
                label: 'My Custom',
                selected: !_filters.useExternal,
                onTap: () => setState(() => _filters = _filters.copyWith(useExternal: false)),
              ),
            ],
          ),
          const SizedBox(height: 32),

          // Muscle Group
          const Text('MUSCLE GROUP', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 16),
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: kMuscleGroups.length + 1,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (ctx, i) {
                if (i == 0) {
                  return _FilterMuscleChip(
                    label: 'All',
                    muscle: 'ALL',
                    selected: _filters.muscle == null,
                    onTap: () => setState(() => _filters = _filters.copyWith(clearMuscle: true)),
                  );
                }
                final m = kMuscleGroups[i - 1];
                return _FilterMuscleChip(
                  label: MuscleTag.label(m),
                  muscle: m,
                  selected: _filters.muscle == m,
                  onTap: () => setState(() => _filters = _filters.copyWith(muscle: m)),
                );
              },
            ),
          ),
          const SizedBox(height: 32),

          // Equipment Grid
          const Text('EQUIPMENT', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _EquipChip(
                label: 'All',
                selected: _filters.equipment == null,
                onTap: () => setState(() => _filters = _filters.copyWith(clearEquipment: true)),
              ),
              ...kEquipment.map((e) => _EquipChip(
                label: equipmentLabel(e),
                selected: _filters.equipment == e,
                onTap: () => setState(() => _filters = _filters.copyWith(equipment: e)),
              )),
            ],
          ),
          const SizedBox(height: 40),

          NeonButton(
            label: 'APPLY FILTERS',
            onPressed: () => Navigator.pop(context, _filters),
          ),
        ],
      ),
    );
  }
}

class _FilterMuscleChip extends StatelessWidget {
  final String label;
  final String muscle;
  final bool selected;
  final VoidCallback onTap;

  const _FilterMuscleChip({
    required this.label,
    required this.muscle,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = muscle == 'ALL' ? AppColors.primary : MuscleTag.color(muscle);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: selected ? color.withValues(alpha: 0.15) : AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? color : AppColors.border,
            width: 1.2,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(
                muscle == 'ALL' ? Icons.apps : Icons.accessibility_new,
                size: 12,
                color: color,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: selected ? color : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SourceChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _SourceChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary.withValues(alpha: 0.15) : AppColors.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? AppColors.primary : AppColors.border, width: 1.2),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? AppColors.primary : AppColors.textSecondary,
            fontWeight: selected ? FontWeight.bold : FontWeight.w500,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

class _EquipChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _EquipChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary.withValues(alpha: 0.15) : AppColors.card,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: selected ? AppColors.primary : AppColors.border, width: 1.1),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? AppColors.primary : AppColors.textSecondary,
            fontWeight: selected ? FontWeight.bold : FontWeight.w500,
            fontSize: 12,
          ),
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
                // Action Icons
                Positioned(
                  top: 8,
                  left: 8,
                  child: _MiniCircleAction(
                    icon: Icons.bookmark_border,
                    onTap: () {},
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: _MiniCircleAction(
                    icon: Icons.help_outline,
                    onTap: () {},
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
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  exercise.primaryMuscles.isNotEmpty
                      ? MuscleTag.label(exercise.primaryMuscles.first)
                      : 'Full Body',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: primaryColor.withValues(alpha: 0.9),
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

class _MiniCircleAction extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _MiniCircleAction({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.5),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 14, color: Colors.white70),
      ),
    );
  }
}
