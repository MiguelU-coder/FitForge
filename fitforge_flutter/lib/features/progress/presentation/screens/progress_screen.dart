// lib/features/progress/presentation/screens/progress_screen.dart
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/ff_widgets.dart';
import '../providers/body_metrics_provider.dart';
import '../providers/volume_history_provider.dart';
import '../widgets/muscle_heatmap.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/body_metric_model.dart' as model;

// Safe numeric parse: Prisma Decimal fields arrive as String from JSON.
double _toDouble(dynamic v) {
  if (v == null) return 0.0;
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v) ?? 0.0;
  return 0.0;
}

int _toInt(dynamic v) {
  if (v == null) return 0;
  if (v is int) return v;
  if (v is num) return v.toInt();
  if (v is String) return int.tryParse(v) ?? 0;
  return 0;
}

class PersonalRecord {
  final String exerciseName, prType;
  final double value;
  final DateTime achievedAt;
  const PersonalRecord({
    required this.exerciseName,
    required this.prType,
    required this.value,
    required this.achievedAt,
  });
  factory PersonalRecord.fromJson(Map<String, dynamic> j) {
    final ex = j['exercise'] as Map<String, dynamic>?;
    return PersonalRecord(
      exerciseName: ex?['name'] as String? ?? 'Unknown',
      prType: j['prType'] as String,
      value: _toDouble(j['value']),
      achievedAt: DateTime.parse(j['achievedAt'] as String),
    );
  }
}

class WeeklyVolume {
  final String muscleGroup, weekStart;
  final int totalSets;
  final double totalVolumeKg;
  final String? status;
  const WeeklyVolume({
    required this.muscleGroup,
    required this.weekStart,
    required this.totalSets,
    required this.totalVolumeKg,
    this.status,
  });
  factory WeeklyVolume.fromJson(Map<String, dynamic> j) => WeeklyVolume(
    muscleGroup: j['muscleGroup'] as String,
    weekStart: j['weekStart'] as String,
    totalSets: _toInt(j['totalSets']),
    totalVolumeKg: _toDouble(j['totalVolumeKg']),
    status: j['status'] as String?,
  );
}

final prsProvider = FutureProvider.autoDispose<List<PersonalRecord>>((
  ref,
) async {
  final data = await ref
      .read(apiClientProvider)
      .get<List<dynamic>>('/progress/prs');
  return data
      .map((e) => PersonalRecord.fromJson(e as Map<String, dynamic>))
      .toList();
});

final volumeProvider = FutureProvider.autoDispose<List<WeeklyVolume>>((
  ref,
) async {
  final data = await ref
      .read(apiClientProvider)
      .get<List<dynamic>>('/progress/volume/current');
  return data
      .map((e) => WeeklyVolume.fromJson(e as Map<String, dynamic>))
      .toList();
});

class ProgressScreen extends ConsumerStatefulWidget {
  const ProgressScreen({super.key});
  @override
  ConsumerState<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends ConsumerState<ProgressScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: Text(
          'DASHBOARD',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.w800,
            fontSize: 20,
            letterSpacing: 0.5,
            color: AppColors.textPrimary,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 22),
            onPressed: () {
              ref.invalidate(prsProvider);
              ref.invalidate(volumeProvider);
              ref.invalidate(bodyMetricsProvider);
            },
          ),
          const SizedBox(width: 8),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: false,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelColor: AppColors.textPrimary,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: GoogleFonts.inter(
            fontWeight: FontWeight.w700,
            fontSize: 12,
            letterSpacing: 1.2,
          ),
          indicatorSize: TabBarIndicatorSize.label,
          tabs: const [
            Tab(text: 'PERFORMANCE'),
            Tab(text: 'PHYSICAL'),
            Tab(text: 'AWARDS'),
          ],
        ),
      ),
      floatingActionButton: _tabController.index == 1
          ? FloatingActionButton.extended(
              onPressed: () => _showAddMetricSheet(context, ref),
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.black,
              icon: const Icon(Icons.add_rounded),
              label: Text(
                'REGISTER',
                style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 13),
              ),
            )
          : null,
      body: TabBarView(
        controller: _tabController,
        children: [
          _PerformanceTab(),
          _PhysicalTab(),
          _AwardsTab(),
        ],
      ),
    );
  }
}

