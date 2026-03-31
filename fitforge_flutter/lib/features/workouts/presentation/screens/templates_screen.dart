// lib/features/workouts/presentation/screens/templates_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/ff_widgets.dart';
import '../../../../core/router/app_router.dart';
import '../providers/routines_provider.dart';
import '../providers/workouts_provider.dart';

class TemplatesScreen extends ConsumerWidget {
  const TemplatesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final templatesAsync = ref.watch(routineTemplatesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // ── Header ──────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 16, 20),
                child: Row(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Templates',
                          style: GoogleFonts.inter(
                            fontSize: 30,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                            letterSpacing: -0.6,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          'Your custom routines',
                          style: GoogleFonts.inter(
                            color: const Color(0xFF999999),
                            fontSize: 14,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    // Create button
                    GestureDetector(
                      onTap: () => context.push(AppRoutes.createTemplate),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF1A7A3A), AppColors.primary],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          ),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.25),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.add_rounded,
                              color: Colors.white,
                              size: 18,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'New',
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── Content ─────────────────────────────────────────────────
          templatesAsync.when(
            loading:
                () => const SliverFillRemaining(
                  child: Center(
                    child: CircularProgressIndicator(
                      color: AppColors.primary,
                      strokeWidth: 2,
                    ),
                  ),
                ),
            error:
                (err, _) => SliverFillRemaining(
                  child: Center(
                    child: EmptyState(
                      icon: Icons.error_outline_rounded,
                      title: 'Something went wrong',
                      subtitle: err.toString(),
                      actionLabel: 'Retry',
                      onAction: () => ref.invalidate(routineTemplatesProvider),
                    ),
                  ),
                ),
            data: (templates) {
              if (templates.isEmpty) {
                return SliverFillRemaining(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 72,
                            height: 72,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.library_books_rounded,
                              size: 34,
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(height: 20),
                          Text(
                            'No templates yet',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Create a custom routine to start your workouts faster and with more structure.',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.inter(
                              color: const Color(0xFF888888),
                              fontSize: 13,
                              fontWeight: FontWeight.w300,
                            ),
                          ),
                          const SizedBox(height: 28),
                          GestureDetector(
                            onTap: () => context.push(AppRoutes.createTemplate),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 28,
                                vertical: 14,
                              ),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF1A7A3A), AppColors.primary],
                                ),
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary.withValues(
                                      alpha: 0.3,
                                    ),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Text(
                                'Create First Template',
                                style: GoogleFonts.inter(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }

              return SliverPadding(
                padding: EdgeInsets.fromLTRB(16, 0, 16, MediaQuery.of(context).padding.bottom),
                sliver: SliverList.separated(
                  itemCount: templates.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final template = templates[index];
                    return _TemplateCard(template: template);
                  },
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _TemplateCard extends ConsumerWidget {
  final RoutineTemplate template;

  const _TemplateCard({required this.template});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header row
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.view_list_rounded,
                  color: AppColors.primary,
                  size: 26,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      template.name,
                      style: GoogleFonts.inter(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${template.items.length} exercise${template.items.length == 1 ? '' : 's'}',
                      style: GoogleFonts.inter(
                        color: const Color(0xFF999999),
                        fontSize: 13,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
              // Delete button
              GestureDetector(
                onTap: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder:
                        (c) => AlertDialog(
                          backgroundColor: AppColors.card,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                            side: const BorderSide(
                              color: AppColors.border,
                              width: 0.5,
                            ),
                          ),
                          title: Text(
                            'Delete template?',
                            style: GoogleFonts.inter(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          content: Text(
                            'This action cannot be undone.',
                            style: GoogleFonts.inter(
                              color: const Color(0xFF888888),
                              fontWeight: FontWeight.w300,
                              fontSize: 13,
                            ),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(c, false),
                              child: Text(
                                'Cancel',
                                style: GoogleFonts.inter(
                                  color: const Color(0xFF888888),
                                ),
                              ),
                            ),
                            TextButton(
                              onPressed: () => Navigator.pop(c, true),
                              child: Text(
                                'Delete',
                                style: GoogleFonts.inter(
                                  color: AppColors.error,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                  );
                  if (confirm == true) {
                    ref
                        .read(routineTemplatesProvider.notifier)
                        .deleteRoutine(template.id);
                  }
                },
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.08),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.delete_outline_rounded,
                    color: AppColors.error,
                    size: 18,
                  ),
                ),
              ),
            ],
          ),

          // Exercise list
          if (template.items.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Divider(color: AppColors.border, thickness: 0.5),
            const SizedBox(height: 12),
            ...template.items.take(4).map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(7),
                      ),
                      child: Center(
                        child: Text(
                          '${item.targetSets ?? 0}',
                          style: GoogleFonts.barlow(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        item.exerciseName,
                        style: GoogleFonts.inter(
                          color: AppColors.textPrimary,
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (template.items.length > 4)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  '+${template.items.length - 4} more exercises',
                  style: GoogleFonts.inter(
                    color: const Color(0xFF999999),
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ),
          ],

          const SizedBox(height: 16),

          // Start button
          GestureDetector(
            onTap: () async {
              await ref
                  .read(activeSessionProvider.notifier)
                  .startSession(routineId: template.id, name: template.name);
              if (context.mounted &&
                  ref.read(activeSessionProvider).hasActiveSession) {
                context.push(AppRoutes.activeSession);
              }
            },
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1A7A3A), AppColors.primary],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.25),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.play_arrow_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Start Workout',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
