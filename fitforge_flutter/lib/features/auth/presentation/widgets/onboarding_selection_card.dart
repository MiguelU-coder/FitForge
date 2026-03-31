// lib/features/auth/presentation/widgets/onboarding_selection_card.dart
import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class OnboardingSelectionCard extends StatefulWidget {
  final String title;
  final String? subtitle;
  final IconData? icon;
  final bool isSelected;
  final VoidCallback onTap;

  const OnboardingSelectionCard({
    super.key,
    required this.title,
    this.subtitle,
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
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              decoration: BoxDecoration(
                color: widget.isSelected
                    ? AppTheme.neon.withValues(alpha: 0.1)
                    : AppTheme.bgCard,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: widget.isSelected
                      ? AppTheme.neon
                      : AppTheme.border.withValues(alpha: 0.4),
                  width: widget.isSelected ? 1.5 : 1,
                ),
                boxShadow: widget.isSelected
                    ? [
                        BoxShadow(
                          color: AppTheme.neon.withValues(alpha: 0.08),
                          blurRadius: 20,
                          spreadRadius: 0,
                          offset: const Offset(0, 8),
                        ),
                      ]
                    : null,
              ),
              child: Row(
                children: [
                  if (widget.icon != null) ...[
                    _AnimatedIconWidget(
                      icon: widget.icon!,
                      isSelected: widget.isSelected,
                      pulseValue: _pulseAnimation.value,
                    ),
                    const SizedBox(width: 16),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.title,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: widget.isSelected
                                ? AppTheme.neon
                                : AppTheme.textPri,
                            letterSpacing: -0.3,
                          ),
                        ),
                        if (widget.subtitle != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            widget.subtitle!,
                            style: TextStyle(
                              fontSize: 12,
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
                    Icon(
                      Icons.circle_outlined,
                      color: AppTheme.border.withValues(alpha: 0.8),
                      size: 20,
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
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: isSelected
            ? AppTheme.neon.withValues(alpha: 0.15)
            : AppTheme.bgElevated.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(
        icon,
        size: 18,
        color: isSelected ? AppTheme.neon : AppTheme.textSec.withValues(alpha: 0.6),
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
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: AppTheme.neon,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: AppTheme.neon.withValues(alpha: 0.3 + (0.3 * pulseValue)),
            blurRadius: 6 + (6 * pulseValue),
          ),
        ],
      ),
      child: const Icon(Icons.check, color: Colors.white, size: 16),
    );
  }
}