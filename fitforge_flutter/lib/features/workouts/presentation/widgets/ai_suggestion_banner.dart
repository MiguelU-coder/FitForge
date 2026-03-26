// lib/features/workouts/presentation/widgets/ai_suggestion_banner.dart
//
// AI Coach Banner — Phase 3 upgrade.
//
// BEFORE: showed a single line from /ai/suggestion ("On track — try 150kg × 8")
// AFTER:  shows rich LLM coaching feedback from /ai/coach:
//           • summary  : "Tu press banca mejoró un 3% esta semana."
//           • insights + recommendations (expandable)
//           • motivation footer
//           • warnings in amber if present
//
// Still exports AiSuggestionBanner for backward compatibility with existing
// workout screens that pass a WorkoutSuggestionState for the deterministic banner.
// The new CoachBanner is a separate widget consuming CoachState.

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/ai_provider.dart';
import '../providers/coach_provider.dart';
import '../../../../features/ai/data/models/ai_response_models.dart';

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — deterministic suggestion banner (kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────

class AiSuggestionBanner extends StatelessWidget {
  final WorkoutSuggestionState aiState;

  const AiSuggestionBanner({super.key, required this.aiState});

  @override
  Widget build(BuildContext context) {
    if (aiState.isLoading) {
      return const _LoadingBanner(label: 'Analizando tu set…');
    }

    final suggestion = aiState.suggestion;
    if (suggestion == null) return const SizedBox.shrink();

    final c = suggestion.color;
    final pct = (suggestion.confidence * 100).round();

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 350),
      transitionBuilder: (child, anim) => FadeTransition(
        opacity: anim,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 0.15),
            end: Offset.zero,
          ).animate(anim),
          child: child,
        ),
      ),
      child: Container(
        key: ValueKey(suggestion.message),
        margin: const EdgeInsets.only(top: 10, bottom: 4),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          color: c.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: c.withValues(alpha: 0.3)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(suggestion.icon, color: c, size: 16)
                .animate(onPlay: (ctrl) => ctrl.repeat(reverse: true))
                .scale(end: const Offset(1.15, 1.15), duration: 900.ms)
                .then()
                .scale(end: const Offset(1.0, 1.0), duration: 900.ms),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    suggestion.message,
                    style: TextStyle(
                      color: c,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (suggestion.reasoning.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      suggestion.reasoning,
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontSize: 10,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: c.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '$pct%',
                style: TextStyle(
                  color: c,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 300.ms);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW — AI Coach banner (LLM-powered, Phase 3)
// ─────────────────────────────────────────────────────────────────────────────

/// Drop-in replacement for the deterministic banner.
/// Shows rich coaching feedback from the LLM.
///
/// Usage:
///   CoachBanner(coachState: ref.watch(coachProvider))
class CoachBanner extends StatefulWidget {
  final CoachState coachState;

  const CoachBanner({super.key, required this.coachState});

  @override
  State<CoachBanner> createState() => _CoachBannerState();
}

class _CoachBannerState extends State<CoachBanner> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final state = widget.coachState;

    // Loading shimmer
    if (state.isLoading) {
      return const _LoadingBanner(label: 'Tu coach IA está analizando…');
    }

    final r = state.response;
    final err = state.error;

    // Error logic: always show error card if an error is present,
    // even if we have a stale 'r' from before.
    if (err != null) {
      return _ErrorCard(
        provider: 'flutter_error',
        customMessage:
            'Error de conexión: ${err.contains('timeout') ? 'Tiempo de espera agotado' : 'No se pudo contactar al coach'}',
      );
    }

    if (r == null) return const SizedBox.shrink();

    // Determine color based on warnings
    final hasWarnings = r.warnings.isNotEmpty;
    final color = hasWarnings ? AppTheme.warning : AppTheme.neon;

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 400),
      child: _expanded
          ? _ExpandedCard(r, color, () => setState(() => _expanded = false))
          : _CollapsedCard(r, color, () => setState(() => _expanded = true)),
    ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.1, end: 0);
  }
}

