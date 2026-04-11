// src/components/PlateCalculator.tsx
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";

const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const BAR_WEIGHT = 20;

interface PlateCalculatorProps {
  visible: boolean;
  onClose: () => void;
  initialWeight?: string;
}

export default function PlateCalculator({
  visible,
  onClose,
  initialWeight,
}: PlateCalculatorProps) {
  const [targetWeight, setTargetWeight] = useState(initialWeight || "");

  // Update target weight if initialWeight changes
  useEffect(() => {
    if (initialWeight) setTargetWeight(initialWeight);
  }, [initialWeight]);

  // Calculates plates for ONE side of the bar
  const calculatePlates = (target: number) => {
    let remaining = (target - BAR_WEIGHT) / 2;
    if (remaining <= 0) return [];

    const plates: number[] = [];
    for (const plate of AVAILABLE_PLATES) {
      while (remaining >= plate) {
        plates.push(plate);
        remaining -= plate;
        remaining = Math.round(remaining * 100) / 100; // fix float precision
      }
    }
    return plates;
  };

  const plates = targetWeight ? calculatePlates(parseFloat(targetWeight)) : [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBg}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>CALCULADORA DE DISCOS</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && styles.closeBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cerrar calculadora"
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>PESO TOTAL (KG)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              autoFocus
              placeholder="100"
              placeholderTextColor={Colors.textMuted}
              value={targetWeight}
              onChangeText={setTargetWeight}
              selectionColor={Colors.primary}
            />
            <Text style={styles.hint}>Asume una barra estándar de 20kg.</Text>
          </View>

          <View style={styles.resultArea}>
            <Text style={styles.resultTitle}>DISCOS POR LADO</Text>
            {targetWeight && parseFloat(targetWeight) < 20 ? (
              <Text style={styles.errorText}>
                El peso es menor que la barra (20kg)
              </Text>
            ) : targetWeight && plates.length === 0 ? (
              <Text style={styles.successText}>¡Solo la barra!</Text>
            ) : plates.length > 0 ? (
              <View style={styles.platesRow}>
                {plates.map((p, i) => (
                  <View key={i} style={styles.plate}>
                    <Text style={styles.plateText}>{p}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Enter a weight to calculate</Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "BebasNeue",
    fontSize: 24,
    letterSpacing: 1,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${Colors.elevated}80`,
    borderRadius: 18,
  },
  closeBtnPressed: {
    opacity: 0.6,
    backgroundColor: Colors.elevated,
  },
  inputWrap: { marginBottom: 24 },
  label: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: `${Colors.elevated}80`,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontFamily: "BebasNeue",
    fontSize: 32,
    color: Colors.primary,
    textAlign: "center",
  },
  hint: {
    fontFamily: "DMSans-Regular",
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 8,
    textAlign: "center",
  },
  resultArea: {
    alignItems: "center",
    backgroundColor: `${Colors.elevated}4D`,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultTitle: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
    letterSpacing: 1.5,
  },
  platesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  plate: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  plateText: {
    fontFamily: "BebasNeue",
    fontSize: 24,
    color: "#FFF",
  },
  errorText: {
    fontFamily: "DMSans-Medium",
    fontSize: 14,
    color: Colors.error,
  },
  successText: {
    fontFamily: "DMSans-Bold",
    fontSize: 18,
    color: Colors.success,
  },
  emptyText: {
    fontFamily: "DMSans-Medium",
    fontSize: 14,
    color: Colors.textTertiary,
  },
});