class _PerformanceTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      children: [
        const SectionHeader(
          title: 'Current Week Volume',
          icon: Icons.bar_chart_rounded,
        ),
        const SizedBox(height: 16),
        ref.watch(volumeProvider).when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Error: $e')),
          data: (vols) {
            if (vols.isEmpty) {
              return const EmptyState(
                icon: Icons.fitness_center,
                title: 'No volume data',
                subtitle: 'Start a workout to track your volume',
              );
            }
            
            // Map volumes to status for heatmap
            final statusMap = {
              for (var v in vols) v.muscleGroup: v.status ?? 'under_mev'
            };

            return Column(
              children: [
                MuscleHeatmap(muscleStatus: statusMap),
                const SizedBox(height: 32),
                _VolumeChart(volumes: vols),
              ],
            );
          },
        ),
        const SizedBox(height: 32),
        const SectionHeader(
          title: 'Total Sets Trend',
          icon: Icons.trending_up_rounded,
        ),
        const SizedBox(height: 16),
        ref.watch(volumeHistoryProvider).when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Error: $e')),
          data: (history) => history.isEmpty
              ? const _PlaceholderChart(label: 'Not enough historical data')
              : _TotalVolumeChart(history: history),
        ),
      ],
    );
  }
}

class _PhysicalTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    final user = auth.user;

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      children: [
        _MetricHeader(
          heightCm: user?.heightCm,
          goalWeight: user?.goalWeightKg,
        ),
        const SizedBox(height: 24),
        const SectionHeader(
          title: 'Weight & Body Fat',
          icon: Icons.monitor_weight_rounded,
        ),
        const SizedBox(height: 16),
        ref.watch(bodyMetricsProvider).when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Error: $e')),
          data: (metrics) => metrics.isEmpty
              ? const EmptyState(
                  icon: Icons.history,
                  title: 'No metrics recorded',
                  subtitle: 'Add your weight in Profile to see progress',
                )
              : _BodyMetricsChart(metrics: metrics),
        ),
        const SizedBox(height: 16),
        ref.watch(bodyMetricsProvider).when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => const SizedBox(),
          data: (metrics) {
            final fatMetrics = metrics.where((m) => m.bodyFatPct != null).toList();
            if (fatMetrics.isEmpty) return const SizedBox();
            return Column(
              children: [
                const SizedBox(height: 32),
                const SectionHeader(
                  title: 'Body Fat Trend (%)',
                  icon: Icons.percent_rounded,
                ),
                const SizedBox(height: 16),
                _BodyFatChart(metrics: fatMetrics),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _AwardsTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ref.watch(prsProvider).when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (prs) => prs.isEmpty
          ? const EmptyState(
              icon: Icons.emoji_events_rounded,
              title: 'No awards yet',
              subtitle: 'Hit new personal records to see them here',
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: prs.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (ctx, i) => _PrCard(pr: prs[i]),
            ),
    );
  }
}

class _PlaceholderChart extends StatelessWidget {
  final String label;
  const _PlaceholderChart({required this.label});
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 150,
      child: GlassCard(
        child: Center(
          child: Text(
            label,
            style: GoogleFonts.inter(
              color: AppColors.textMuted,
              fontSize: 12,
              fontStyle: FontStyle.italic,
            ),
          ),
        ),
      ),
    );
  }
}

class _BodyMetricsChart extends StatelessWidget {
  final List<model.BodyMetric> metrics;
  const _BodyMetricsChart({required this.metrics});