// ── Collapsed pill (shows only summary + tap to expand) ──────────────────────

class _CollapsedCard extends StatelessWidget {
  final CoachResponse r;
  final Color color;
  final VoidCallback onExpand;

  const _CollapsedCard(this.r, this.color, this.onExpand);

  /// Check if LLM provider indicates an error state
  bool get _isLlmError =>
      r.llmProvider == 'ollama_error' ||
      r.llmProvider == 'ollama_unavailable' ||
      r.llmProvider == 'claude_error';

  @override
  Widget build(BuildContext context) {
    // If LLM failed, show error state instead of normal coaching
    if (_isLlmError) {
      return _ErrorCard(provider: r.llmProvider);
    }

    return GestureDetector(
      onTap: onExpand,
      child: Container(
        margin: const EdgeInsets.only(top: 10, bottom: 4),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            Icon(Icons.auto_awesome_rounded, color: color, size: 15)
                .animate(onPlay: (c) => c.repeat(reverse: true))
                .scale(end: const Offset(1.2, 1.2), duration: 1000.ms),
            const SizedBox(width: 9),
            Expanded(
              child: Text(
                r.headline,
                style: TextStyle(
                  color: color,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  height: 1.3,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 6),
            Icon(
              Icons.keyboard_arrow_down_rounded,
              color: color.withValues(alpha: 0.6),
              size: 16,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Error card (when LLM provider fails) ─────────────────────────────────────

class _ErrorCard extends StatelessWidget {
  final String provider;
  final String? customMessage;

  const _ErrorCard({required this.provider, this.customMessage});

  String get _errorMessage {
    if (customMessage != null) return customMessage!;
    if (provider.contains('unavailable')) {
      return 'El servicio de IA no está disponible. Verifica que Ollama esté ejecutándose.';
    }
    return 'No se pudo generar el análisis del coach IA. Inténtalo de nuevo.';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 10, bottom: 4),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.warning.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.warning.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.error_outline_rounded,
            color: AppTheme.warning,
            size: 15,
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              _errorMessage,
              style: const TextStyle(
                color: AppTheme.warning,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                height: 1.3,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Expanded card (full coaching output) ─────────────────────────────────────

class _ExpandedCard extends StatelessWidget {
  final CoachResponse r;
  final Color color;
  final VoidCallback onCollapse;

  const _ExpandedCard(this.r, this.color, this.onCollapse);

  /// Check if LLM provider indicates an error state
  bool get _isLlmError =>
      r.llmProvider == 'ollama_error' ||
      r.llmProvider == 'ollama_unavailable' ||
      r.llmProvider == 'claude_error';

  String get _errorMessage {
    if (r.llmProvider.contains('unavailable')) {
      return 'El servicio de IA no está disponible. Verifica que Ollama esté ejecutándose.';
    }
    return 'No se pudo generar el análisis completo del coach IA. Mostrando respuesta básica.';
  }

  @override
  Widget build(BuildContext context) {
    // If LLM failed, show simplified error state
    if (_isLlmError) {
      return GestureDetector(
        onTap: onCollapse,
        child: Container(
          margin: const EdgeInsets.only(top: 10, bottom: 4),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: AppTheme.warning.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.warning.withValues(alpha: 0.25)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.error_outline_rounded,
                    color: AppTheme.warning,
                    size: 14,
                  ),
                  const SizedBox(width: 7),
                  Expanded(
                    child: Text(
                      _errorMessage,
                      style: const TextStyle(
                        color: AppTheme.warning,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        height: 1.35,
                      ),
                    ),
                  ),
                  Icon(
                    Icons.keyboard_arrow_up_rounded,
                    color: AppTheme.warning.withValues(alpha: 0.6),
                    size: 16,
                  ),
                ],
              ),
              if (r.summary.isNotEmpty) ...[
                const SizedBox(height: 8),
                const _SectionLabel('Resumen'),
                _BulletLine(r.summary, AppTheme.textSec),
              ],
              if (r.motivation.isNotEmpty) ...[
                const Divider(height: 16, color: Colors.white10),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
                  child: Text(
                    r.motivation,
                    style: TextStyle(
                      color: AppTheme.warning.withValues(alpha: 0.75),
                      fontSize: 10,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),
              ] else
                const SizedBox(height: 10),
            ],
          ),
        ),
      );
    }

    return GestureDetector(
      onTap: onCollapse,
      child: Container(
        margin: const EdgeInsets.only(top: 10, bottom: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ──────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
              child: Row(
                children: [
                  Icon(Icons.auto_awesome_rounded, color: color, size: 14),
                  const SizedBox(width: 7),
                  Expanded(
                    child: Text(
                      r.summary,
                      style: TextStyle(
                        color: color,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        height: 1.35,
                      ),
                    ),
                  ),
                  Icon(
                    Icons.keyboard_arrow_up_rounded,
                    color: color.withValues(alpha: 0.6),
                    size: 16,
                  ),
                ],
              ),
            ),

            // ── Warnings (amber) ─────────────────────────────────────────────
            if (r.warnings.isNotEmpty) ...[
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Column(
                  children: r.warnings
                      .map(
                        (w) => _Chip(
                          text: w,
                          icon: Icons.warning_amber_rounded,
                          color: AppTheme.warning,
                        ),
                      )
                      .toList(),
                ),
              ),
            ],

            // ── Insights ─────────────────────────────────────────────────────
            if (r.insights.isNotEmpty) ...[
              const SizedBox(height: 8),
              const _SectionLabel('Observaciones'),
              ...r.insights.map((i) => _BulletLine(i, AppTheme.textSec)),
            ],

            // ── Recommendations ───────────────────────────────────────────────
            if (r.recommendations.isNotEmpty) ...[
              const SizedBox(height: 6),
              const _SectionLabel('Recomendaciones'),
              ...r.recommendations.map((rec) => _BulletLine(rec, color)),
            ],

            // ── Motivation footer ─────────────────────────────────────────────
            if (r.motivation.isNotEmpty) ...[
              const Divider(height: 16, color: Colors.white10),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
                child: Text(
                  r.motivation,
                  style: TextStyle(
                    color: color.withValues(alpha: 0.75),
                    fontSize: 10,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            ] else
              const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(12, 0, 12, 2),
    child: Text(
      text.toUpperCase(),
      style: const TextStyle(
        color: AppTheme.textMuted,
        fontSize: 9,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.8,
      ),
    ),
  );
}

class _BulletLine extends StatelessWidget {
  final String text;
  final Color color;
  const _BulletLine(this.text, this.color);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(12, 2, 12, 2),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('• ', style: TextStyle(color: color, fontSize: 11)),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: AppTheme.textSec,
              fontSize: 11,
              height: 1.4,
            ),
          ),
        ),
      ],
    ),
  );
}

class _Chip extends StatelessWidget {
  final String text;
  final IconData icon;
  final Color color;
  const _Chip({required this.text, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 4),
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: color.withValues(alpha: 0.3)),
    ),
    child: Row(
      children: [
        Icon(icon, color: color, size: 11),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    ),
  );
}

// ── Shared loading shimmer ────────────────────────────────────────────────────

class _LoadingBanner extends StatelessWidget {
  final String label;
  const _LoadingBanner({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
          margin: const EdgeInsets.only(top: 10, bottom: 4),
          height: 40,
          decoration: BoxDecoration(
            color: AppTheme.bgElevated,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppTheme.border),
          ),
          child: Row(
            children: [
              const SizedBox(width: 12),
              const SizedBox(
                width: 12,
                height: 12,
                child: CircularProgressIndicator(
                  strokeWidth: 1.5,
                  color: AppTheme.textMuted,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                label,
                style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
              ),
            ],
          ),
        )
        .animate(onPlay: (c) => c.repeat(reverse: true))
        .shimmer(
          color: AppTheme.textMuted.withValues(alpha: 0.05),
          duration: 1200.ms,
        );
  }
}
