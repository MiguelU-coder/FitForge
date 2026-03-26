// lib/features/auth/presentation/widgets/onboarding_selection_card.dart
import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class OnboardingSelectionCard extends StatefulWidget {
  final String title;
  final String? subtitle;
  final String? emoji;
  final IconData? icon;
  final bool isSelected;
  final VoidCallback onTap;

  const OnboardingSelectionCard({
    super.key,
    required this.title,
    this.subtitle,
    this.emoji,
    this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<OnboardingSelectionCard> createState() =>
      _OnboardingSelectionCardState();
}

class _OnboardingSelectionCardState extends State<OnboardingSelectionCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.02,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));

    _pulseAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));

    if (widget.isSelected) {
      _controller.forward();
    }
  }

  @override
  void didUpdateWidget(OnboardingSelectionCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isSelected && !oldWidget.isSelected) {
      _controller.forward();
    } else if (!widget.isSelected && oldWidget.isSelected) {
      _controller.reverse();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: GestureDetector(
            onTap: widget.onTap,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: widget.isSelected
                    ? AppTheme.neon.withValues(alpha: 0.15)
                    : AppTheme.bgElevated.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: widget.isSelected
                      ? AppTheme.neon
                      : AppTheme.border.withValues(alpha: 0.5),
                  width: widget.isSelected ? 2 : 1.5,
                ),
                boxShadow: widget.isSelected
                    ? [
                        BoxShadow(
                          color: AppTheme.neon.withValues(alpha: 0.3),
                          blurRadius: 20,
                          spreadRadius: 2,
                        ),
                      ]
                    : null,
              ),
              child: Row(
                children: [
                  // Icon container - supports both emoji (deprecated) and icon
                  if (widget.icon != null) ...[
                    _AnimatedIconWidget(
                      icon: widget.icon!,
                      isSelected: widget.isSelected,
                      pulseValue: _pulseAnimation.value,
                    ),
                    const SizedBox(width: 20),
                  ] else if (widget.emoji != null) ...[
                    _AnimatedEmoji(
                      emoji: widget.emoji!,
                      isSelected: widget.isSelected,
                      pulseValue: _pulseAnimation.value,
                    ),
                    const SizedBox(width: 20),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.title,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: widget.isSelected
                                ? AppTheme.neon
                                : AppTheme.textPri,
                          ),
                        ),
                        if (widget.subtitle != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            widget.subtitle!,
                            style: TextStyle(
                              fontSize: 14,
                              color: widget.isSelected
                                  ? AppTheme.neon.withValues(alpha: 0.7)
                                  : AppTheme.textSec,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (widget.isSelected)
                    _AnimatedCheckIcon(pulseValue: _pulseAnimation.value)
                  else
                    const Icon(
                      Icons.circle_outlined,
                      color: AppTheme.border,
                      size: 24,
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _AnimatedIconWidget extends StatelessWidget {
  final IconData icon;
  final bool isSelected;
  final double pulseValue;

  const _AnimatedIconWidget({
    required this.icon,
    required this.isSelected,
    required this.pulseValue,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: isSelected ? 48 : 40,
      height: isSelected ? 48 : 40,
      decoration: BoxDecoration(
        color: isSelected
            ? AppTheme.neon.withValues(alpha: 0.2)
            : AppTheme.bgElevated.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        boxShadow: isSelected
            ? [
                BoxShadow(
                  color: AppTheme.neon.withValues(alpha: 0.3 * pulseValue),
                  blurRadius: 10 + (10 * pulseValue),
                ),
              ]
            : null,
      ),
      child: Icon(
        icon,
        size: isSelected ? 24 : 20,
        color: isSelected ? AppTheme.neon : AppTheme.textSec,
      ),
    );
  }
}

class _AnimatedEmoji extends StatelessWidget {
  final String emoji;
  final bool isSelected;
  final double pulseValue;

  const _AnimatedEmoji({
    required this.emoji,
    required this.isSelected,
    required this.pulseValue,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: isSelected ? 48 : 40,
      height: isSelected ? 48 : 40,
      decoration: BoxDecoration(
        color: isSelected
            ? AppTheme.neon.withValues(alpha: 0.2)
            : AppTheme.bgElevated.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        boxShadow: isSelected
            ? [
                BoxShadow(
                  color: AppTheme.neon.withValues(alpha: 0.3 * pulseValue),
                  blurRadius: 10 + (10 * pulseValue),
                ),
              ]
            : null,
      ),
      child: Center(
        child: Text(emoji, style: TextStyle(fontSize: isSelected ? 24 : 20)),
      ),
    );
  }
}

class _AnimatedCheckIcon extends StatelessWidget {
  final double pulseValue;

  const _AnimatedCheckIcon({required this.pulseValue});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: AppTheme.neon,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: AppTheme.neon.withValues(alpha: 0.4 + (0.3 * pulseValue)),
            blurRadius: 8 + (8 * pulseValue),
            spreadRadius: 1 + pulseValue,
          ),
        ],
      ),
      child: const Icon(Icons.check, color: Colors.black, size: 18),
    );
  }
}