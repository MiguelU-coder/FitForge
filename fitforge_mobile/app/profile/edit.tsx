// app/profile/edit.tsx
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../src/theme/colors";
import { useAuthStore } from "../../src/stores/useAuthStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "../../src/api/client";

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [defaultRestSeconds, setDefaultRestSeconds] = useState(
    user?.defaultRestSeconds?.toString() || "90",
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError("El nombre es requerido");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await updateProfile({
        displayName: displayName.trim(),
        defaultRestSeconds: parseInt(defaultRestSeconds, 10) || 90,
      });

      router.back();
    } catch (e: any) {
      setError(e.message || "Error al actualizar el perfil");
    } finally {
      setIsLoading(false);
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
        <Text style={styles.title}>EDIT PROFILE</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.label}>NOMBRE</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Tu nombre"
              placeholderTextColor={Colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>DESCANSO POR DEFECTO (SEGUNDOS)</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="90"
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
              value={defaultRestSeconds}
              onChangeText={setDefaultRestSeconds}
            />
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>GUARDAR CAMBIOS</Text>
          )}
        </Pressable>
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
  card: { marginBottom: 24 },
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
  errorBox: {
    backgroundColor: `${Colors.error}1A`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
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
    marginTop: 16,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    fontFamily: "DMSans-Bold",
    fontSize: 15,
    letterSpacing: 1.5,
    color: "#FFF",
  },
});