  @override
  Widget build(BuildContext context) {
    // Only use metrics that have weight
    final weightMetrics = metrics.where((m) => m.weightKg != null).toList();
    if (weightMetrics.isEmpty) {
      return const _PlaceholderChart(label: 'Insufficient weight data');
    }

    final minWt = weightMetrics.map((e) => e.weightKg!).reduce((a, b) => a < b ? a : b);
    final maxWt = weightMetrics.map((e) => e.weightKg!).reduce((a, b) => a > b ? a : b);
    final range = maxWt - minWt;
    final padding = range == 0 ? 5.0 : range * 0.2;

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'WEIGHT TREND (KG)',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textSecondary,
                  letterSpacing: 1.5,
                ),
              ),
              if (weightMetrics.length >= 2)
                _TrendBadge(
                  start: weightMetrics.first.weightKg!,
                  end: weightMetrics.last.weightKg!,
                ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 180,
            child: LineChart(
              LineChartData(
                minY: minWt - padding,
                maxY: maxWt + padding,
                lineBarsData: [
                  LineChartBarData(
                    spots: weightMetrics.asMap().entries.map((e) {
                      return FlSpot(e.key.toDouble(), e.value.weightKg!);
                    }).toList(),
                    isCurved: true,
                    color: AppColors.primary,
                    barWidth: 4,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: true),
                    belowBarData: BarAreaData(
                      show: true,
                      color: AppColors.primary.withValues(alpha: 0.1),
                    ),
                  ),
                ],
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 22,
                      interval: 1, // Show label for every point in simple trend
                      getTitlesWidget: (v, _) {
                        final i = v.toInt();
                        if (i < 0 || i >= weightMetrics.length) return const SizedBox();
                        final date = weightMetrics[i].recordedAt;
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            '${date.day}/${date.month}',
                            style: const TextStyle(fontSize: 8, color: AppColors.textMuted),
                          ),
                        );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      getTitlesWidget: (v, _) => Text(
                        v.toStringAsFixed(1),
                        style: GoogleFonts.barlow(
                          fontSize: 10,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  topTitles: const AxisTitles(sideTitles: SideTitles()),
                  rightTitles: const AxisTitles(sideTitles: SideTitles()),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (_) => const FlLine(
                    color: AppColors.border,
                    strokeWidth: 0.5,
                  ),
                ),
                borderData: FlBorderData(show: false),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Showing last ${weightMetrics.length} measurements',
            style: GoogleFonts.inter(
              fontSize: 10,
              color: AppColors.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _TrendBadge extends StatelessWidget {
  final double start, end;
  const _TrendBadge({required this.start, required this.end});

  @override
  Widget build(BuildContext context) {
    final diff = end - start;
    final isDown = diff < 0;
    final color = isDown ? const Color(0xFF00E676) : const Color(0xFFFF5252);
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isDown ? Icons.south_west_rounded : Icons.north_east_rounded,
            size: 12,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            '${diff.abs().toStringAsFixed(1)} kg',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _VolumeChart extends StatelessWidget {
  final List<WeeklyVolume> volumes;
  const _VolumeChart({required this.volumes});

  Color _statusColor(String? s) => switch (s) {
    'under_mev' => AppColors.warning,
    'optimal' => AppColors.primary,
    'over_mrv' => AppColors.error,
    _ => AppColors.textPrimary, // Default for non-recorded
  };

  @override
  Widget build(BuildContext context) {
    final sorted = [...volumes]
      ..sort((a, b) => b.totalSets.compareTo(a.totalSets));
    final top = sorted.take(8).toList();
    final maxY = top.isEmpty ? 10.0 : (top.first.totalSets + 5).toDouble();

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SETS PER MUSCLE',
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 180,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: maxY,
                barGroups: top
                    .asMap()
                    .entries
                    .map(
                      (e) => BarChartGroupData(
                        x: e.key,
                        barRods: [
                          BarChartRodData(
                            toY: e.value.totalSets.toDouble(),
                            color: _statusColor(e.value.status),
                            width: 18,
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(5),
                            ),
                          ),
                        ],
                      ),
                    )
                    .toList(),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (v, _) {
                        final i = v.toInt();
                        if (i >= top.length) return const SizedBox();
                          return Text(
                            top[i].muscleGroup.substring(0, 3),
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                          );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 28,
                      getTitlesWidget: (v, _) => Text(
                        v.toInt().toString(),
                        style: GoogleFonts.barlow(
                          fontSize: 10,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  topTitles: const AxisTitles(sideTitles: SideTitles()),
                  rightTitles: const AxisTitles(sideTitles: SideTitles()),
                ),
                borderData: FlBorderData(show: false),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 5,
                  getDrawingHorizontalLine: (_) =>
                      const FlLine(color: AppColors.border, strokeWidth: 0.5),
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          const Wrap(
            spacing: 12,
            runSpacing: 6,
            children: [
              _Legend(color: AppColors.warning, label: 'Under MEV'),
              _Legend(color: AppColors.primary, label: 'Optimal'),
              _Legend(color: AppColors.error, label: 'Over MRV'),
            ],
          ),
        ],
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  final Color color;
  final String label;
  const _Legend({required this.color, required this.label});
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        width: 8,
        height: 8,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ),
      const SizedBox(width: 5),
      Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w300,
          color: const Color(0xFF888888),
        ),
      ),
    ],
  );
}

class _TotalVolumeChart extends StatelessWidget {
  final List<WeeklyTotal> history;
  const _TotalVolumeChart({required this.history});

  @override
  Widget build(BuildContext context) {
    final maxSets = history.map((e) => e.totalSets).reduce((a, b) => a > b ? a : b);
    
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'WEEKLY TOTAL SETS',
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: AppColors.textSecondary,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 180,
            child: BarChart(
              BarChartData(
                maxY: maxSets.toDouble() + 5,
                barGroups: history.asMap().entries.map((e) {
                  return BarChartGroupData(
                    x: e.key,
                    barRods: [
                      BarChartRodData(
                        toY: e.value.totalSets.toDouble(),
                        color: AppColors.primary,
                        width: 14,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                      ),
                    ],
                  );
                }).toList(),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 22,
                      getTitlesWidget: (v, _) {
                        final i = v.toInt();
                        if (i >= history.length) return const SizedBox();
                        final date = history[i].weekStart;
                        // Return day/month
                        return Text(
                          '${date.day}/${date.month}',
                          style: const TextStyle(fontSize: 8, color: AppColors.textMuted),
                        );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 28,
                      getTitlesWidget: (v, _) => Text(
                        v.toInt().toString(),
                        style: GoogleFonts.barlow(fontSize: 10, color: AppColors.textSecondary),
                      ),
                    ),
                  ),
                  topTitles: const AxisTitles(sideTitles: SideTitles()),
                  rightTitles: const AxisTitles(sideTitles: SideTitles()),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (_) => const FlLine(color: AppColors.border, strokeWidth: 0.5),
                ),
                borderData: FlBorderData(show: false),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BodyFatChart extends StatelessWidget {
  final List<model.BodyMetric> metrics;
  const _BodyFatChart({required this.metrics});

  @override
  Widget build(BuildContext context) {
    final fatMetrics = metrics.where((m) => m.bodyFatPct != null).toList();
    if (fatMetrics.isEmpty) return const SizedBox();

    final values = fatMetrics.map((e) => e.bodyFatPct!).toList();
    final minVal = values.reduce((a, b) => a < b ? a : b);
    final maxVal = values.reduce((a, b) => a > b ? a : b);
    final range = maxVal - minVal;
    final padding = range == 0 ? 2.0 : range * 0.2;

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: 160,
            child: LineChart(
              LineChartData(
                minY: minVal - padding,
                maxY: maxVal + padding,
                lineBarsData: [
                  LineChartBarData(
                    spots: fatMetrics.asMap().entries.map((e) {
                      return FlSpot(e.key.toDouble(), e.value.bodyFatPct!);
                    }).toList(),
                    isCurved: true,
                    color: const Color(0xFF00B0FF),
                    barWidth: 3,
                    dotData: const FlDotData(show: true),
                    belowBarData: BarAreaData(
                      show: true,
                      color: const Color(0xFF00B0FF).withValues(alpha: 0.1),
                    ),
                  ),
                ],
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 22,
                      interval: 1,
                      getTitlesWidget: (v, _) {
                        final i = v.toInt();
                        if (i < 0 || i >= fatMetrics.length) return const SizedBox();
                        final date = fatMetrics[i].recordedAt;
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            '${date.day}/${date.month}',
                            style: const TextStyle(fontSize: 8, color: AppColors.textMuted),
                          ),
                        );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 32,
                      getTitlesWidget: (v, _) => Text(
                        '${v.toStringAsFixed(1)}%',
                        style: GoogleFonts.barlow(fontSize: 9, color: AppColors.textSecondary),
                      ),
                    ),
                  ),
                  topTitles: const AxisTitles(sideTitles: SideTitles()),
                  rightTitles: const AxisTitles(sideTitles: SideTitles()),
                ),
                gridData: const FlGridData(show: true, drawVerticalLine: false),
                borderData: FlBorderData(show: false),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PrCard extends StatelessWidget {
  final PersonalRecord pr;
  const _PrCard({required this.pr});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          // Circular icon container
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.pr.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.workspace_premium_rounded,
              color: AppColors.pr,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  pr.exerciseName,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  pr.prType == 'ONE_RM_ESTIMATED' ? 'Estimated 1RM' : 'Max Weight',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w300,
                    color: const Color(0xFF888888),
                  ),
                ),
              ],
            ),
          ),
          // Value — Barlow ExtraBold
          Text(
            '${pr.value.toStringAsFixed(1)} kg',
            style: GoogleFonts.barlow(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: AppColors.pr,
              height: 1,
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricHeader extends StatelessWidget {
  final double? heightCm;
  final double? goalWeight;
  const _MetricHeader({this.heightCm, this.goalWeight});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      neonBorder: true,
      onTap: () => _showEditProfileSheet(context),
      padding: const EdgeInsets.all(20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _HeaderStat(
            label: 'HEIGHT',
            value: heightCm != null ? '${heightCm!.toInt()} cm' : '--',
            icon: Icons.height_rounded,
          ),
          Container(width: 1, height: 40, color: AppColors.border),
          _HeaderStat(
            label: 'GOAL WEIGHT',
            value: goalWeight != null ? '${goalWeight!.toStringAsFixed(1)} kg' : '--',
            icon: Icons.flag_rounded,
          ),
        ],
      ),
    );
  }
}

