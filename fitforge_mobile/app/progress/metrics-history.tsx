// app/progress/metrics-history.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useProgressStore } from "../../src/stores/useProgressStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Shadows } from "../../src/theme/colors";

export default function MetricsHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { metrics } = useProgressStore();

  const formatNum = (val: any, decimals = 1) => {
    const n = Number(val);
    if (isNaN(n)) return "--";
    return n.toFixed(decimals);
  };

  const sortedMetrics = [...metrics].reverse();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>HISTORIAL DE MEDICIONES</Text>
          <Text style={styles.headerSubtitle}>
            {metrics.length} mediciones en total
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {sortedMetrics.map((m, idx) => (
          <View key={m.id || idx} style={styles.historyRow}>
            {/* Date Column */}
            <View style={styles.dateCol}>
              <Text style={styles.dateMonth}>
                {new Date(m.recordedAt)
                  .toLocaleDateString("en", { month: "short" })
                  .toUpperCase()}
              </Text>
              <Text style={styles.dateDay}>
                {new Date(m.recordedAt).getDate()}
              </Text>
              <Text style={styles.dateYear}>
                {new Date(m.recordedAt).getFullYear()}
              </Text>
            </View>

            {/* Stats Column */}
            <View style={styles.statsCol}>
              <View style={styles.statGrid}>
                {m.weightKg != null && (
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>PESO</Text>
                    <View style={styles.statValueRow}>
                      <Text style={styles.statValue}>
                        {formatNum(m.weightKg)}
                      </Text>
                      <Text style={styles.statUnit}>kg</Text>
                    </View>
                  </View>
                )}
                {m.bodyFatPct != null && (
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>GRASA CORPORAL</Text>
                    <View style={styles.statValueRow}>
                      <Text style={styles.statValue}>
                        {formatNum(m.bodyFatPct)}
                      </Text>
                      <Text style={styles.statUnit}>%</Text>
                    </View>
                  </View>
                )}
                {m.waistCm != null && (
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>CINTURA</Text>
                    <View style={styles.statValueRow}>
                      <Text style={styles.statValue}>
                        {formatNum(m.waistCm, 0)}
                      </Text>
                      <Text style={styles.statUnit}>cm</Text>
                    </View>
                  </View>
                )}
                {m.bmi != null && (
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>BMI</Text>
                    <View style={styles.statValueRow}>
                      <Text style={styles.statValue}>{formatNum(m.bmi)}</Text>
                      <Text style={styles.statUnit}></Text>
                    </View>
                  </View>
                )}
              </View>

              {m.notes && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesText} numberOfLines={2}>
                    {m.notes}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {metrics.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyTitle}>Historial vacío</Text>
            <Text style={styles.emptyText}>
              Ve atrás y registra tu primera medición para verla aquí.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.elevated,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: "ArchivoBlack",
    fontSize: 20,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontFamily: "DMSans-Medium",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  content: {
    padding: 16,
  },
  historyRow: {
    flexDirection: "row",
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  dateCol: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    minWidth: 70,
  },
  dateMonth: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    color: Colors.primary,
    letterSpacing: 1,
  },
  dateDay: {
    fontFamily: "BebasNeue",
    fontSize: 32,
    color: Colors.textPrimary,
    lineHeight: 34,
  },
  dateYear: {
    fontFamily: "DMSans-Regular",
    fontSize: 10,
    color: Colors.textMuted,
  },
  statsCol: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: "center",
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statBox: {
    minWidth: 60,
  },
  statLabel: {
    fontFamily: "DMSans-Bold",
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  statValue: {
    fontFamily: "BebasNeue",
    fontSize: 20,
    color: Colors.textPrimary,
  },
  statUnit: {
    fontFamily: "DMSans-Medium",
    fontSize: 10,
    color: Colors.textTertiary,
  },
  notesBox: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  notesText: {
    fontFamily: "DMSans-Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    fontFamily: "ArchivoBlack",
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  emptyText: {
    fontFamily: "DMSans-Regular",
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 240,
  },
});
