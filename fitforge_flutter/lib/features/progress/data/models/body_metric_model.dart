// lib/features/progress/data/models/body_metric_model.dart

class BodyMetric {
  final String id;
  final DateTime recordedAt;
  final double? weightKg;
  final double? bodyFatPct;
  final double? waistCm;
  final double? hipsCm;
  final double? chestCm;
  final double? armsCm;
  final double? thighsCm;
  final double? bmi;
  final double? bodyWaterPct;
  final double? boneMassKg;
  final int? visceralFatRating;
  final String? notes;

  const BodyMetric({
    required this.id,
    required this.recordedAt,
    this.weightKg,
    this.bodyFatPct,
    this.waistCm,
    this.hipsCm,
    this.chestCm,
    this.armsCm,
    this.thighsCm,
    this.bmi,
    this.bodyWaterPct,
    this.boneMassKg,
    this.visceralFatRating,
    this.notes,
  });

  factory BodyMetric.fromJson(Map<String, dynamic> json) {
    return BodyMetric(
      id: json['id'] as String,
      recordedAt: DateTime.parse(json['recordedAt'] as String),
      weightKg: _toDouble(json['weightKg']),
      bodyFatPct: _toDouble(json['bodyFatPct']),
      waistCm: _toDouble(json['waistCm']),
      hipsCm: _toDouble(json['hipsCm']),
      chestCm: _toDouble(json['chestCm']),
      armsCm: _toDouble(json['armsCm']),
      thighsCm: _toDouble(json['thighsCm']),
      bmi: _toDouble(json['bmi']),
      bodyWaterPct: _toDouble(json['bodyWaterPct']),
      boneMassKg: _toDouble(json['boneMassKg']),
      visceralFatRating: json['visceralFatRating'] as int?,
      notes: json['notes'] as String?,
    );
  }

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v);
    return null;
  }
}