class _HeaderStat extends StatelessWidget {
  final String label, value;
  final IconData icon;
  const _HeaderStat({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(height: 8),
        Text(
          value,
          style: GoogleFonts.barlow(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w400,
            color: AppColors.textMuted,
            letterSpacing: 1,
          ),
        ),
      ],
    );
  }
}

void _showEditProfileSheet(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _EditProfileBottomSheet(),
  );
}

class _EditProfileBottomSheet extends ConsumerStatefulWidget {
  @override
  ConsumerState<_EditProfileBottomSheet> createState() => _EditProfileBottomSheetState();
}

class _EditProfileBottomSheetState extends ConsumerState<_EditProfileBottomSheet> {
  final _heightCtrl = TextEditingController();
  final _goalCtrl = TextEditingController();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authStateProvider).user;
    if (user?.heightCm != null) _heightCtrl.text = user!.heightCm!.toInt().toString();
    if (user?.goalWeightKg != null) _goalCtrl.text = user!.goalWeightKg!.toString();
  }

  @override
  void dispose() {
    _heightCtrl.dispose();
    _goalCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(24, 24, 24, MediaQuery.of(context).viewInsets.bottom + 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'PROFILE & GOALS',
                style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w800),
              ),
              IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
            ],
          ),
          const SizedBox(height: 24),
          _MetricInput(
            controller: _heightCtrl,
            label: 'Height',
            unit: 'cm',
            icon: Icons.height_rounded,
            hint: '0',
          ),
          const SizedBox(height: 16),
          _MetricInput(
            controller: _goalCtrl,
            label: 'Goal Weight',
            unit: 'kg',
            icon: Icons.flag_rounded,
            hint: '0.0',
          ),
          const SizedBox(height: 32),
          NeonButton(
            label: 'UPDATE PROFILE',
            isLoading: _submitting,
            onPressed: () async {
              final navigator = Navigator.of(context);
              setState(() => _submitting = true);
              try {
                await ref.read(authStateProvider.notifier).updateProfile({
                  if (_heightCtrl.text.isNotEmpty) 'heightCm': double.tryParse(_heightCtrl.text),
                  if (_goalCtrl.text.isNotEmpty) 'goalWeightKg': double.tryParse(_goalCtrl.text),
                });
                if (mounted) navigator.pop();
              } finally {
                if (mounted) setState(() => _submitting = false);
              }
            },
          ),
        ],
      ),
    );
  }
}

