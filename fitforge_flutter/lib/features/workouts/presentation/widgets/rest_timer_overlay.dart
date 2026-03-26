// lib/features/workouts/presentation/widgets/rest_timer_overlay.dart
import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class RestTimerOverlay extends StatefulWidget {
  final int initialSeconds;
  final VoidCallback onDismiss;
  final void Function(int) onSetDuration;

  const RestTimerOverlay({
    super.key,
    required this.initialSeconds,
    required this.onDismiss,
    required this.onSetDuration,
  });

  @override
  State<RestTimerOverlay> createState() => _RestTimerOverlayState();
}

class _RestTimerOverlayState extends State<RestTimerOverlay>
    with SingleTickerProviderStateMixin {
  late int _remaining;
  late int _total;
  Timer? _timer;
  late AnimationController _slideCtrl;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _remaining = _total = widget.initialSeconds;

    _slideCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 1),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _slideCtrl, curve: Curves.easeOutCubic));
    _slideCtrl.forward();

    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _slideCtrl.dispose();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_remaining <= 0) {
        _timer?.cancel();
        // Dismiss after brief show of "0:00"
        Future.delayed(const Duration(milliseconds: 600), () {
          if (mounted) widget.onDismiss();
        });
        return;
      }
      setState(() => _remaining--);
    });
  }

  void _addTime(int seconds) {
    setState(() => _remaining = (_remaining + seconds).clamp(0, 600));
    if (_remaining > 0) _startTimer();
  }

  String get _display {
    final m = _remaining ~/ 60;
    final s = _remaining % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  double get _progress => _total > 0 ? (_total - _remaining) / _total : 1.0;

  bool get _isLow => _remaining <= 10 && _remaining > 0;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: MediaQuery.of(context).padding.bottom + 80,
      left: 16,
      right: 16,
      child: SlideTransition(
        position: _slideAnim,
        child: Material(
          color: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: AppTheme.bgCard,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: _isLow
                    ? AppTheme.error.withValues(alpha: 0.5)
                    : AppTheme.neon.withValues(alpha: 0.3),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: _isLow
                      ? AppTheme.error.withValues(alpha: 0.1)
                      : AppTheme.neon.withValues(alpha: 0.08),
                  blurRadius: 24,
                  spreadRadius: 0,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header
                Row(
                  children: [
                    Icon(
                      Icons.timer_outlined,
                      color: _isLow ? AppTheme.error : AppTheme.neon,
                      size: 16,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'REST TIMER',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.5,
                        color: _isLow ? AppTheme.error : AppTheme.neon,
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: widget.onDismiss,
                      child: const Icon(
                        Icons.close,
                        color: AppTheme.textMuted,
                        size: 18,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Progress bar
                ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: LinearProgressIndicator(
                    value: 1 - _progress,
                    minHeight: 3,
                    backgroundColor: AppTheme.border,
                    color: _isLow ? AppTheme.error : AppTheme.neon,
                  ),
                ),
                const SizedBox(height: 14),

                // Timer display
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _display,
                      style: TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -2,
                        color: _isLow ? AppTheme.error : AppTheme.textPri,
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Adjust buttons
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _AdjustButton(label: '-15s', onTap: () => _addTime(-15)),
                    const SizedBox(width: 12),
                    _AdjustButton(
                      label: '+30s',
                      onTap: () => _addTime(30),
                      accent: true,
                    ),
                    const SizedBox(width: 12),
                    _AdjustButton(label: '+60s', onTap: () => _addTime(60)),
                    const Spacer(),
                    // Skip button
                    GestureDetector(
                      onTap: widget.onDismiss,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.bgElevated,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: const Text(
                          'Skip',
                          style: TextStyle(
                            color: AppTheme.textSec,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
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

class _AdjustButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final bool accent;

  const _AdjustButton({
    required this.label,
    required this.onTap,
    this.accent = false,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: accent
            ? AppTheme.neon.withValues(alpha: 0.12)
            : AppTheme.bgElevated,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: accent
              ? AppTheme.neon.withValues(alpha: 0.4)
              : AppTheme.border,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: accent ? AppTheme.neon : AppTheme.textSec,
        ),
      ),
    ),
  );
}
