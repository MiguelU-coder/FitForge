// lib/features/progress/presentation/providers/volume_history_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../screens/progress_screen.dart'; // To reuse WeeklyVolume class

class WeeklyTotal {
  final DateTime weekStart;
  final int totalSets;
  final double totalVolumeKg;

  const WeeklyTotal({
    required this.weekStart,
    required this.totalSets,
    required this.totalVolumeKg,
  });
}

final volumeHistoryProvider = FutureProvider.autoDispose<List<WeeklyTotal>>((ref) async {
  final client = ref.read(apiClientProvider);
  final data = await client.get<List<dynamic>>('/progress/volume?weeks=12');
  
  final rawVolumes = data.map((e) => WeeklyVolume.fromJson(e as Map<String, dynamic>)).toList();
  
  // Aggregate by weekStart
  final Map<String, WeeklyTotal> map = {};
  for (final v in rawVolumes) {
    final existing = map[v.weekStart];
    if (existing == null) {
      map[v.weekStart] = WeeklyTotal(
        weekStart: DateTime.parse(v.weekStart),
        totalSets: v.totalSets,
        totalVolumeKg: v.totalVolumeKg,
      );
    } else {
      map[v.weekStart] = WeeklyTotal(
        weekStart: existing.weekStart,
        totalSets: existing.totalSets + v.totalSets,
        totalVolumeKg: existing.totalVolumeKg + v.totalVolumeKg,
      );
    }
  }
  
  final list = map.values.toList()
    ..sort((a, b) => a.weekStart.compareTo(b.weekStart));
    
  return list;
});
