import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWorkoutStore } from "../../src/stores/useWorkoutStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Shadows } from "../../src/theme/colors";
import { WorkoutSession, SetLog } from "../../src/types/workout";
import { LinearGradient } from "expo-linear-gradient";

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fetchSessionById, isLoading } = useWorkoutStore();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const toggleExercise = useCallback((blockId: string) => {
    setExpandedExercise((prev) => (prev === blockId ? null : blockId));
  }, []);

  useEffect(() => {
    if (id) {
      fetchSessionById(id).then(setSession);
    }
  }, [id]);

  const stats = useMemo(() => {
    if (!session) return { sets: 0, tonnage: 0, exercises: 0 };
    let sets = 0;
    let tonnage = 0;
    const exercises = session.exerciseBlocks?.length || 0;
    session.exerciseBlocks?.forEach((b: any) => {
      b.sets?.forEach((s: any) => {
        if (s.weightKg != null && s.reps != null) {
          sets++;
          tonnage += Math.round(s.weightKg * s.reps);
        }
      });
    });
    return { sets, tonnage, exercises };
  }, [session]);

  const formatTime = (seconds?: number) => {
    if (!seconds) return "--:--";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("es", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getIntensityLabel = (rpe?: number) => {
    if (!rpe) return "Sin calificar";
    if (rpe >= 9) return "MUY DURO";
    if (rpe >= 7) return "DESAFIANTE";
    return "MODERADO";
  };

  const getIntensityColor = (rpe?: number) => {
    if (!rpe) return Colors.textMuted;
    if (rpe >= 9) return Colors.error;
    if (rpe >= 7) return Colors.warning;
    return Colors.primary;
  };

  if (isLoading && !session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!session) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, `${Colors.primary}08`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.headerGlass, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {session.name}
          </Text>
          <View style={styles.headerMetaRow}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={Colors.textMuted}
            />
            <Text style={styles.headerDate}>
              {formatDate(session.finishedAt || session.startedAt)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCardLarge}>
            <LinearGradient
              colors={[`${Colors.primary}20`, `${Colors.primary}10`]}
              style={styles.statGradient}
            >
              <View style={styles.statIconBox}>
                <Ionicons name="time" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.statValueBig}>
                {formatTime(session.durationSeconds)}
              </Text>
              <Text style={styles.statLabelSmall}>Duración</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCardLarge}>
            <LinearGradient
              colors={[`${Colors.pr}20`, `${Colors.pr}10`]}
              style={styles.statGradient}
            >
              <View
                style={[
                  styles.statIconBox,
                  { backgroundColor: `${Colors.pr}20` },
                ]}
              >
                <Ionicons name="barbell" size={22} color={Colors.pr} />
              </View>
              <Text style={[styles.statValueBig, { color: Colors.pr }]}>
                {stats.tonnage}
              </Text>
              <Text style={[styles.statLabelSmall, { color: Colors.pr }]}>
                kg volumen
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.statCardLarge}>
            <LinearGradient
              colors={[`${Colors.warning}20`, `${Colors.warning}10`]}
              style={styles.statGradient}
            >
              <View
                style={[
                  styles.statIconBox,
                  { backgroundColor: `${Colors.warning}20` },
                ]}
              >
                <Ionicons name="repeat" size={22} color={Colors.warning} />
              </View>
              <Text style={[styles.statValueBig, { color: Colors.warning }]}>
                {stats.sets}
              </Text>
              <Text style={[styles.statLabelSmall, { color: Colors.warning }]}>
                series
              </Text>
            </LinearGradient>
          </View>
        </View>

        {session.perceivedExertion != null && (
          <View style={styles.intensityCardNew}>
            <View style={styles.intensityHeaderRow}>
              <Ionicons
                name="speedometer"
                size={18}
                color={getIntensityColor(session.perceivedExertion)}
              />
              <Text style={styles.intensityTitleNew}>INTENSIDAD PERCIBIDA</Text>
            </View>
            <Text style={styles.intensitySubtitle}>
              ¿Cuánto te costó el entrenamiento?
            </Text>

            <View style={styles.intensityGauge}>
              {[6, 7, 8, 9, 10].map((val) => (
                <Pressable
                  key={val}
                  style={[
                    styles.gaugeDot,
                    (session.perceivedExertion || 0) >= val &&
                      styles.gaugeDotActive,
                    (session.perceivedExertion || 0) >= val && {
                      backgroundColor: getIntensityColor(val),
                    },
                  ]}
                  disabled
                >
                  <Text
                    style={[
                      styles.gaugeDotText,
                      (session.perceivedExertion || 0) >= val &&
                        styles.gaugeDotTextActive,
                    ]}
                  >
                    {val}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.intensityLabels}>
              <Text style={styles.intensityLabelStart}>Fácil</Text>
              <Text
                style={[
                  styles.intensityLabelEnd,
                  { color: getIntensityColor(session.perceivedExertion) },
                ]}
              >
                {getIntensityLabel(session.perceivedExertion)}
              </Text>
              <Text style={styles.intensityLabelEnd}>Muy duro</Text>
            </View>
          </View>
        )}

        <View style={styles.exercisesSection}>
          <View style={styles.exercisesSectionHeader}>
            <Text style={styles.sectionTitle}>EJERCICIOS</Text>
            <View style={styles.exerciseCountBadge}>
              <Text style={styles.exerciseCountText}>{stats.exercises}</Text>
            </View>
          </View>

          <View style={styles.exercisesList}>
            {session.exerciseBlocks.map((block, idx) => {
              const isExpanded = expandedExercise === block.id;
              return (
                <Pressable
                  key={block.id}
                  onPress={() => toggleExercise(block.id)}
                >
                  <View
                    style={[
                      styles.exerciseCardCompact,
                      isExpanded && styles.exerciseCardExpanded,
                    ]}
                  >
                    <View style={styles.exerciseCardHeader}>
                      <View style={styles.exerciseNumber}>
                        <Text style={styles.exerciseNumberText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text
                          style={styles.exerciseNameLarge}
                          numberOfLines={1}
                        >
                          {block.exerciseName}
                        </Text>
                        <Text style={styles.exerciseMeta}>
                          {block.sets?.length || 0} series •{" "}
                          {(block.sets || []).reduce(
                            (acc: number, s: any) => acc + (s.reps || 0),
                            0,
                          )}{" "}
                          reps
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={Colors.textTertiary}
                      />
                    </View>

                    {isExpanded && (
                      <View style={styles.expandedSetsContent}>
                        <View style={styles.setsGridCompact}>
                          {(block.sets || []).map(
                            (set: any, setIdx: number) => (
                              <View
                                key={set.id || setIdx}
                                style={[
                                  styles.setCardCompact,
                                  set.isPr && styles.setCardPR,
                                  set.isFailed && styles.setCardFailed,
                                ]}
                              >
                                <Text style={styles.setCardLabel}>
                                  S{set.setNumber}
                                </Text>
                                <Text style={styles.setCardWeight}>
                                  {set.weightKg || 0}
                                </Text>
                                <Text style={styles.setCardReps}>
                                  ×{set.reps || 0}
                                </Text>
                                {set.isPr && (
                                  <View style={styles.prBadge}>
                                    <Ionicons
                                      name="trophy"
                                      size={10}
                                      color={Colors.pr}
                                    />
                                  </View>
                                )}
                              </View>
                            ),
                          )}
                        </View>
                        <View style={styles.exerciseFooter}>
                          <View style={styles.rirPill}>
                            <Text style={styles.rirPillText}>
                              RIR +{block.sets?.[0]?.rir ?? "--"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {session.notes && (
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <Ionicons name="document-text" size={16} color={Colors.primary} />
              <Text style={styles.notesTitle}>NOTAS</Text>
            </View>
            <Text style={styles.notesText}>{session.notes}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  headerGlass: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.elevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerInfo: { flex: 1, marginLeft: 14 },
  headerTitle: {
    fontFamily: "ArchivoBlack",
    fontSize: 22,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  headerDate: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  content: { padding: 16 },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCardLarge: { flex: 1 },
  statGradient: {
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValueBig: {
    fontFamily: "BebasNeue",
    fontSize: 30,
    color: "#FFFFFF",
  },
  statLabelSmall: {
    fontFamily: "DMSans-Medium",
    fontSize: 11,
    color: "#FFFFFF",
    marginTop: 2,
  },
  intensityCard: {
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  intensityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  intensityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.warning}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  intensityTitle: {
    fontFamily: "ArchivoBlack",
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  intensityContent: { flexDirection: "row", alignItems: "center", gap: 16 },
  rpeCircle: { alignItems: "center" },
  rpeValue: {
    fontFamily: "BebasNeue",
    fontSize: 42,
    color: Colors.textPrimary,
  },
  rpeMax: {
    fontFamily: "DMSans-Medium",
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: -4,
  },
  rpeInfo: { flex: 1, gap: 6 },
  rpeBarBg: {
    height: 8,
    backgroundColor: Colors.card,
    borderRadius: 4,
    overflow: "hidden",
  },
  rpeBarFill: { height: "100%", borderRadius: 4 },
  rpeLabel: { fontFamily: "DMSans-Bold", fontSize: 12, letterSpacing: 0.5 },
  exercisesSection: { marginBottom: 20 },
  exercisesSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "ArchivoBlack",
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  exerciseCountBadge: {
    backgroundColor: `${Colors.primary}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  exerciseCountText: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    color: Colors.primary,
  },
  exerciseCardCompact: {
    backgroundColor: Colors.elevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  exerciseCardExpanded: { borderColor: Colors.primary, borderWidth: 2 },
  expandedSetsContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  setsGridCompact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
  },
  setCardCompact: {
    width: 72,
    height: 68,
    borderRadius: 12,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
  },
  intensityPillRow: { marginBottom: 16 },
  intensityPillItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.elevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  intensityPillValue: { fontFamily: "DMSans-Bold", fontSize: 13 },
  intensityPillLabel: {
    fontFamily: "DMSans-Medium",
    fontSize: 11,
    color: Colors.textMuted,
  },
  intensityCardNew: {
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  intensityHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  intensityTitleNew: {
    fontFamily: "ArchivoBlack",
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  intensitySubtitle: {
    fontFamily: "DMSans-Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  intensityGauge: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  gaugeDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gaugeDotActive: { borderWidth: 0 },
  gaugeDotText: {
    fontFamily: "DMSans-Bold",
    fontSize: 14,
    color: Colors.textMuted,
  },
  gaugeDotTextActive: { color: Colors.background },
  intensityLabels: { flexDirection: "row", justifyContent: "space-between" },
  intensityLabelStart: {
    fontFamily: "DMSans-Medium",
    fontSize: 10,
    color: Colors.primary,
  },
  intensityLabelEnd: {
    fontFamily: "DMSans-Medium",
    fontSize: 10,
    color: Colors.textMuted,
  },
  exercisesList: { gap: 14 },
  exerciseCardLarge: {
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exerciseCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseNumberText: {
    fontFamily: "DMSans-Bold",
    fontSize: 13,
    color: Colors.primary,
  },
  exerciseInfo: { flex: 1, marginLeft: 10, marginRight: 8 },
  exerciseNameLarge: {
    fontFamily: "ArchivoBlack",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  exerciseMeta: {
    fontFamily: "DMSans-Medium",
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  setsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  setCard: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  setCardPR: { borderColor: Colors.pr, backgroundColor: `${Colors.pr}10` },
  setCardFailed: {
    borderColor: Colors.error,
    backgroundColor: `${Colors.error}10`,
  },
  setCardLabel: {
    fontFamily: "DMSans-Bold",
    fontSize: 10,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  setCardWeight: {
    fontFamily: "BebasNeue",
    fontSize: 18,
    color: Colors.textPrimary,
  },
  setCardReps: {
    fontFamily: "DMSans-Medium",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  prBadge: { position: "absolute", top: 4, right: 4 },
  exerciseFooter: { flexDirection: "row", justifyContent: "flex-end" },
  rirPill: {
    backgroundColor: `${Colors.primary}10`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rirPillText: {
    fontFamily: "DMSans-Medium",
    fontSize: 11,
    color: Colors.primary,
  },
  notesCard: {
    backgroundColor: `${Colors.primary}08`,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${Colors.primary}25`,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  notesTitle: {
    fontFamily: "DMSans-Bold",
    fontSize: 11,
    color: Colors.primary,
    letterSpacing: 1,
  },
  notesText: {
    fontFamily: "DMSans-Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
