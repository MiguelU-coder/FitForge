// src/components/PlateCalculator.tsx
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";

const AVAILABLE_PLATES = [20, 15, 10, 5, 2.5, 1.25];
const BAR_WEIGHT = 20;

const PLATE_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  20: { bg: "#172554", text: "#93C5FD", border: "#2563EB" },
  15: { bg: "#422006", text: "#FDE68A", border: "#D97706" },
  10: { bg: "#052E16", text: "#86EFAC", border: "#16A34A" },
  5:    { bg: "#1C1917", text: "#E7E5E4", border: "#A8A29E" },
  2.5:  { bg: "#450A0A", text: "#FCA5A5", border: "#DC2626" },
  1.25: { bg: "#1C1917", text: "#A8A29E", border: "#57534E" },
};

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (initialWeight) setTargetWeight(initialWeight);
  }, [initialWeight]);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const calculatePlates = (target: number): number[] => {
    let remaining = (target - BAR_WEIGHT) / 2;
    if (remaining <= 0) return [];
    const plates: number[] = [];
    for (const plate of AVAILABLE_PLATES) {
      while (remaining >= plate) {
        plates.push(plate);
        remaining -= plate;
        remaining = Math.round(remaining * 100) / 100;
      }
    }
    return plates;
  };

  const weight = parseFloat(targetWeight);
  const isValidWeight = targetWeight !== "" && !isNaN(weight) && weight > 0;
  const isUnderBar = isValidWeight && weight < BAR_WEIGHT;
  const plates = isValidWeight && !isUnderBar ? calculatePlates(weight) : [];
  const isBarOnly = isValidWeight && !isUnderBar && plates.length === 0;

  const plateVisualSize = (p: number): { h: number; w: number } => {
    if (p >= 20) return { h: 56, w: 13 };
    if (p >= 15) return { h: 50, w: 12 };
    if (p >= 10) return { h: 44, w: 11 };
    if (p >= 5)  return { h: 36, w: 9 };
    if (p >= 2.5) return { h: 28, w: 7 };
    return { h: 22, w: 5 };
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.backdrop, { paddingBottom: keyboardHeight }]}
      >
        <Pressable style={styles.backdropClickArea} onPress={onClose} />
        <View style={styles.sheetWrapper}>
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />

            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIconBadge}>
                  <Ionicons name="barbell-outline" size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.title}>CALCULADORA</Text>
                  <Text style={styles.subtitle}>DE DISCOS</Text>
                </View>
              </View>
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
                <Ionicons name="close" size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.inputSection}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.weightInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  selectionColor={Colors.primary}
                />
                <View style={styles.unitBox}>
                  <Text style={styles.unitText}>KG</Text>
                </View>
              </View>
              <Text style={styles.barHint}>
                <Ionicons name="information-circle-outline" size={12} color={Colors.textTertiary} />
                {"  "}Barra estándar: {BAR_WEIGHT}kg incluida
              </Text>
            </View>

            <View style={styles.resultSection}>
              {!isValidWeight ? (
                <View style={styles.infoPanel}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="bulb-outline" size={16} color={Colors.primary} />
                    <Text style={styles.infoTitle}>¿CÓMO USAR?</Text>
                  </View>
                  <Text style={styles.infoDesc}>
                    Ingresa el peso total que quieres levantar. La calculadora
                    descuenta la barra (20 kg) y te dice exactamente qué discos
                    poner a cada lado.
                  </Text>

                  <View style={styles.legendGrid}>
                    {[
                      { kg: 20, label: "20 kg" },
                      { kg: 15, label: "15 kg" },
                      { kg: 10, label: "10 kg" },
                      { kg: 5,  label: "5 kg"  },
                      { kg: 2.5, label: "2.5 kg" },
                      { kg: 1.25, label: "1.25 kg" },
                    ].map(({ kg, label }) => {
                      const col = PLATE_COLORS[kg] ?? PLATE_COLORS[5];
                      return (
                        <View key={kg} style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendDot,
                              { backgroundColor: col.bg, borderColor: col.border },
                            ]}
                          />
                          <Text style={styles.legendText}>{label}</Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.tipRow}>
                    <Ionicons name="information-circle-outline" size={14} color={Colors.textTertiary} />
                    <Text style={styles.tipText}>
                      Los discos mostrados son <Text style={styles.tipBold}>por cada lado</Text> de la barra.
                    </Text>
                  </View>
                  <View style={styles.tipRow}>
                    <Ionicons name="information-circle-outline" size={14} color={Colors.textTertiary} />
                    <Text style={styles.tipText}>
                      El total confirmado incluye barra + discos × 2.
                    </Text>
                  </View>
                </View>
              ) : isUnderBar ? (
                <View style={styles.messageRow}>
                  <Ionicons name="warning-outline" size={18} color={Colors.warning} />
                  <Text style={styles.warningText}>
                    El peso es menor a la barra ({BAR_WEIGHT}kg)
                  </Text>
                </View>
              ) : isBarOnly ? (
                <View style={styles.messageRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={Colors.success} />
                  <Text style={styles.successText}>¡Solo la barra!</Text>
                </View>
              ) : (
                <>
                  <View style={styles.barbellContainer}>
                    <View style={styles.barbellRow}>
                      <View style={styles.collar} />
                      {[...plates].reverse().map((p, i) => {
                        const { h, w } = plateVisualSize(p);
                        const col = PLATE_COLORS[p] ?? PLATE_COLORS[5];
                        return (
                          <View
                            key={`l${i}`}
                            style={[
                              styles.plateSlice,
                              { height: h, width: w, backgroundColor: col.bg, borderColor: col.border },
                            ]}
                          />
                        );
                      })}
                      <View style={styles.barKnurl} />
                      {plates.map((p, i) => {
                        const { h, w } = plateVisualSize(p);
                        const col = PLATE_COLORS[p] ?? PLATE_COLORS[5];
                        return (
                          <View
                            key={`r${i}`}
                            style={[
                              styles.plateSlice,
                              { height: h, width: w, backgroundColor: col.bg, borderColor: col.border },
                            ]}
                          />
                        );
                      })}
                      <View style={styles.collar} />
                    </View>
                  </View>

                  <Text style={styles.sectionLabel}>DISCOS POR LADO</Text>
                  <View style={styles.platesGrid}>
                    {plates.map((p, i) => {
                      const col = PLATE_COLORS[p] ?? PLATE_COLORS[5];
                      return (
                        <View
                          key={i}
                          style={[
                            styles.plateChip,
                            { backgroundColor: col.bg, borderColor: col.border },
                          ]}
                        >
                          <Text style={[styles.plateChipText, { color: col.text }]}>
                            {p % 1 === 0 ? `${p}` : `${p}`}
                          </Text>
                          <Text style={[styles.plateChipUnit, { color: col.text }]}>kg</Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL CARGADO</Text>
                    <Text style={styles.totalValue}>
                      {BAR_WEIGHT + plates.reduce((s, p) => s + p * 2, 0)} kg
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  backdropClickArea: {
    flex: 1,
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 12,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}18`,
    borderWidth: 1,
    borderColor: `${Colors.primary}35`,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: "BebasNeue",
    fontSize: 22,
    letterSpacing: 2,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  subtitle: {
    fontFamily: "BebasNeue",
    fontSize: 14,
    letterSpacing: 2,
    color: Colors.primary,
    lineHeight: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.elevated,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnPressed: {
    opacity: 0.6,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  weightInput: {
    flex: 1,
    height: 64,
    backgroundColor: Colors.elevated,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    fontFamily: "BebasNeue",
    fontSize: 40,
    color: Colors.primary,
    textAlign: "center",
    letterSpacing: 2,
  },
  unitBox: {
    width: 52,
    height: 64,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}18`,
    borderWidth: 1.5,
    borderColor: `${Colors.primary}40`,
    justifyContent: "center",
    alignItems: "center",
  },
  unitText: {
    fontFamily: "BebasNeue",
    fontSize: 20,
    letterSpacing: 2,
    color: Colors.primary,
  },
  barHint: {
    fontFamily: "DMSans-Regular",
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 8,
    marginLeft: 4,
  },
  resultSection: {
    minHeight: 160,
  },
  infoPanel: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoTitle: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    letterSpacing: 1.5,
    color: Colors.primary,
  },
  infoDesc: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "30%",
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  legendText: {
    fontFamily: "DMSans-Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tipText: {
    fontFamily: "DMSans-Regular",
    fontSize: 12,
    color: Colors.textTertiary,
    flex: 1,
    lineHeight: 17,
  },
  tipBold: {
    fontFamily: "DMSans-Bold",
    color: Colors.textSecondary,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: Colors.elevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  warningText: {
    fontFamily: "DMSans-Medium",
    fontSize: 14,
    color: Colors.warning,
  },
  successText: {
    fontFamily: "DMSans-Bold",
    fontSize: 16,
    color: Colors.success,
  },
  barbellContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  barbellRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  collar: {
    width: 10,
    height: 20,
    backgroundColor: "#525252",
    borderRadius: 3,
  },
  barKnurl: {
    height: 12,
    flex: 1,
    maxWidth: 80,
    backgroundColor: "#404040",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#525252",
  },
  plateSlice: {
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderRadius: 2,
  },
  sectionLabel: {
    fontFamily: "DMSans-Bold",
    fontSize: 11,
    letterSpacing: 1.5,
    color: Colors.textTertiary,
    marginBottom: 10,
  },
  platesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  plateChip: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 2,
  },
  plateChipText: {
    fontFamily: "BebasNeue",
    fontSize: 20,
    letterSpacing: 1,
  },
  plateChipUnit: {
    fontFamily: "DMSans-Bold",
    fontSize: 10,
    opacity: 0.7,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: `${Colors.primary}12`,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  totalLabel: {
    fontFamily: "DMSans-Bold",
    fontSize: 11,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontFamily: "BebasNeue",
    fontSize: 24,
    letterSpacing: 1,
    color: Colors.primary,
  },
});