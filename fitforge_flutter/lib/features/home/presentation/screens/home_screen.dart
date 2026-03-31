// lib/features/home/presentation/screens/home_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/ff_widgets.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../workouts/presentation/providers/workouts_provider.dart';
import '../../../workouts/data/models/workout_models.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    final session = ref.watch(activeSessionProvider);
    final history = ref.watch(workoutHistoryProvider);

    final name = auth.user?.displayName.split(' ').first ?? 'Athlete';
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Good morning'
        : hour < 18
        ? 'Good afternoon'
        : 'Good evening';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // ── Hero header ────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: _HeroHeader(
              greeting: greeting,
              name: name,
              onViewProfile: () => context.push(AppRoutes.profile),
              onLogout: () => ref.read(authStateProvider.notifier).logout(),
            ).animate().fadeIn(duration: 400.ms),
          ),

          // ── Active session banner ──────────────────────────────────────
          if (session.hasActiveSession)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: _ActiveBanner(
                  session: session.session!,
                  onResume: () => context.push(AppRoutes.activeSession),
                ),
              ).animate().fadeIn(delay: 100.ms).slideY(begin: -0.1),
            ),

          // ── Quick start ───────────────────────────────────────────────
          if (!session.hasActiveSession)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                child: _QuickStartCard(
                  isLoading: session.isLoading,
                  onStart: () async {
                    await ref
                        .read(activeSessionProvider.notifier)
                        .startSession();
                    if (context.mounted &&
                        ref.read(activeSessionProvider).hasActiveSession) {
                      context.push(AppRoutes.activeSession);
                    }
                  },
                ),
              ).animate().fadeIn(delay: 150.ms),
            ),

          // ── Today's Stats ────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: _TodayStats(history: history, activeSession: session),
            ).animate().fadeIn(delay: 180.ms),
          ),

          // ── Weekly summary ────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              child: _WeeklySummary(history: history, activeSession: session),
            ).animate().fadeIn(delay: 200.ms),
          ),

          // ── Streak & PRs ─────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: _StreakCard(history: history),
            ).animate().fadeIn(delay: 220.ms),
          ),

          history.when(
            loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
            error: (e, _) => const SliverToBoxAdapter(child: SizedBox.shrink()),
            data: (sessions) =>
                const SliverToBoxAdapter(child: SizedBox.shrink()),
          ),

          // ── Bottom clearance for floating nav bar ──────────────────────
          SliverToBoxAdapter(
            child: SizedBox(height: MediaQuery.of(context).padding.bottom),
          ),
        ],
      ),
    );
  }
}

// ── Hero Header ───────────────────────────────────────────────────────────────
class _HeroHeader extends StatelessWidget {
  final String greeting, name;
  final VoidCallback onViewProfile;
  final VoidCallback onLogout;
  const _HeroHeader({
    required this.greeting,
    required this.name,
    required this.onViewProfile,
    required this.onLogout,
  });

