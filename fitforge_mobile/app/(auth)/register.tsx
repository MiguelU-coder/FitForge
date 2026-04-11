// app/(auth)/register.tsx
// Port of register_screen.dart — "Industrial Premium Athletic" design
// Reference: lib/features/auth/presentation/screens/register_screen.dart

import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Shadows } from "../../src/theme/colors";
import { Typography } from "../../src/theme/typography";
import { useAuthStore } from "../../src/stores/useAuthStore";

export default function RegisterScreen() {
  const router = useRouter();
  const { register, signInWithGoogle, isLoading, error, clearError } =
    useAuthStore();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passError, setPassError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  // ── Fade-in animations ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validate = (): boolean => {
    let valid = true;

    // Name validation
    if (!displayName.trim()) {
      setNameError("El nombre es requerido");
      valid = false;
    } else if (displayName.trim().length < 2) {
      setNameError("Min 2 caracteres");
      valid = false;
    } else setNameError("");

    // Email validation
    if (!email.trim()) {
      setEmailError("El correo es requerido");
      valid = false;
    } else if (!email.includes("@")) {
      setEmailError("Correo inválido");
      valid = false;
    } else setEmailError("");

    // Password validation
    if (!password) {
      setPassError("Requerido");
      valid = false;
    } else if (password.length < 8) {
      setPassError("Min 8 caracteres");
      valid = false;
    } else if (!/[A-Z]/.test(password)) {
      setPassError("Incluye una mayúscula");
      valid = false;
    } else if (!/[0-9]/.test(password)) {
      setPassError("Incluye un número");
      valid = false;
    } else setPassError("");

    // Confirm password
    if (confirmPassword !== password) {
      setConfirmError("Las contraseñas no coinciden");
      valid = false;
    } else setConfirmError("");

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    clearError();
    await register(email.trim(), password, displayName.trim());
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={[Colors.background, `${Colors.primary}08`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* ── Back Button ── */}
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>

          {/* ── Header ── */}
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Empieza a registrar tu progreso hoy
          </Text>

          {/* ── Form ── */}
          <View style={styles.form}>
            {/* Display Name */}
            <Text style={styles.inputLabel}>NOMBRE</Text>
            <View
              style={[
                styles.inputContainer,
                nameError ? styles.inputError : null,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color={Colors.textTertiary}
                style={styles.inputIconView}
              />
              <TextInput
                style={styles.input}
                placeholder="¿Cómo te llamamos?"
                placeholderTextColor={Colors.textMuted}
                value={displayName}
                onChangeText={(t) => {
                  setDisplayName(t);
                  setNameError("");
                }}
                returnKeyType="next"
                autoCapitalize="words"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </View>
            {nameError ? (
              <Text style={styles.errorText}>{nameError}</Text>
            ) : null}

            {/* Email */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>EMAIL</Text>
            <View
              style={[
                styles.inputContainer,
                emailError ? styles.inputError : null,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={Colors.textTertiary}
                style={styles.inputIconView}
              />
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setEmailError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            {/* Password */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>PASSWORD</Text>
            <View
              style={[
                styles.inputContainer,
                passError ? styles.inputError : null,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={Colors.textTertiary}
                style={styles.inputIconView}
              />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Min 8 caracteres, 1 mayúscula, 1 número"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setPassError("");
                }}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={Colors.textTertiary}
                />
              </Pressable>
            </View>
            {passError ? (
              <Text style={styles.errorText}>{passError}</Text>
            ) : null}

            {/* Confirm Password */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>
              CONFIRMAR CONTRASEÑA
            </Text>
            <View
              style={[
                styles.inputContainer,
                confirmError ? styles.inputError : null,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={Colors.textTertiary}
                style={styles.inputIconView}
              />
              <TextInput
                ref={confirmRef}
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  setConfirmError("");
                }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>
            {confirmError ? (
              <Text style={styles.errorText}>{confirmError}</Text>
            ) : null}

            {/* API Error */}
            {error ? (
              <View style={styles.apiError}>
                <Text style={styles.apiErrorText}>{error}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <Pressable
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>CREAR CUENTA</Text>
              )}
            </Pressable>
          </View>

          {/* ── Social Login ── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O CONTINÚA CON</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={styles.socialBtn} onPress={signInWithGoogle}>
            <Ionicons name="logo-google" size={20} color={Colors.textPrimary} />
            <Text style={styles.socialLabel}>Google</Text>
          </Pressable>

          {/* ── Footer ── */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable style={styles.signInPill}>
                <Text style={styles.signInText}>Inicia Sesión</Text>
              </Pressable>
            </Link>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 20 },

  // Back button
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.elevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Header
  title: {
    fontFamily: "BebasNeue",
    fontSize: 42,
    letterSpacing: 1,
    color: Colors.textPrimary,
    marginTop: 16,
    lineHeight: 42,
  },
  subtitle: {
    fontFamily: "DMSans-Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
  },

  // Form
  form: { marginTop: 24 },
  inputLabel: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    letterSpacing: 1.5,
    color: Colors.textTertiary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.background}80`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.border}80`,
    paddingHorizontal: 16,
  },
  inputError: { borderColor: Colors.error },
  inputIcon: { fontSize: 16, color: Colors.textTertiary, marginRight: 8 },
  inputIconView: { marginRight: 8 },
  input: {
    flex: 1,
    fontFamily: "DMSans-Medium",
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },
  eyeBtn: { padding: 8 },
  errorText: {
    fontFamily: "DMSans-Regular",
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  apiError: {
    backgroundColor: `${Colors.error}1A`,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  apiErrorText: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: Colors.error,
  },

  // Submit button
  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    ...Shadows.primaryGlow,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: {
    fontFamily: "DMSans-Bold",
    fontSize: 15,
    letterSpacing: 1.5,
    color: "#FFF",
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    fontFamily: "DMSans-SemiBold",
    fontSize: 11,
    letterSpacing: 1,
    color: Colors.textTertiary,
    marginHorizontal: 16,
  },

  // Social
  socialBtn: {
    height: 44,
    borderRadius: 12,
    flexDirection: "row",
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  socialIcon: {
    fontFamily: "DMSans-Bold",
    fontSize: 18,
    color: Colors.textPrimary,
  },
  socialLabel: {
    fontFamily: "DMSans-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginLeft: 8,
  },

  // Footer
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  footerText: {
    fontFamily: "DMSans-Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signInPill: {
    backgroundColor: `${Colors.primary}1A`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  signInText: {
    fontFamily: "DMSans-Bold",
    fontSize: 14,
    color: Colors.primary,
  },
});
