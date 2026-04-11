// app/(auth)/login.tsx
// Port of login_screen.dart — "Industrial Premium Athletic" design
// Reference: lib/features/auth/presentation/screens/login_screen.dart

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
  Alert,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Gradients, Shadows } from "../../src/theme/colors";
import { Typography } from "../../src/theme/typography";
import { Spacing, Radius } from "../../src/theme/spacing";
import { useAuthStore } from "../../src/stores/useAuthStore";

export default function LoginScreen() {
  const router = useRouter();
  const { login, signInWithGoogle, isLoading, error, clearError, isAuthenticated, user } =
    useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Navigate when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('[Login] Authenticated, navigating...');
      if (user?.hasCompletedOnboarding) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/onboarding');
      }
    }
  }, [isAuthenticated, isLoading, user?.hasCompletedOnboarding]);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passError, setPassError] = useState("");
  const passwordRef = useRef<TextInput>(null);

  // ── Fade-in animation ──
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
    if (!email.trim()) {
      setEmailError("Required");
      valid = false;
    } else if (!email.includes("@")) {
      setEmailError("Invalid email");
      valid = false;
    } else setEmailError("");

    if (!password) {
      setPassError("Required");
      valid = false;
    } else setPassError("");

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    clearError();
    console.log('[Login] Starting login...');
    try {
      await login(email.trim(), password);
      console.log('[Login] login() completed');
    } catch (e) {
      console.log('[Login] Error:', e);
    }
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
          {/* ── Brand Mark + Tagline ── */}
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Ionicons name="flash" size={26} color="#FFF" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.brandName}>FITFORGE</Text>
              <Text style={styles.brandTagline}>FORGE YOUR LEGACY</Text>
            </View>
          </View>

          {/* ── Headline ── */}
          <View style={styles.headlineSection}>
            {/* Eyebrow pill */}
            <View style={styles.eyebrowPill}>
              <Text style={styles.eyebrowText}>BIENVENIDO DE NUEVO</Text>
            </View>

            {/* Main title */}
            <Text style={styles.heroTitle}>
              REANUDAR{"\n"}TU{"\n"}ENTRENAMIENTO
            </Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Inicia sesión para seguir tu progreso y continuar construyendo
              fuerza.
            </Text>
          </View>

          {/* ── Form Container ── */}
          <View style={styles.formCard}>
            {/* Email */}
            <Text style={styles.inputLabel}>EMAIL</Text>
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
                style={styles.input}
                placeholder="your@email.com"
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
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>
              CONTRASEÑA
            </Text>
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
                placeholder="Enter your password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setPassError("");
                }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
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

            {/* Forgot password */}
            <Pressable style={styles.forgotBtn}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </Pressable>

            {/* API Error */}
            {error ? (
              <View style={styles.apiError}>
                <Text style={styles.apiErrorText}>{error}</Text>
              </View>
            ) : null}

            {/* Sign In Button */}
            <Pressable
              style={[styles.signInBtn, isLoading && styles.signInBtnDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <View style={styles.signInBtnContent}>
                  <Text style={styles.signInBtnText}>INICIAR SESIÓN</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#FFF"
                    style={{ marginLeft: 8 }}
                  />
                </View>
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
            <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable style={styles.signUpPill}>
                <Text style={styles.signUpText}>Registrarse</Text>
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
  scrollContent: { paddingHorizontal: 28, paddingVertical: 20 },

  // Brand
  brandRow: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.primaryGlow,
  },
  brandName: {
    fontFamily: "BebasNeue",
    fontSize: 24,
    letterSpacing: 2,
    color: Colors.textPrimary,
  },
  brandTagline: {
    fontFamily: "DMSans-SemiBold",
    fontSize: 9,
    letterSpacing: 3,
    color: Colors.textTertiary,
  },

  // Headline
  headlineSection: { marginTop: 32 },
  eyebrowPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${Colors.primary}4D`,
  },
  eyebrowText: {
    fontFamily: "DMSans-Bold",
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.primary,
  },
  heroTitle: {
    fontFamily: "BebasNeue",
    fontSize: 48,
    lineHeight: 48 * 0.9,
    letterSpacing: 1,
    color: Colors.textPrimary,
    marginTop: 12,
  },
  subtitle: {
    fontFamily: "DMSans-Regular",
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    marginTop: 12,
  },

  // Form
  formCard: {
    marginTop: 32,
    padding: 20,
    borderRadius: 20,
    backgroundColor: `${Colors.elevated}E6`,
    borderWidth: 1,
    borderColor: `${Colors.border}CC`,
    ...Shadows.card,
  },
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
  forgotBtn: { alignSelf: "flex-end", marginTop: 8, marginBottom: 8 },
  forgotText: {
    fontFamily: "DMSans-SemiBold",
    fontSize: 13,
    color: Colors.textTertiary,
  },
  apiError: {
    backgroundColor: `${Colors.error}1A`,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  apiErrorText: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: Colors.error,
  },

  // Button
  signInBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    ...Shadows.primaryGlow,
  },
  signInBtnDisabled: { opacity: 0.7 },
  signInBtnContent: { flexDirection: "row", alignItems: "center" },
  signInBtnText: {
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
  signUpPill: {
    backgroundColor: `${Colors.primary}1A`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  signUpText: {
    fontFamily: "DMSans-Bold",
    fontSize: 14,
    color: Colors.primary,
  },
});
