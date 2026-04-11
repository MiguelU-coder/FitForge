// src/components/FinishWorkoutModal.tsx
// Carbon Forge v3.0 — Premium bottom-sheet finish modal
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Shadows } from "../theme/colors";
import { WorkoutSession } from "../types/workout";

interface FinishWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (rpe: number) => Promise<void>;
  session: WorkoutSession | null;
  durationSeconds: number;
}

// Each RPE level: display label + accent color + bg tint
const RPE_CONFIG: Record<
  number,
  { label: string; sublabel: string; color: string }
> = {
  1: { label: "MUY FÁCIL", sublabel: "Sin esfuerzo", color: "#10B981" },
  2: { label: "MUY FÁCIL", sublabel: "Muy cómodo", color: "#34D399" },
  3: { label: "FÁCIL", sublabel: "Cómodo", color: "#6EE7B7" },
  4: { label: "FÁCIL", sublabel: "Ligero esfuerzo", color: "#86EFAC" },
  5: { label: "MODERADO", sublabel: "Sostenible", color: "#FCD34D" },
  6: { label: "MODERADO", sublabel: "Algo duro", color: "#F59E0B" },
  7: { label: "DURO", sublabel: "Desafiante", color: "#FB923C" },
  8: { label: "DURO", sublabel: "Muy difícil", color: "#F97316" },
  9: { label: "MUY DIFÍCIL", sublabel: "Casi al límite", color: "#EF4444" },
  10: {
    label: "ESFUERZO MÁXIMO",
    sublabel: "Todo al máximo",
    color: "#DC2626",
  },
};

// Stats config
const STAT_CONFIG = [
  {
    key: "duration",
    icon: "time-outline",
    color: "#0EA5E9",
    label: "DURACIÓN",
  },
  {
    key: "tonnage",
    icon: "barbell-outline",
    color: "#F59E0B",
    label: "VOLUMEN",
  },
  { key: "sets", icon: "layers-outline", color: "#8B5CF6", label: "SERIES" },
] as const;