  void _showProfileMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      useRootNavigator: true,
      builder: (bottomSheetContext) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFF1A1A1A),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.fromLTRB(
          16, 
          12, 
          16, 
          MediaQuery.of(bottomSheetContext).padding.bottom + 32,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFF444444),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            _ProfileMenuTile(
              icon: Icons.person_outline_rounded,
              label: 'View Profile',
              onTap: () {
                Navigator.pop(bottomSheetContext);
                onViewProfile();
              },
            ),
            _ProfileMenuTile(
              icon: Icons.logout_outlined,
              label: 'Log Out',
              color: const Color(0xFFFF4444),
              onTap: () {
                Navigator.pop(bottomSheetContext);
                onLogout();
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dateStr = DateFormat('EEEE, MMM d').format(now);
    // Motivational phrases keyed to time of day
    final hour = now.hour;
    final motivation = hour < 12
        ? 'Ready to crush it today?'
        : hour < 18
        ? 'Keep pushing, you\'re doing great!'
        : 'Evening grind hits different ';

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 60, 16, 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.08),
            Colors.transparent,
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Date chip
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.2),
                      width: 0.5,
                    ),
                  ),
                  child: Text(
                    dateStr,
                    style: GoogleFonts.inter(
                      color: AppColors.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.3,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                // Greeting
                Text(
                  greeting,
                  style: GoogleFonts.inter(
                    color: const Color(0xFF999999),
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 2),
                // Name
                Text(
                  name,
                  style: GoogleFonts.inter(
                    color: AppColors.textPrimary,
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.6,
                  ),
                ),
                const SizedBox(height: 6),
                // Motivational subtitle
                Text(
                  motivation,
                  style: GoogleFonts.inter(
                    color: const Color(0xFF888888),
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
          // Neon avatar with options menu
          GestureDetector(
            onTap: () => _showProfileMenu(context),
            child: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.primary, width: 2),
                color: AppColors.elevated,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.22),
                    blurRadius: 12,
                    spreadRadius: 0,
                  ),
                ],
              ),
              child: const Icon(
                Icons.person_outline_rounded,
                color: AppColors.primary,
                size: 24,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Active banner ─────────────────────────────────────────────────────────────
class _ActiveBanner extends StatelessWidget {
  final WorkoutSession session;
  final VoidCallback onResume;
  const _ActiveBanner({required this.session, required this.onResume});

  @override
  Widget build(BuildContext context) {
    final elapsed = DateTime.now().difference(session.startedAt);
    final m = elapsed.inMinutes;
    final s = elapsed.inSeconds % 60;

    // Compute live stats from active session
    final allSets = session.exerciseBlocks
        .expand((b) => b.sets)
        .where((set) => set.setType == 'WORKING' && !set.isFailed)
        .toList();
    final totalSets = allSets.length;
    final totalVolume = allSets.fold<double>(
      0,
      (sum, set) => sum + ((set.weightKg ?? 0) * (set.reps ?? 0)),
    );
    final volStr = totalVolume >= 1000
        ? '${(totalVolume / 1000).toStringAsFixed(1)}t'
        : '${totalVolume.toStringAsFixed(0)}kg';

    return GestureDetector(
      onTap: onResume,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: AppColors.neonCard(),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(
                Icons.play_arrow_rounded,
                color: AppColors.primary,
                size: 26,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'IN PROGRESS',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    session.name,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        '$m:${s.toString().padLeft(2, '0')} elapsed',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                      if (totalSets > 0) ...[
                        const Text(
                          '  ·  ',
                          style: TextStyle(color: AppColors.border),
                        ),
                        Text(
                          '$totalSets sets',
                          style: const TextStyle(
                            color: AppColors.accentCyan,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '$volStr vol',
                          style: const TextStyle(
                            color: AppColors.warning,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'Resume',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Quick start ───────────────────────────────────────────────────────────────
class _QuickStartCard extends StatelessWidget {
  final bool isLoading;
  final VoidCallback onStart;
  const _QuickStartCard({required this.isLoading, required this.onStart});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onStart,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        height: 136,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              const Color(0xFF0F3D22),
              AppColors.primary.withValues(alpha: 0.35),
            ],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: AppColors.primary.withValues(alpha: 0.4),
            width: 0.5,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.15),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  color: AppColors.primary,
                  strokeWidth: 2,
                ),
              )
            : Row(
                children: [
                  const SizedBox(width: 24),
                  // Circular icon with glow
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.4),
                        width: 1.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.28),
                          blurRadius: 16,
                          spreadRadius: 0,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.add_rounded,
                      color: AppColors.primary,
                      size: 32,
                    ),
                  ),
                  const SizedBox(width: 18),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Start Workout',
                        style: GoogleFonts.inter(
                          color: AppColors.primary,
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.4,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        'Tap to begin a new session',
                        style: GoogleFonts.inter(
                          color: const Color(0xFF999999),
                          fontSize: 13,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  const Icon(
                    Icons.arrow_forward_ios_rounded,
                    color: AppColors.primary,
                    size: 14,
                  ),
                  const SizedBox(width: 20),
                ],
              ),
      ),
    );
  }
}

// ── Today's Stats ───────────────────────────────────────────────────────────
class _TodayStats extends ConsumerWidget {
  final AsyncValue<List<WorkoutSession>> history;
  final ActiveSessionState activeSession;
  const _TodayStats({required this.history, required this.activeSession});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return history.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (sessions) {
        final today = DateTime.now();
        final todaySessions = sessions.where((s) {
          final localStart = s.startedAt.toLocal();
          return localStart.year == today.year &&
              localStart.month == today.month &&
              localStart.day == today.day;
        }).toList();

        int totalSets = 0;
        double totalVolume = 0;
        for (final session in todaySessions) {
          for (final block in session.exerciseBlocks) {
            final validSets = block.sets.where(
              (s) => s.setType == 'WORKING' && !s.isFailed,
            );
            totalSets += validSets.length;
            for (final set in validSets) {
              if (set.weightKg != null && set.reps != null) {
                totalVolume += set.weightKg! * set.reps!;
              }
            }
          }
        }

        // Include the live active session if it's from today
        if (activeSession.hasActiveSession) {
          final activeStartedAt = activeSession.session!.startedAt.toLocal();
          final isToday =
              activeStartedAt.year == today.year &&
              activeStartedAt.month == today.month &&
              activeStartedAt.day == today.day;
          if (isToday) {
            for (final block in activeSession.session!.exerciseBlocks) {
              for (final set in block.sets) {
                if (set.setType == 'WORKING' && !set.isFailed) {
                  totalSets++;
                  if (set.weightKg != null && set.reps != null) {
                    totalVolume += set.weightKg! * set.reps!;
                  }
                }
              }
            }
          }
        }

        if (todaySessions.isEmpty && !activeSession.hasActiveSession) {
          return GlassCard(
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppColors.primary.withValues(alpha: 0.2),
                        AppColors.primary.withValues(alpha: 0.08),
                      ],
                    ),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.bolt_rounded,
                    color: AppColors.primary,
                    size: 26,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Ready to start your day?',
                        style: GoogleFonts.inter(
                          color: AppColors.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'No workouts yet — let\'s change that! ',
                        style: GoogleFonts.inter(
                          color: const Color(0xFF888888),
                          fontSize: 12,
                          fontWeight: FontWeight.w300,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }

        final displayCount =
            todaySessions.length + (activeSession.hasActiveSession ? 1 : 0);

        return GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      Icons.local_fire_department,
                      color: AppColors.primary,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Text(
                      "Today's Training",
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '$displayCount workout${displayCount > 1 ? 's' : ''}',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _StatItem(
                    value: '$totalSets',
                    label: 'Sets',
                    icon: Icons.fitness_center,
                  ),
                  Container(height: 40, width: 1, color: AppColors.border),
                  _StatItem(
                    value: _formatVolume(totalVolume),
                    label: 'Volume',
                    icon: Icons.trending_up,
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  String _formatVolume(double volume) {
    if (volume >= 1000) {
      return '${(volume / 1000).toStringAsFixed(1)}t';
    }
    return '${volume.toStringAsFixed(0)}kg';
  }
}

class _StatItem extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  const _StatItem({
    required this.value,
    required this.label,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Icon with accent circle background
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: AppColors.primary, size: 22),
        ),
        const SizedBox(height: 12),
        // Number: Barlow ExtraBold
        Text(
          value,
          style: GoogleFonts.barlow(
            fontSize: 32,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
            height: 1,
          ),
        ),
        const SizedBox(height: 5),
        // Label: Inter muted
        Text(
          label,
          style: GoogleFonts.inter(
            color: const Color(0xFF999999),
            fontSize: 12,
            fontWeight: FontWeight.w400,
          ),
        ),
      ],
    );
  }
}

// ── Weekly summary ────────────────────────────────────────────────────────────
class _WeeklySummary extends StatelessWidget {
  final AsyncValue<List<WorkoutSession>> history;
  final ActiveSessionState activeSession;
  const _WeeklySummary({required this.history, required this.activeSession});

  @override
  Widget build(BuildContext context) {
    return history.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (sessions) {
        final now = DateTime.now();
        final weekSessions = sessions.where((s) {
          // Compare using local dates to avoid day-offset issues
          final localStart = s.startedAt.toLocal();
          return now.difference(localStart).inDays < 7;
        }).toList();

        int totalSets = 0;
        int totalMin = 0;
        double totalVolume = 0;

        // Base sets/volume from history
        for (final s in weekSessions) {
          totalMin += (s.durationSeconds ?? 0) ~/ 60;
          for (final b in s.exerciseBlocks) {
            final validSets = b.sets.where((st) => st.setType == 'WORKING' && !st.isFailed);
            totalSets += validSets.length;
            totalVolume += validSets.fold<double>(0, (sum, st) => sum + ((st.weightKg ?? 0) * (st.reps ?? 0)));
          }
        }

        // Add live data if there's an active session
        if (activeSession.hasActiveSession) {
          final s = activeSession.session!;
          totalMin += DateTime.now().difference(s.startedAt).inMinutes;
          for (final b in s.exerciseBlocks) {
            final validSets = b.sets.where((st) => st.setType == 'WORKING' && !st.isFailed);
            totalSets += validSets.length;
            totalVolume += validSets.fold<double>(0, (sum, st) => sum + ((st.weightKg ?? 0) * (st.reps ?? 0)));
          }
        }

        return GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'THIS WEEK',
                    style: GoogleFonts.inter(
                      color: const Color(0xFF999999),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.5,
                    ),
                  ),
                  if (activeSession.hasActiveSession)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text('LIVE', style: TextStyle(color: AppColors.primary, fontSize: 9, fontWeight: FontWeight.bold)),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  StatBadge(
                    value: '${weekSessions.length + (activeSession.hasActiveSession ? 1 : 0)}',
                    label: 'Workouts',
                    icon: Icons.calendar_today_rounded,
                  ),
                  Container(height: 36, width: 0.5, color: AppColors.border),
                  StatBadge(
                    value: '$totalSets',
                    label: 'Sets',
                    icon: Icons.fitness_center_rounded,
                  ),
                  Container(height: 36, width: 0.5, color: AppColors.border),
                  StatBadge(
                    value: '${totalMin}m',
                    label: 'Time',
                    icon: Icons.timer_rounded,
                  ),
                ],
              ),
              const SizedBox(height: 20),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: ((weekSessions.length + (activeSession.hasActiveSession ? 1 : 0)) / 5).clamp(0.0, 1.0),
                  backgroundColor: AppColors.elevated,
                  valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                  minHeight: 8,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${weekSessions.length + (activeSession.hasActiveSession ? 1 : 0)}/5 workouts',
                    style: GoogleFonts.inter(
                      color: const Color(0xFF999999),
                      fontSize: 12,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                  Text(
                    '+${_formatVolume(totalVolume)} vol',
                    style: GoogleFonts.barlow(
                      color: AppColors.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  String _formatVolume(double volume) {
    if (volume >= 1000) {
      return '${(volume / 1000).toStringAsFixed(1)}t';
    }
    return '${volume.toStringAsFixed(0)}kg';
  }
}

// ── Streak Card ────────────────────────────────────────────────────────────
class _StreakCard extends StatelessWidget {
  final AsyncValue<List<WorkoutSession>> history;
  const _StreakCard({required this.history});

  @override
  Widget build(BuildContext context) {
    return history.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (sessions) {
        // Calculate streak
        int currentStreak = 0;
        if (sessions.isNotEmpty) {
          final sortedSessions = List<WorkoutSession>.from(sessions)
            ..sort((a, b) => b.startedAt.compareTo(a.startedAt));

          final today = DateTime.now();
          final yesterday = today.subtract(const Duration(days: 1));

          for (int i = 0; i < sortedSessions.length; i++) {
            final sessionDate = DateTime(
              sortedSessions[i].startedAt.year,
              sortedSessions[i].startedAt.month,
              sortedSessions[i].startedAt.day,
            );

            if (i == 0) {
              // First session - check if it's today or yesterday
              if (sessionDate.year == today.year &&
                  sessionDate.month == today.month &&
                  sessionDate.day == today.day) {
                currentStreak = 1;
              } else if (sessionDate.year == yesterday.year &&
                  sessionDate.month == yesterday.month &&
                  sessionDate.day == yesterday.day) {
                currentStreak = 1;
              } else {
                currentStreak = 0;
              }
              continue;
            }

            final prevDate = DateTime(
              sortedSessions[i - 1].startedAt.year,
              sortedSessions[i - 1].startedAt.month,
              sortedSessions[i - 1].startedAt.day,
            );

            final diff = prevDate.difference(sessionDate).inDays;
            if (diff == 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        }

        return Row(
          children: [
            Expanded(
              child: GlassCard(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    Container(
                      width: 46,
                      height: 46,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppColors.warning.withValues(alpha: 0.22),
                            AppColors.warning.withValues(alpha: 0.1),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.local_fire_department,
                        color: AppColors.warning,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$currentStreak',
                          style: GoogleFonts.barlow(
                            color: AppColors.textPrimary,
                            fontSize: 30,
                            fontWeight: FontWeight.w800,
                            height: 1,
                          ),
                        ),
                        Text(
                          'Day streak',
                          style: GoogleFonts.inter(
                            color: const Color(0xFF999999),
                            fontSize: 12,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: GlassCard(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    Container(
                      width: 46,
                      height: 46,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppColors.pr.withValues(alpha: 0.22),
                            AppColors.pr.withValues(alpha: 0.1),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.emoji_events,
                        color: AppColors.pr,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${sessions.length}',
                          style: GoogleFonts.barlow(
                            color: AppColors.textPrimary,
                            fontSize: 30,
                            fontWeight: FontWeight.w800,
                            height: 1,
                          ),
                        ),
                        Text(
                          'Total workouts',
                          style: GoogleFonts.inter(
                            color: const Color(0xFF999999),
                            fontSize: 12,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

// ── Profile Menu Tile ─────────────────────────────────────────────────────────
class _ProfileMenuTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;
  const _ProfileMenuTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final tileColor = color ?? AppColors.textPrimary;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.elevated,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: color != null
                ? color!.withValues(alpha: 0.25)
                : AppColors.border,
            width: 0.5,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: tileColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: tileColor, size: 18),
            ),
            const SizedBox(width: 14),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: tileColor,
              ),
            ),
            const Spacer(),
            Icon(
              Icons.chevron_right_rounded,
              color: tileColor.withValues(alpha: 0.4),
              size: 18,
            ),
          ],
        ),
      ),
    );
  }
}
