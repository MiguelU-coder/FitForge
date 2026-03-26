// lib/features/progress/presentation/providers/body_metrics_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../data/models/body_metric_model.dart';

final bodyMetricsProvider = AsyncNotifierProvider.autoDispose<BodyMetricsNotifier, List<BodyMetric>>(() {
  return BodyMetricsNotifier();
});

class BodyMetricsNotifier extends AutoDisposeAsyncNotifier<List<BodyMetric>> {
  @override
  Future<List<BodyMetric>> build() async {
    final client = ref.read(apiClientProvider);
    final data = await client.get<List<dynamic>>('/users/me/metrics?limit=30');
    
    return data
        .map((e) => BodyMetric.fromJson(e as Map<String, dynamic>))
        .toList()
        .reversed
        .toList(); 
  }

  Future<void> addMetric({
    DateTime? recordedAt,
    double? weightKg,
    double? bodyFatPct,
    double? waistCm,
    double? hipsCm,
    double? chestCm,
    double? armsCm,
    double? thighsCm,
    double? bmi,
    double? bodyWaterPct,
    double? boneMassKg,
    int? visceralFatRating,
    String? notes,
  }) async {
    state = const AsyncValue.loading();
    try {
      final client = ref.read(apiClientProvider);
      await client.post('/users/me/metrics', data: {
        if (recordedAt != null) 'recordedAt': recordedAt.toUtc().toIso8601String(),
        if (weightKg != null) 'weightKg': weightKg,
        if (bodyFatPct != null) 'bodyFatPct': bodyFatPct,
        if (waistCm != null) 'waistCm': waistCm,
        if (hipsCm != null) 'hipsCm': hipsCm,
        if (chestCm != null) 'chestCm': chestCm,
        if (armsCm != null) 'armsCm': armsCm,
        if (thighsCm != null) 'thighsCm': thighsCm,
        if (bmi != null) 'bmi': bmi,
        if (bodyWaterPct != null) 'bodyWaterPct': bodyWaterPct,
        if (boneMassKg != null) 'boneMassKg': boneMassKg,
        if (visceralFatRating != null) 'visceralFatRating': visceralFatRating,
        if (notes != null) 'notes': notes,
      });
      
      // Refresh data
      ref.invalidateSelf();
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}
