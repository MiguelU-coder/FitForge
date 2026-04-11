// app/exercise/create.tsx
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../src/theme/colors";
import { MUSCLE_GROUPS, formatLabel } from "../../src/types/exercise";
import { useExerciseStore } from "../../src/stores/useExerciseStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CreateExerciseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createCustom, isLoading } = useExerciseStore();

  const [name, setName] = useState("");
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [error, setError] = useState("");

  const toggleMuscle = (muscle: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle)
        ? prev.filter((m) => m !== muscle)
        : [...prev, muscle],
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Introduce el nombre del ejercicio");
      return;
    }
    if (selectedMuscles.length === 0) {
      setError("Selecciona al menos un músculo");
      return;
    }

    try {
      await createCustom(name.trim(), selectedMuscles);
      router.back();
    } catch (e: any) {
      setError(e.message || "Error al crear el ejercicio");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.title}>CREATE EXERCISE</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.label}>EXERCISE NAME</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Press de banca con barra"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>PRIMARY MUSCLES</Text>
        <Text style={styles.sectionSub}>
          Selecciona los músculos principales
        </Text>

        <View style={styles.grid}>
          {MUSCLE_GROUPS.map((muscle) => {
            const isSelected = selectedMuscles.includes(muscle);
            return (
              <Pressable
                key={muscle}
                onPress={() => toggleMuscle(muscle)}
                style={[styles.gridItem, isSelected && styles.gridItemSelected]}
              >
                <Text
                  style={[
                    styles.gridItemText,
                    isSelected && styles.gridItemTextSelected,
                  ]}
                >
                  {formatLabel(muscle)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={[
            styles.saveBtn,
            (isLoading || !name || selectedMuscles.length === 0) &&
              styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={isLoading || !name || selectedMuscles.length === 0}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>CREAR EJERCICIO</Text>
          )}
        </Pressable>

        <View style={{ height: 80 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontFamily: "BebasNeue",
    fontSize: 24,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: `${Colors.elevated}80`,
  },
  backBtnText: { color: Colors.textPrimary, fontSize: 24 },
  content: { padding: 20 },
  card: {
    marginBottom: 32,
  },
  label: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    letterSpacing: 1.5,
    color: Colors.textTertiary,
    marginBottom: 8,
  },
  inputWrap: {
    backgroundColor: `${Colors.elevated}80`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.border}80`,
    paddingHorizontal: 16,
  },
  input: {
    fontFamily: "DMSans-Medium",
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontFamily: "BebasNeue",
    fontSize: 20,
    letterSpacing: 1,
    color: Colors.textPrimary,
  },
  sectionSub: {
    fontFamily: "DMSans-Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gridItemSelected: {
    backgroundColor: `${Colors.primary}1A`,
    borderColor: Colors.primary,
  },
  gridItemText: {
    fontFamily: "DMSans-Medium",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  gridItemTextSelected: {
    color: Colors.primaryBright,
    fontFamily: "DMSans-Bold",
  },
  errorBox: {
    backgroundColor: `${Colors.error}1A`,
    borderRadius: 8,
    padding: 12,
    marginTop: 24,
  },
  errorText: {
    fontFamily: "DMSans-Regular",
    fontSize: 14,
    color: Colors.error,
  },
  saveBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    fontFamily: "DMSans-Bold",
    fontSize: 15,
    letterSpacing: 1.5,
    color: "#FFF",
  },
});
