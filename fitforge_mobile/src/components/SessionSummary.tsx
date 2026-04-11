// src/components/SessionSummary.tsx
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../theme/colors";
import { WorkoutSession } from "../types/workout";

interface SessionSummaryProps {
  session: WorkoutSession | null;
  visible: boolean;
  onClose: () => void;
}

export default function SessionSummary({
  session,
  visible,
  onClose,
}: SessionSummaryProps) {
  if (!session) return null;

  const totalSets =
    session.exerciseBlocks?.reduce(
      (acc, block) => acc + block.sets.length,
      0,
    ) || 0;
  const totalVolume =
    session.exerciseBlocks?.reduce((acc, block) => {
      return (
        acc +
        block.sets.reduce(
          (setAcc, set) => setAcc + (set.weightKg || 0) * (set.reps || 0),
          0,
        )
      );
    }, 0) || 0;

  const durationMin = session.durationSeconds
    ? Math.floor(session.durationSeconds / 60)
    : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBg}>
        <View style={styles.modalContent}>
          <View style={styles.trophyWrap}>
            <Ionicons name="trophy" size={36} color={Colors.primaryBright} />
          </View>

          <Text style={styles.congrats}>ENTRENAMIENTO COMPLETADO</Text>
          <Text style={styles.title}>{session.name}</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons
                name="time-outline"
                size={16}
                color={Colors.textTertiary}
                style={styles.statIcon}
              />
              <Text style={styles.statLabel}>DURACIÓN</Text>
              <Text style={styles.statValue}>{durationMin}m</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons
                name="barbell-outline"
                size={16}
                color={Colors.textTertiary}
                style={styles.statIcon}
              />
              <Text style={styles.statLabel}>VOLUMEN</Text>
              <Text style={styles.statValue}>{totalVolume} kg</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons
                name="layers-outline"
                size={16}
                color={Colors.textTertiary}
                style={styles.statIcon}
              />
              <Text style={styles.statLabel}>SERIES</Text>
              <Text style={styles.statValue}>{totalSets}</Text>
            </View>
            {session.perceivedExertion ? (
              <View style={styles.statBox}>
                <Ionicons
                  name="pulse-outline"
                  size={16}
                  color={Colors.textTertiary}
                  style={styles.statIcon}
                />
                <Text style={styles.statLabel}>RPE (EFFORT)</Text>
                <Text style={styles.statValue}>
                  {session.perceivedExertion}/10
                </Text>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar resumen del workout"
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryBright]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>LISTO</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${Colors.primary}4D`,
  },
  trophyWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${Colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  congrats: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    letterSpacing: 2,
    color: Colors.primaryBright,
    marginBottom: 6,
  },
  title: {
    fontFamily: "BebasNeue",
    fontSize: 32,
    color: Colors.textPrimary,
    marginBottom: 28,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 28,
    width: "100%",
  },
  statBox: {
    backgroundColor: `${Colors.elevated}80`,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: "45%",
    alignItems: "center",
  },
  statIcon: {
    marginBottom: 6,
  },
  statLabel: {
    fontFamily: "DMSans-Bold",
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.textTertiary,
    marginBottom: 6,
  },
  statValue: {
    fontFamily: "BebasNeue",
    fontSize: 28,
    color: Colors.secondaryBright,
  },
  closeBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  closeBtnText: {
    fontFamily: "DMSans-Bold",
    fontSize: 15,
    letterSpacing: 2,
    color: "#FFF",
  },
});
