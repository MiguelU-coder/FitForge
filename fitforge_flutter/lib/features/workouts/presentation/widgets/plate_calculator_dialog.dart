// lib/features/workouts/presentation/widgets/plate_calculator_dialog.dart
import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class PlateCalculatorDialog extends StatefulWidget {
  final double targetWeight;
  const PlateCalculatorDialog({super.key, required this.targetWeight});

  @override
  State<PlateCalculatorDialog> createState() => _PlateCalculatorDialogState();
}

class _PlateCalculatorDialogState extends State<PlateCalculatorDialog> {
  late TextEditingController _ctrl;
  double _barWeight = 20.0; // Standard Olympic bar

  // Available plates (kg) — most commercial gyms
  static const _plates = [25.0, 20.0, 15.0, 10.0, 5.0, 2.5, 1.25];

  // Plate colors (matching gym convention)
  static final _plateColors = {
    25.0: const Color(0xFFE53935), // Red
    20.0: const Color(0xFF1E88E5), // Blue
    15.0: const Color(0xFFFFB300), // Yellow
    10.0: const Color(0xFF43A047), // Green
    5.0: const Color(0xFFFFFFFF), // White
    2.5: const Color(0xFF9E9E9E), // Grey
    1.25: const Color(0xFFFFD700), // Chrome/Gold
  };

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(
      text: widget.targetWeight > 0
          ? widget.targetWeight.toStringAsFixed(1)
          : '',
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  // ── Calculation ────────────────────────────────────────────────────────────
  Map<double, int> _calculate(double totalWeight) {
    final perSide = (totalWeight - _barWeight) / 2;
    if (perSide <= 0) return {};

    final result = <double, int>{};
    var remaining = perSide;

    for (final plate in _plates) {
      if (remaining <= 0) break;
      final count = remaining ~/ plate;
      if (count > 0) {
        result[plate] = count;
        remaining -= count * plate;
      }
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    final totalStr = _ctrl.text.replaceAll(',', '.');
    final total = double.tryParse(totalStr) ?? 0;
    final plates = _calculate(total);
    final perSide = math.max(0.0, (total - _barWeight) / 2);
    final possible =
        plates.entries.fold<double>(0, (s, e) => s + e.key * e.value) * 2 +
        _barWeight;

    return Dialog(
      child: Container(
        padding: const EdgeInsets.all(24),
        constraints: const BoxConstraints(maxWidth: 360),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                const Text('🏋️', style: TextStyle(fontSize: 22)),
                const SizedBox(width: 10),
                const Text(
                  'Plate Calculator',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: const Icon(
                    Icons.close,
                    color: AppTheme.textSec,
                    size: 20,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Bar selector
            Row(
              children: [
                const Text(
                  'Bar:',
                  style: TextStyle(color: AppTheme.textSec, fontSize: 13),
                ),
                const SizedBox(width: 12),
                ...[15.0, 20.0].map(
                  (w) => GestureDetector(
                    onTap: () => setState(() => _barWeight = w),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: _barWeight == w
                            ? AppTheme.neon.withValues(alpha: 0.15)
                            : AppTheme.bgElevated,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: _barWeight == w
                              ? AppTheme.neon.withValues(alpha: 0.6)
                              : AppTheme.border,
                        ),
                      ),
                      child: Text(
                        '${w.toStringAsFixed(0)}kg',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: _barWeight == w
                              ? AppTheme.neon
                              : AppTheme.textSec,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Weight input
            TextField(
              controller: _ctrl,
              autofocus: true,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: AppTheme.textPri,
              ),
              decoration: const InputDecoration(
                hintText: '100',
                suffixText: 'kg',
                suffixStyle: TextStyle(color: AppTheme.textSec, fontSize: 16),
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 4),
            Text(
              'Per side: ${perSide.toStringAsFixed(2)} kg',
              style: const TextStyle(color: AppTheme.textSec, fontSize: 12),
            ),
            const SizedBox(height: 20),

            // Bar visual
            if (plates.isNotEmpty) ...[
              _BarVisual(plates: plates, barWeight: _barWeight),
              const SizedBox(height: 16),
            ],

            // Plate list
            if (plates.isEmpty && total > 0)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.error.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  total <= _barWeight
                      ? 'Weight is less than or equal to bar weight (${_barWeight.toStringAsFixed(0)}kg)'
                      : 'Cannot make exact weight — closest: ${possible.toStringAsFixed(2)}kg',
                  style: const TextStyle(color: AppTheme.error, fontSize: 13),
                ),
              )
            else if (plates.isNotEmpty)
              Container(
                decoration: AppTheme.glassCard(),
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    // Header
                    const Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Plate',
                            style: TextStyle(
                              color: AppTheme.textMuted,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        SizedBox(
                          width: 60,
                          child: Text(
                            'Each side',
                            style: TextStyle(
                              color: AppTheme.textMuted,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                        SizedBox(
                          width: 60,
                          child: Text(
                            'Total',
                            style: TextStyle(
                              color: AppTheme.textMuted,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                            textAlign: TextAlign.right,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 12),

                    // Plate rows
                    ...plates.entries.map(
                      (e) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 5),
                        child: Row(
                          children: [
                            // Color indicator
                            Container(
                              width: 14,
                              height: 14,
                              margin: const EdgeInsets.only(right: 8),
                              decoration: BoxDecoration(
                                color: _plateColors[e.key] ?? AppTheme.textSec,
                                borderRadius: BorderRadius.circular(3),
                              ),
                            ),
                            Expanded(
                              child: Text(
                                '${e.key.toStringAsFixed(e.key == e.key.roundToDouble() ? 0 : 2)} kg',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.textPri,
                                ),
                              ),
                            ),
                            SizedBox(
                              width: 60,
                              child: Text(
                                '× ${e.value}',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: AppTheme.neon,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            SizedBox(
                              width: 60,
                              child: Text(
                                '${(e.key * e.value * 2).toStringAsFixed(1)} kg',
                                textAlign: TextAlign.right,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppTheme.textSec,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const Divider(height: 12),

                    // Total
                    Row(
                      children: [
                        const Expanded(
                          child: Text(
                            'Total on bar',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                        Text(
                          '${possible.toStringAsFixed(2)} kg',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.neon,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 16),

            // Quick set buttons
            const Text(
              'QUICK SELECT',
              style: TextStyle(
                color: AppTheme.textMuted,
                fontSize: 10,
                fontWeight: FontWeight.w700,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [20.0, 40.0, 60.0, 80.0, 100.0, 120.0, 140.0]
                  .map(
                    (w) => GestureDetector(
                      onTap: () =>
                          setState(() => _ctrl.text = w.toStringAsFixed(1)),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.bgElevated,
                          borderRadius: BorderRadius.circular(7),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Text(
                          w.toStringAsFixed(0),
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textSec,
                          ),
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Barbell visual representation ─────────────────────────────────────────────
class _BarVisual extends StatelessWidget {
  final Map<double, int> plates;
  final double barWeight;

  const _BarVisual({required this.plates, required this.barWeight});

  static final _plateColors = {
    25.0: const Color(0xFFE53935),
    20.0: const Color(0xFF1E88E5),
    15.0: const Color(0xFFFFB300),
    10.0: const Color(0xFF43A047),
    5.0: const Color(0xFFEEEEEE),
    2.5: const Color(0xFF9E9E9E),
    1.25: const Color(0xFFFFD700),
  };

  // Plate width in the visual (proportional to weight)
  double _plateWidth(double kg) => math.max(8.0, kg * 1.5);

  @override
  Widget build(BuildContext context) {
    final plateList = plates.entries
        .expand((e) => List.filled(e.value, e.key))
        .toList();

    return SizedBox(
      height: 52,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Left sleeve
          Container(width: 8, height: 10, color: Colors.grey.shade600),

          // Plates (left side, reversed)
          ...plateList.reversed.map(
            (kg) => Container(
              width: _plateWidth(kg),
              height: 36 + kg * 0.4,
              margin: const EdgeInsets.symmetric(horizontal: 1),
              decoration: BoxDecoration(
                color: _plateColors[kg] ?? AppTheme.textSec,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Bar sleeve
          Container(
            width: 40,
            height: 10,
            decoration: BoxDecoration(
              color: Colors.grey.shade500,
              borderRadius: BorderRadius.circular(2),
            ),
            child: Center(
              child: Text(
                barWeight.toStringAsFixed(0),
                style: const TextStyle(
                  fontSize: 8,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          ),

          // Plates (right side)
          ...plateList.map(
            (kg) => Container(
              width: _plateWidth(kg),
              height: 36 + kg * 0.4,
              margin: const EdgeInsets.symmetric(horizontal: 1),
              decoration: BoxDecoration(
                color: _plateColors[kg] ?? AppTheme.textSec,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Right sleeve
          Container(width: 8, height: 10, color: Colors.grey.shade600),
        ],
      ),
    );
  }
}
