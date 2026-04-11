import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  Platform,
  UIManager,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useWorkoutStore } from "../../src/stores/useWorkoutStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Shadows } from "../../src/theme/colors";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { history, isLoading, fetchHistory } = useWorkoutStore();
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "week" | "month"
  >("all");
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const toggleSession = useCallback((sessionId: string) => {
    setExpandedSession((prev) => (prev === sessionId ? null : sessionId));
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      month: d.toLocaleDateString("es", { month: "short" }).toUpperCase(),
      day: d.getDate(),
      year: d.getFullYear(),
      full: d.toLocaleDateString("es", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      weekday: d.toLocaleDateString("es", { weekday: "short" }).toUpperCase(),
    };
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--";
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m} min`;
  };

  const formatTonnage = (kg: number) => {
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`;
    return `${kg}`;
  };

  const monthNameToSpanish = (month: number) => {
    const names = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return names[month];
  };

  const filteredHistory = useMemo(() => {
    if (selectedFilter === "all") return history;
    const now = new Date();
    const cutoff = new Date();
    if (selectedFilter === "week") cutoff.setDate(now.getDate() - 7);
    if (selectedFilter === "month") cutoff.setDate(now.getDate() - 30);
    return history.filter(
      (s) => new Date(s.finishedAt || s.startedAt) >= cutoff,
    );
  }, [history, selectedFilter]);

  const totalSessions = filteredHistory.length;
  const totalVolume = useMemo(() => {
    return filteredHistory.reduce(
      (acc, s) =>
        acc +
        (s.exerciseBlocks?.reduce(
          (bAcc, b) =>
            bAcc +
            b.sets.reduce(
              (sAcc, set) => sAcc + (set.weightKg || 0) * (set.reps || 0),
              0,
            ),
          0,
        ) || 0),
      0,
    );
  }, [filteredHistory]);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, typeof history> = {};
    filteredHistory.forEach((session) => {
      const d = new Date(session.finishedAt || session.startedAt);
      const year = d.getFullYear().toString();
      const monthNum = d.getMonth();
      const key = `${year}-${monthNum}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(session);
    });
    return Object.entries(groups).map(([key, sessions]) => {
      const [year, month] = key.split("-");
      const monthIndex = parseInt(month, 10);
      const monthName = monthNameToSpanish(monthIndex);
      return {
        key,
        title: `${monthName} ${year}`,
        sessions,
      };
    });
  }, [filteredHistory]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.background, `${Colors.primary}08`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.headerGlass}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Historial</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalSessions} sesiones</Text>
          </View>
        </View>
      </View>

      {filteredHistory.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCardGlass}>
            <LinearGradient
              colors={[`${Colors.primary}20`, `${Colors.primary}10`]}
              style={styles.statCardGradient}
            >
              <View style={styles.statIconCircle}>
                <Ionicons name="calendar" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{totalSessions}</Text>
              <Text style={styles.statLabel}>Sesiones</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCardGlass}>
            <LinearGradient
              colors={[`${Colors.pr}20`, `${Colors.pr}10`]}
              style={styles.statCardGradient}
            >
              <View
                style={[
                  styles.statIconCircle,
                  { backgroundColor: `${Colors.pr}20` },
                ]}
              >
                <Ionicons name="barbell" size={18} color={Colors.pr} />
              </View>
              <Text style={[styles.statValue, { color: Colors.pr }]}>
                {formatTonnage(totalVolume)}
              </Text>
              <Text style={styles.statLabel}>Volumen</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCardGlass}>
            <LinearGradient
              colors={[`${Colors.warning}20`, `${Colors.warning}10`]}
              style={styles.statCardGradient}
            >
              <View
                style={[
                  styles.statIconCircle,
                  { backgroundColor: `${Colors.warning}20` },
                ]}
              >
                <Ionicons name="speedometer" size={18} color={Colors.warning} />
              </View>
              <Text style={[styles.statValue, { color: Colors.warning }]}>
                {totalSessions > 0
                  ? Math.round(totalVolume / totalSessions)
                  : 0}
              </Text>
              <Text style={styles.statLabel}>Promedio</Text>
            </LinearGradient>
          </View>
        </View>
      )}

      {filteredHistory.length > 0 && (
        <View style={styles.filterRow}>
          {(["all", "week", "month"] as const).map((filter) => (
            <Pressable
              key={filter}
              style={[
                styles.filterPill,
                selectedFilter === filter && styles.filterPillActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedFilter === filter && styles.filterPillTextActive,
                ]}
              >
                {filter === "all"
                  ? "Todo"
                  : filter === "week"
                    ? "Esta semana"
                    : "Este mes"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && history.length > 0}
            onRefresh={fetchHistory}
            tintColor={Colors.primary}
          />
        }
      >
        {isLoading && history.length === 0 ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filteredHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCardLarge}>
              <LinearGradient
                colors={[`${Colors.primary}15`, `${Colors.primary}05`]}
                style={styles.emptyGradient}
              >
                <Ionicons name="fitness" size={56} color={Colors.primary} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>Sin entrenamientos</Text>
              <Text style={styles.emptySubtitle}>
                {selectedFilter !== "all"
                  ? "No hay sesiones en este período"
                  : "Comienza tu primera sesión"}
              </Text>
            </View>
          </View>
        ) : (
          groupedHistory.map(({ key, title, sessions }) => (
            <View key={key} style={styles.monthSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>{title}</Text>
                <Text style={styles.sectionCount}>{sessions.length}</Text>
              </View>

              <View style={styles.sessionsList}>
                {sessions.map((session) => {
                  const isExpanded = expandedSession === session.id;
                  const date = formatDate(
                    session.finishedAt || session.startedAt,
                  );
                  const tonnage =
                    session.exerciseBlocks?.reduce(
                      (acc, b) =>
                        acc +
                        b.sets.reduce(
                          (sAcc, s) => sAcc + (s.weightKg || 0) * (s.reps || 0),
                          0,
                        ),
                      0,
                    ) || 0;
                  const exerciseCount = session.exerciseBlocks?.length || 0;
                  const setCount =
                    session.exerciseBlocks?.reduce(
                      (acc, b) => acc + (b.sets?.length || 0),
                      0,
                    ) || 0;

                  return (
                    <Pressable
                      key={session.id}
                      onPress={() => toggleSession(session.id)}
                    >
                      <LinearGradient
                        colors={[Colors.elevated, `${Colors.background}80`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          styles.sessionCard,
                          isExpanded && styles.sessionCardExpanded,
                        ]}
                      >
                        <View style={styles.sessionCardMain}>
                          <View style={styles.dateBadgeBig}>
                            <Text style={styles.dateDayBig}>{date.day}</Text>
                            <Text style={styles.dateMonthBig}>
                              {date.month}
                            </Text>
                          </View>

                          <View style={styles.sessionInfo}>
                            <Text style={styles.sessionName} numberOfLines={1}>
                              {session.name}
                            </Text>
                            <Text style={styles.sessionDate}>{date.full}</Text>

                            <View style={styles.quickStats}>
                              <View style={styles.quickStatPill}>
                                <Ionicons
                                  name="time"
                                  size={11}
                                  color={Colors.primary}
                                />
                                <Text style={styles.quickStatText}>
                                  {formatDuration(session.durationSeconds)}
                                </Text>
                              </View>
                              <View style={styles.quickStatPill}>
                                <Ionicons
                                  name="barbell"
                                  size={11}
                                  color={Colors.pr}
                                />
                                <Text style={styles.quickStatText}>
                                  {formatTonnage(tonnage)}kg
                                </Text>
                              </View>
                              <View style={styles.quickStatPill}>
                                <Ionicons
                                  name="repeat"
                                  size={11}
                                  color={Colors.warning}
                                />
                                <Text style={styles.quickStatText}>
                                  {setCount}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.expandIcon}>
                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={20}
                              color={Colors.textTertiary}
                            />
                          </View>
                        </View>

                        {isExpanded && (
                          <View style={styles.expandedContent}>
                            <View style={styles.expandedDivider} />

                            <View style={styles.expandedSection}>
                              <Text style={styles.expandedLabel}>
                                EJERCICIOS
                              </Text>
                              <View style={styles.exercisesList}>
                                {session.exerciseBlocks?.length > 0 ? (
                                  session.exerciseBlocks
                                    .slice(0, 5)
                                    .map((block, idx) => (
                                      <View
                                        key={block.id || idx}
                                        style={styles.exerciseItem}
                                      >
                                        <View style={styles.exerciseDot} />
                                        <Text
                                          style={styles.exerciseName}
                                          numberOfLines={1}
                                        >
                                          {block.exerciseName ||
                                            `Ejercicio ${idx + 1}`}
                                        </Text>
                                        <Text style={styles.exerciseSets}>
                                          {block.sets?.length || 0} series
                                        </Text>
                                      </View>
                                    ))
                                ) : (
                                  <Text style={styles.noExercisesText}>
                                    No hay ejercicios registrados
                                  </Text>
                                )}
                                {(session.exerciseBlocks?.length || 0) > 5 && (
                                  <Text style={styles.moreExercisesText}>
                                    +{(session.exerciseBlocks?.length || 0) - 5}{" "}
                                    más
                                  </Text>
                                )}
                              </View>
                            </View>

                            {session.perceivedExertion && (
                              <View style={styles.expandedSection}>
                                <Text style={styles.expandedLabel}>
                                  INTENSIDAD
                                </Text>
                                <View style={styles.rpeRow}>
                                  <View style={styles.rpeBarBg}>
                                    <View
                                      style={{
                                        width: `${session.perceivedExertion * 10}%`,
                                        height: "100%",
                                        backgroundColor: Colors.warning,
                                        borderRadius: 4,
                                      }}
                                    />
                                  </View>
                                  <Text style={styles.rpeValue}>
                                    RPE {session.perceivedExertion}
                                  </Text>
                                </View>
                              </View>
                            )}

                            <Pressable
                              style={styles.viewDetailsBtn}
                              onPress={() =>
                                router.push(`/workout/${session.id}`)
                              }
                            >
                              <Text style={styles.viewDetailsText}>
                                Ver detalles completos
                              </Text>
                              <Ionicons
                                name="arrow-forward"
                                size={14}
                                color={Colors.primary}
                              />
                            </Pressable>
                          </View>
                        )}
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGlass: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  headerContent: { flex: 1, marginLeft: 14 },
  headerTitle: {
    fontFamily: "ArchivoBlack",
    fontSize: 30,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerBadge: {
    backgroundColor: `${Colors.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  headerBadgeText: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  statCardGlass: { flex: 1 },
  statCardGradient: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontFamily: "BebasNeue",
    fontSize: 32,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontFamily: "DMSans-Medium",
    fontSize: 10,
    color: "#FFFFFF",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontFamily: "DMSans-Medium",
    fontSize: 13,
    color: "#FFFFFF",
  },
  filterPillTextActive: { color: "#FFF", fontFamily: "DMSans-Bold" },
  content: { paddingHorizontal: 20 },
  centerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyCardLarge: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: `${Colors.primary}30`,
  },
  emptyTitle: {
    fontFamily: "ArchivoBlack",
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: "DMSans-Regular",
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
  },
  monthSection: { marginBottom: 24 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 10,
  },
  sectionTitle: {
    fontFamily: "ArchivoBlack",
    fontSize: 15,
    color: Colors.textSecondary,
    flex: 1,
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    color: Colors.textTertiary,
  },
  sessionsList: { gap: 12 },
  sessionCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sessionCardExpanded: { borderColor: Colors.primary },
  sessionCardMain: { flexDirection: "row", alignItems: "center" },
  dateBadgeBig: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  dateDayBig: {
    fontFamily: "BebasNeue",
    fontSize: 24,
    color: Colors.primary,
    lineHeight: 26,
  },
  dateMonthBig: {
    fontFamily: "DMSans-Bold",
    fontSize: 10,
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sessionInfo: { flex: 1 },
  sessionName: {
    fontFamily: "ArchivoBlack",
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  sessionDate: {
    fontFamily: "DMSans-Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  quickStats: { flexDirection: "row", gap: 8 },
  quickStatPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickStatText: {
    fontFamily: "DMSans-Medium",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  expandIcon: { marginLeft: 10 },
  noExercisesText: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: "italic",
  },
  expandedContent: { marginTop: 16 },
  expandedDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  expandedSection: { marginBottom: 14 },
  expandedLabel: {
    fontFamily: "DMSans-Bold",
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  exercisesList: { gap: 8 },
  exerciseItem: { flexDirection: "row", alignItems: "center" },
  exerciseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 10,
  },
  exerciseName: {
    flex: 1,
    fontFamily: "DMSans-Medium",
    fontSize: 13,
    color: Colors.textPrimary,
  },
  exerciseSets: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    color: Colors.primary,
  },
  moreExercisesText: {
    fontFamily: "DMSans-Medium",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  musclesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  muscleTag: {
    backgroundColor: `${Colors.warning}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  muscleTagText: {
    fontFamily: "DMSans-Medium",
    fontSize: 11,
    color: Colors.warning,
  },
  rpeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  rpeBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.card,
    borderRadius: 4,
    overflow: "hidden",
  },
  rpeBarFill: { height: "100%", borderRadius: 4 },
  rpeValue: { fontFamily: "DMSans-Bold", fontSize: 13, color: Colors.warning },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: `${Colors.primary}15`,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  viewDetailsText: {
    fontFamily: "DMSans-Bold",
    fontSize: 13,
    color: Colors.primary,
  },
});
