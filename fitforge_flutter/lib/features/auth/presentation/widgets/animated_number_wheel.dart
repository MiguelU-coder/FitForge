// lib/features/auth/presentation/widgets/animated_number_wheel.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/theme/app_theme.dart';

class AnimatedNumberWheel extends StatefulWidget {
  final int minValue;
  final int maxValue;
  final double initialValue;
  final ValueChanged<double> onChanged;
  final String suffix;
  final bool isDecimal;

  const AnimatedNumberWheel({
    super.key,
    required this.minValue,
    required this.maxValue,
    required this.initialValue,
    required this.onChanged,
    required this.suffix,
    this.isDecimal = false,
  });

  @override
  State<AnimatedNumberWheel> createState() => _AnimatedNumberWheelState();
}

class _AnimatedNumberWheelState extends State<AnimatedNumberWheel> {
  late FixedExtentScrollController _scrollController;
  late int _currentIndex;

  // The total number of items depends on whether we are using decimals (.5 steps) or integers
  late int _itemCount;

  @override
  void initState() {
    super.initState();

    if (widget.isDecimal) {
      // e.g., 30.0 to 150.0 in 0.5 steps = (150 - 30) * 2 + 1 items
      _itemCount = ((widget.maxValue - widget.minValue) * 2) + 1;
      _currentIndex = ((widget.initialValue - widget.minValue) * 2).round();
    } else {
      _itemCount = widget.maxValue - widget.minValue + 1;
      _currentIndex = widget.initialValue.round() - widget.minValue;
    }

    // Safety clamp
    _currentIndex = _currentIndex.clamp(0, _itemCount - 1);

    _scrollController = FixedExtentScrollController(initialItem: _currentIndex);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  double _indexToValue(int index) {
    if (widget.isDecimal) {
      return widget.minValue + (index * 0.5);
    } else {
      return (widget.minValue + index).toDouble();
    }
  }

  String _formatValue(double value) {
    if (widget.isDecimal) {
      return value.toStringAsFixed(1);
    } else {
      return value.toInt().toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 300,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // The selected item background and side indicator
          Center(
            child: Container(
              height: 100,
              width: 140,
              decoration: BoxDecoration(
                color: AppTheme.bgElevated.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Stack(
                children: [
                  // The green vertical line with a dot indicator just like the screenshot
                  Positioned(
                    right: 12,
                    top: 10,
                    bottom: 10,
                    child: Container(
                      width: 2,
                      decoration: BoxDecoration(
                        color: AppTheme.neon.withValues(alpha: 0.5),
                      ),
                    ),
                  ),
                  Positioned(
                    right: 8,
                    top: 45, // center vertically in a 100 height container
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: AppTheme.neon,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // The scrolling wheel
          ListWheelScrollView.useDelegate(
            controller: _scrollController,
            itemExtent: 70, // Height of each item
            perspective: 0.003,
            diameterRatio: 1.5,
            physics: const FixedExtentScrollPhysics(),
            onSelectedItemChanged: (index) {
              HapticFeedback.lightImpact();
              setState(() {
                _currentIndex = index;
              });
              widget.onChanged(_indexToValue(index));
            },
            childDelegate: ListWheelChildBuilderDelegate(
              childCount: _itemCount,
              builder: (context, index) {
                final isSelected = index == _currentIndex;
                final value = _indexToValue(index);

                return Center(
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          _formatValue(value),
                          style: TextStyle(
                            fontSize: isSelected ? 64 : 40,
                            fontWeight: isSelected
                                ? FontWeight.w800
                                : FontWeight.w600,
                            color: isSelected
                                ? Colors.white
                                : Colors.white.withValues(alpha: 0.3),
                            letterSpacing: -1,
                          ),
                        ),
                        if (isSelected) ...[
                          const SizedBox(width: 8),
                          Text(
                            widget.suffix,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w600,
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ],
                    ),
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