export default function FinishWorkoutModal({
  visible,
  onClose,
  onConfirm,
  session,
  durationSeconds,
}: FinishWorkoutModalProps) {
  const insets = useSafeAreaInsets();
  const [rpe, setRpe] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CORREGIDO: Verificar que session y exerciseBlocks existan antes de usar reduce
  const stats = useMemo(() => {
    if (
      !session ||
      !session.exerciseBlocks ||
      session.exerciseBlocks.length === 0
    ) {
      return { sets: 0, tonnage: 0 };
    }
    return session.exerciseBlocks.reduce(
      (acc, block) => {
        if (block.sets && block.sets.length > 0) {
          block.sets.forEach((set) => {
            if (set.weightKg != null && set.reps != null) {
              acc.sets += 1;
              acc.tonnage += Math.round(set.weightKg * set.reps);
            }
          });
        }
        return acc;
      },
      { sets: 0, tonnage: 0 },
    );
  }, [session]);

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ""}`.trim();
    return `${s}s`;
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(rpe);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const cfg = RPE_CONFIG[rpe];
  const statValues = {
    duration: formatDuration(durationSeconds),
    tonnage: `${stats.tonnage}kg`,
    sets: String(stats.sets),
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Tap outside to dismiss */}
        <Pressable style={styles.dismissArea} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {/* ── Drag Handle ── */}
          <View style={styles.dragHandle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Hero Header ── */}
            <LinearGradient
              colors={[`${cfg.color}22`, `${cfg.color}06`, "transparent"]}
              style={styles.heroGradient}
            >
              <View
                style={[styles.trophyRing, { borderColor: `${cfg.color}40` }]}
              >
                <LinearGradient
                  colors={[`${cfg.color}30`, `${cfg.color}10`]}
                  style={styles.trophyInner}
                >
                  <Ionicons name="trophy" size={40} color={cfg.color} />
                </LinearGradient>
              </View>
              <Text style={styles.heroTitle}>¡SESIÓN COMPLETADA!</Text>
              <Text style={styles.heroSub}>
                {session?.name ?? "Entrenamiento libre"}
              </Text>
            </LinearGradient>

            {/* ── Stats Cards ── */}
            <View style={styles.statsRow}>
              {STAT_CONFIG.map(({ key, icon, color, label }) => (
                <View key={key} style={styles.statCard}>
                  <LinearGradient
                    colors={[`${color}20`, `${color}08`]}
                    style={styles.statCardGradient}
                  >
                    <View
                      style={[
                        styles.statIconWrap,
                        { backgroundColor: `${color}20` },
                      ]}
                    >
                      <Ionicons name={icon as any} size={18} color={color} />
                    </View>
                    <Text style={[styles.statValue, { color }]}>
                      {statValues[key]}
                    </Text>
                    <Text style={styles.statLabel}>{label}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>

            {/* ── RPE Section ── */}
            <View style={styles.rpeSection}>
              <Text style={styles.sectionTitle}>INTENSIDAD</Text>

              {/* RPE display */}
              <View style={styles.rpeDisplay}>
                <Text style={[styles.rpeNumber, { color: cfg.color }]}>
                  {rpe}
                </Text>
                <View style={styles.rpeTextBlock}>
                  <Text style={[styles.rpeMainLabel, { color: cfg.color }]}>
                    {cfg.label}
                  </Text>
                  <Text style={styles.rpeSublabel}>{cfg.sublabel}</Text>
                </View>
              </View>

              {/* RPE Button Grid: 2 rows × 5 */}
              <View style={styles.rpeGrid}>
                {/* Row 1: 1–5 */}
                <View style={styles.rpeRow}>
                  {[1, 2, 3, 4, 5].map((val) => {
                    const isActive = rpe === val;
                    const isPast = val < rpe;
                    const btnCfg = RPE_CONFIG[val];
                    return (
                      <Pressable
                        key={val}
                        onPress={() => setRpe(val)}
                        style={[
                          styles.rpeBtn,
                          isActive && {
                            borderColor: btnCfg.color,
                            backgroundColor: `${btnCfg.color}25`,
                            shadowColor: btnCfg.color,
                          },
                          isPast && {
                            borderColor: `${btnCfg.color}50`,
                            backgroundColor: `${btnCfg.color}12`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.rpeBtnNumber,
                            isActive && {
                              color: btnCfg.color,
                              fontFamily: "DMSans-Bold",
                            },
                            isPast && { color: `${btnCfg.color}99` },
                          ]}
                        >
                          {val}
                        </Text>
                        {isActive && (
                          <View
                            style={[
                              styles.rpeBtnDot,
                              { backgroundColor: btnCfg.color },
                            ]}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Row 2: 6–10 */}
                <View style={styles.rpeRow}>
                  {[6, 7, 8, 9, 10].map((val) => {
                    const isActive = rpe === val;
                    const isPast = val < rpe;
                    const btnCfg = RPE_CONFIG[val];
                    return (
                      <Pressable
                        key={val}
                        onPress={() => setRpe(val)}
                        style={[
                          styles.rpeBtn,
                          isActive && {
                            borderColor: btnCfg.color,
                            backgroundColor: `${btnCfg.color}25`,
                            shadowColor: btnCfg.color,
                          },
                          isPast && {
                            borderColor: `${btnCfg.color}50`,
                            backgroundColor: `${btnCfg.color}12`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.rpeBtnNumber,
                            isActive && {
                              color: btnCfg.color,
                              fontFamily: "DMSans-Bold",
                            },
                            isPast && { color: `${btnCfg.color}99` },
                          ]}
                        >
                          {val}
                        </Text>
                        {isActive && (
                          <View
                            style={[
                              styles.rpeBtnDot,
                              { backgroundColor: btnCfg.color },
                            ]}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Scale endpoints */}
              <View style={styles.rpeScaleLabels}>
                <Text style={styles.rpeScaleHint}>1 · Ligero</Text>
                <Text style={styles.rpeScaleHint}>10 · Extremo</Text>
              </View>
            </View>

            {/* ── Footer ── */}
            <View style={styles.footer}>
              <Pressable
                style={[
                  styles.confirmBtn,
                  isSubmitting && styles.confirmBtnDisabled,
                ]}
                onPress={handleFinish}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={[cfg.color, cfg.color + "CC"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#FFF"
                        style={{ marginRight: 10 }}
                      />
                      <Text style={styles.confirmBtnText}>
                        FINALIZAR ENTRENAMIENTO
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Ionicons
                  name="chevron-back"
                  size={15}
                  color={Colors.textTertiary}
                />
                <Text style={styles.cancelBtnText}>
                  Volver al entrenamiento
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // ── Overlay & Sheet ──
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: `${Colors.primary}28`,
    maxHeight: "92%",
    ...Shadows.card,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },

  // ── Hero ──
  heroGradient: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  trophyRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  trophyInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    fontFamily: "BebasNeue",
    fontSize: 30,
    color: Colors.textPrimary,
    letterSpacing: 3,
    textAlign: "center",
  },
  heroSub: {
    fontFamily: "DMSans-Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },

  // ── Stats ──
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCardGradient: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 6,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontFamily: "BebasNeue",
    fontSize: 20,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontFamily: "DMSans-Bold",
    fontSize: 8,
    letterSpacing: 1.5,
    color: Colors.textTertiary,
  },

  // ── RPE Section ──
  rpeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "DMSans-Bold",
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.textTertiary,
    marginBottom: 14,
  },
  rpeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  rpeNumber: {
    fontFamily: "BebasNeue",
    fontSize: 80,
    lineHeight: 80,
    letterSpacing: -2,
    width: 64,
    textAlign: "center",
  },
  rpeTextBlock: {
    flex: 1,
  },
  rpeMainLabel: {
    fontFamily: "DMSans-Bold",
    fontSize: 15,
    letterSpacing: 1.5,
  },
  rpeSublabel: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
  },

  // RPE Grid: 2 rows
  rpeGrid: {
    gap: 8,
  },
  rpeRow: {
    flexDirection: "row",
    gap: 8,
  },
  rpeBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.elevated,
    justifyContent: "center",
    alignItems: "center",
    // Shadow when active (set inline)
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  rpeBtnNumber: {
    fontFamily: "DMSans-Medium",
    fontSize: 18,
    color: Colors.textTertiary,
  },
  rpeBtnDot: {
    position: "absolute",
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  rpeScaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingHorizontal: 2,
  },
  rpeScaleHint: {
    fontFamily: "DMSans-Regular",
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },

  // ── Footer ──
  footer: {
    gap: 10,
    paddingTop: 4,
  },
  confirmBtn: {
    borderRadius: 16,
    overflow: "hidden",
    ...Shadows.primaryGlow,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
  },
  confirmBtnText: {
    fontFamily: "DMSans-Bold",
    fontSize: 14,
    color: "#FFF",
    letterSpacing: 1.5,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    gap: 4,
  },
  cancelBtnText: {
    fontFamily: "DMSans-Medium",
    fontSize: 13,
    color: Colors.textTertiary,
  },
});
