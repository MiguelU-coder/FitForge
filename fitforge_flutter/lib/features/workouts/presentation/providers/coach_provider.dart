import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../features/ai/data/models/ai_response_models.dart';

// ── State ─────────────────────────────────────────────────────────────────────

class CoachState {
  final CoachResponse? response;
  final bool isLoading;
  final String? error;

  const CoachState({this.response, this.isLoading = false, this.error});

  CoachState copyWith({
    CoachResponse? response,
    bool? isLoading,
    String? error,
    bool clear = false,
  }) => CoachState(
    response: clear ? null : (response ?? this.response),
    isLoading: isLoading ?? this.isLoading,
    error: error,
  );
}

// ── Notifier ──────────────────────────────────────────────────────────────────

class CoachNotifier extends StateNotifier<CoachState> {
  final ApiClient _api;
  Timer? _cooldownTimer;
  CancelToken? _cancelToken;

  CoachNotifier(this._api) : super(const CoachState());

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    _cancelToken?.cancel();
    super.dispose();
  }

  /// Calls POST /ai/coach after a set is logged.
  Future<void> fetchCoachFeedback({
    required String userId,
    required String exercise,
    required List<Map<String, dynamic>> sets,
    required double fatigueScore,
    required double estimated1RM,
    required bool isPR,
    required String injuryRisk,
    double? weeklyVolume,
  }) async {
    if (sets.isEmpty) return;

    // Reset cooldown and cancel previous request for this block
    _cooldownTimer?.cancel();
    _cancelToken?.cancel();
    _cancelToken = CancelToken();

    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _api.dio.post<Map<String, dynamic>>(
        '/ai/coach',
        data: {
          'userId': userId,
          'exercise': exercise,
          'recentSets': sets,
          'fatigueScore': fatigueScore,
          'estimated1RM': estimated1RM,
          'isPR': isPR,
          'injuryRisk': injuryRisk,
          if (weeklyVolume != null) 'weeklyVolume': weeklyVolume,
        },
        cancelToken: _cancelToken,
        options: Options(receiveTimeout: const Duration(seconds: 180)),
      );

      final dynamic body = response.data;
      final Map<String, dynamic>? bodyMap = (body is Map)
          ? Map<String, dynamic>.from(body)
          : null;
      final coachData = bodyMap?['data'];

      state = state.copyWith(
        isLoading: false,
        response: CoachResponse.fromJson(
          (coachData as Map<String, dynamic>?) ?? {},
        ),
      );

      // Start 60s cooldown to clear the UI
      _startCooldown();
    } catch (e) {
      if (e is DioException && CancelToken.isCancel(e)) return;
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> fetchSessionFeedback({
    required String userId,
    required List<Map<String, dynamic>> exercises,
    int? durationMin,
    double? totalVolume,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _api.dio.post(
        '/ai/coach/session',
        data: {
          'userId': userId,
          'exercises': exercises,
          if (durationMin != null) 'durationMin': durationMin,
          if (totalVolume != null) 'totalVolume': totalVolume,
        },
        options: Options(receiveTimeout: const Duration(seconds: 180)),
      );

      final dynamic body = response.data;
      final Map<String, dynamic>? bodyMap = (body is Map)
          ? Map<String, dynamic>.from(body)
          : null;
      final coachData = bodyMap?['data'];

      state = state.copyWith(
        isLoading: false,
        response: CoachResponse.fromJson(
          (coachData as Map<String, dynamic>?) ?? {},
        ),
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void _startCooldown() {
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer(const Duration(seconds: 60), () {
      if (mounted) {
        state = state.copyWith(clear: true);
      }
    });
  }

  void clear() {
    _cooldownTimer?.cancel();
    state = const CoachState();
  }
}

// ── Provider (Family scoped by blockId) ──────────────────────────────────────

final coachProvider =
    StateNotifierProvider.family<CoachNotifier, CoachState, String>(
      (ref, blockId) => CoachNotifier(ref.read(apiClientProvider)),
    );