void _showAddMetricSheet(BuildContext context, WidgetRef ref) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _AddMetricBottomSheet(),
  );
}

class _AddMetricBottomSheet extends ConsumerStatefulWidget {
  @override
  ConsumerState<_AddMetricBottomSheet> createState() => _AddMetricBottomSheetState();
}

class _AddMetricBottomSheetState extends ConsumerState<_AddMetricBottomSheet> {
  final _wtCtrl = TextEditingController();
  final _fatCtrl = TextEditingController();
  final _bmiCtrl = TextEditingController();
  final _waterCtrl = TextEditingController();
  final _boneCtrl = TextEditingController();
  final _visceralCtrl = TextEditingController();
  final _waistCtrl = TextEditingController();
  final _hipsCtrl = TextEditingController();
  DateTime _recordedAt = DateTime.now();
  bool _submitting = false;

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _recordedAt,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppColors.primary,
              onPrimary: Colors.black,
              surface: Color(0xFF151515),
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _recordedAt = picked);
    }
  }

  @override
  void dispose() {
    _wtCtrl.dispose();
    _fatCtrl.dispose();
    _bmiCtrl.dispose();
    _waterCtrl.dispose();
    _boneCtrl.dispose();
    _visceralCtrl.dispose();
    _waistCtrl.dispose();
    _hipsCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF0A0A0A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        border: Border(top: BorderSide(color: Color(0xFF222222), width: 1)),
      ),
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.9),
      child: Stack(
        children: [
          SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(24, 80, 24, bottomPadding + 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Section: Core Metrics (Mandatory)
                _buildSectionHeader('CORE METRICS', Icons.star_rounded, isRequired: true),
                Row(
                  children: [
                    Expanded(
                      child: _MetricInput(
                        controller: _wtCtrl,
                        label: 'Weight',
                        unit: 'kg',
                        icon: Icons.monitor_weight_outlined,
                        hint: '0.0',
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _MetricInput(
                        controller: _fatCtrl,
                        label: 'Body Fat',
                        unit: '%',
                        icon: Icons.percent_rounded,
                        hint: '0.0',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),

                // Section: Advanced Composition
                _buildSectionHeader('BODY COMPOSITION', Icons.analytics_outlined),
                Row(
                  children: [
                    Expanded(
                      child: _MetricInput(
                        controller: _bmiCtrl,
                        label: 'BMI',
                        unit: '',
                        icon: Icons.calculate_outlined,
                        hint: '0.0',
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _MetricInput(
                        controller: _waterCtrl,
                        label: 'Body Water',
                        unit: '%',
                        icon: Icons.water_drop_outlined,
                        hint: '0.0',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _MetricInput(
                        controller: _boneCtrl,
                        label: 'Bone Mass',
                        unit: 'kg',
                        icon: Icons.fitness_center_rounded,
                        hint: '0.0',
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _MetricInput(
                        controller: _visceralCtrl,
                        label: 'Visceral Fat',
                        unit: 'lvl',
                        icon: Icons.speed_rounded,
                        hint: '1-20',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),

                // Section: Measurements
                _buildSectionHeader('CIRCUMFERENCES', Icons.straighten_rounded),
                Row(
                  children: [
                    Expanded(
                      child: _MetricInput(
                        controller: _waistCtrl,
                        label: 'Waist',
                        unit: 'cm',
                        icon: Icons.circle_outlined,
                        hint: '0',
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _MetricInput(
                        controller: _hipsCtrl,
                        label: 'Hips',
                        unit: 'cm',
                        icon: Icons.accessibility_new_rounded,
                        hint: '0',
                      ),
                    ),
                  ],
                ),
                // Date Selection
                InkWell(
                  onTap: _selectDate,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      border: Border.all(color: const Color(0xFF222222)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.calendar_today_rounded, size: 16, color: AppColors.primary),
                        const SizedBox(width: 8),
                        Text(
                          '${_recordedAt.day}/${_recordedAt.month}/${_recordedAt.year}',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                NeonButton(
                  label: 'SAVE MEASUREMENTS',
                  isLoading: _submitting,
                  onPressed: () async {
                    if (_wtCtrl.text.isEmpty || _fatCtrl.text.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Weight and Body Fat are mandatory')),
                      );
                      return;
                    }
                    final navigator = Navigator.of(context);
                    setState(() => _submitting = true);
                    try {
                      await ref.read(bodyMetricsProvider.notifier).addMetric(
                        recordedAt: _recordedAt,
                        weightKg: double.tryParse(_wtCtrl.text),
                        bodyFatPct: double.tryParse(_fatCtrl.text),
                        bmi: double.tryParse(_bmiCtrl.text),
                        bodyWaterPct: double.tryParse(_waterCtrl.text),
                        boneMassKg: double.tryParse(_boneCtrl.text),
                        visceralFatRating: int.tryParse(_visceralCtrl.text),
                        waistCm: double.tryParse(_waistCtrl.text),
                        hipsCm: double.tryParse(_hipsCtrl.text),
                      );
                      if (mounted) navigator.pop();
                    } finally {
                      if (mounted) setState(() => _submitting = false);
                    }
                  },
                ),
              ],
            ),
          ),
          // Blur Top Header
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: Container(
                height: 80,
                color: Colors.black.withValues(alpha: 0.6),
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'LOG METRICS',
                          style: GoogleFonts.barlow(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          'Track your physical evolution',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: const Color(0xFF888888),
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close_rounded, color: Colors.white70),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, {bool isRequired = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Icon(icon, size: 14, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.5,
              color: Colors.white70,
            ),
          ),
          if (isRequired) ...[
            const SizedBox(width: 4),
            const Text(
              '*',
              style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
            ),
          ]
        ],
      ),
    );
  }
}

class _MetricInput extends StatelessWidget {
  final TextEditingController controller;
  final String label, hint, unit;
  final IconData icon;

  const _MetricInput({
    required this.controller,
    required this.label,
    required this.hint,
    required this.unit,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w500,
            color: const Color(0xFF666666),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          height: 56,
          decoration: BoxDecoration(
            color: const Color(0xFF151515),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF222222)),
          ),
          child: Row(
            children: [
              const SizedBox(width: 14),
              Icon(icon, color: Colors.white.withValues(alpha: 0.3), size: 18),
              Expanded(
                child: TextField(
                  controller: controller,
                  textAlign: TextAlign.center,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  style: GoogleFonts.barlow(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                  decoration: InputDecoration(
                    hintText: hint,
                    hintStyle: const TextStyle(color: Color(0xFF333333)),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),
              if (unit.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(right: 14),
                  child: Text(
                    unit,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              if (unit.isEmpty) const SizedBox(width: 14),
            ],
          ),
        ),
      ],
    );
  }
}
