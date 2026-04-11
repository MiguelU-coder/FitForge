// app/(tabs)/index.tsx
// Port of home_screen.dart — Home dashboard
// Design: Industrial Premium Athletic — "Carbon Forge"

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Shadows } from "../../src/theme/colors";
import { useAuthStore } from "../../src/stores/useAuthStore";
import { useWorkoutStore } from "../../src/stores/useWorkoutStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const {
    activeSession,
    checkForActiveSession,
    startSession,
    history,
    fetchHistory,
    isLoading,
    error: storeError,
    clearError,
    cancelSession,
  } = useWorkoutStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [startError, setStartError] = useState("");
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const sessionLoadTime = useRef<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const isMounted = useRef(true);
  const [sessionJustCancelled, setSessionJustCancelled] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Clear local error when store error changes
  useEffect(() => {
    if (storeError) {
      setStartError(storeError);
    }
  }, [storeError]);

  // Check for active session when screen gains focus
  // Skip if we just cancelled the session to avoid race condition
  useFocusEffect(
    useCallback(() => {
      if (!isCancelling && !sessionJustCancelled) {
        checkForActiveSession();
        fetchHistory();
      }
    }, [checkForActiveSession, fetchHistory, isCancelling, sessionJustCancelled]),
  );

  // Track when session is loaded to detect stale sessions
  useEffect(() => {
    if (activeSession?.id) {
      sessionLoadTime.current = Date.now();
      setIsCancelling(false);
    } else {
      sessionLoadTime.current = null;
    }
  }, [activeSession?.id]);

  // Live timer for active session
  useEffect(() => {
    if (!activeSession?.startedAt) {
      setSessionElapsed(0);
      return;
    }

    const start = new Date(activeSession.startedAt).getTime();
    const updateElapsed = () => {
      if (isMounted.current) {
        setSessionElapsed(Math.floor((Date.now() - start) / 1000));
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.startedAt]);

  const name = user?.displayName?.split(" ")[0] ?? "Atleta";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const motivation =
    hour < 12
      ? "¿Listo para romperla hoy?"
      : hour < 18
        ? "¡Sigue empujando, lo estás haciendo genial!"
        : "El esfuerzo de la noche es diferente";

  const now = new Date();
  const dateStr = now.toLocaleDateString("es-ES", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Helper to format seconds as MM:SS or HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  // Metric Calculations
  const todayStats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySessions = history.filter((s) => {
      if (!s.finishedAt) return false;
      const d = new Date(s.finishedAt);
      return d >= todayStart;
    });
    let sets = 0;
    let tonnage = 0;
    for (const s of todaySessions) {
      for (const block of s.exerciseBlocks) {
        for (const set of block.sets) {
          sets += 1;
          tonnage += Math.round((set.weightKg ?? 0) * (set.reps ?? 0));
        }
      }
    }
    return { count: todaySessions.length, sets, tonnage };
  }, [history]);

  const weekStats = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    const diff = (dayOfWeek + 6) % 7;
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);

    const weekSessions = history.filter((s) => {
      if (!s.finishedAt) return false;
      const d = new Date(s.finishedAt);
      return d >= monday;
    });
    let sets = 0;
    let tonnage = 0;
    let durationMin = 0;
    for (const s of weekSessions) {
      durationMin += Math.floor((s.durationSeconds ?? 0) / 60);
      for (const block of s.exerciseBlocks) {
        for (const set of block.sets) {
          sets += 1;
          tonnage += Math.round((set.weightKg ?? 0) * (set.reps ?? 0));
        }
      }
    }
    return { count: weekSessions.length, sets, tonnage, durationMin };
  }, [history]);

  const streak = useMemo(() => {
    if (history.length === 0) return 0;
    let count = 0;
    const checkDate = new Date();
    checkDate.setHours(23, 59, 59, 999);

    for (let i = 0; i < 365; i++) {
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const hasSession = history.some((s) => {
        if (!s.finishedAt) return false;
        const d = new Date(s.finishedAt);
        return d >= dayStart && d <= checkDate;
      });
      if (!hasSession) break;
      count += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return count;
  }, [history]);

  const weeklyGoal = 5;
  const weekProgress = Math.min(weekStats.count / weeklyGoal, 1);

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar sesión", style: "destructive", onPress: logout },
      ],
    );
  };

  const handleProfileMenu = () => {
    Alert.alert(
      "Perfil",
      "",
      [
        { text: "Ver perfil", onPress: () => router.push("/(tabs)/profile") },
        { text: "Cerrar sesión", style: "destructive", onPress: handleLogout },
        { text: "Cancelar", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  const handleDiscardSession = () => {
    Alert.alert(
      "Descartar sesión",
      "¿Seguro que quieres descartar esta sesión activa? Se perderá el progreso no guardado.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: async () => {
            if (isCancelling) return; // Evitar múltiples cancelaciones

            setIsCancelling(true);
            // Flag para ignorar sesión del backend por unos segundos
            setSessionJustCancelled(true);

            try {
              await cancelSession();
              // Clear any error
              setStartError("");
              clearError?.();
            } catch (error) {
              console.error("Error discarding session:", error);
              if (isMounted.current) {
                setStartError("Error al descartar la sesión");
              }
            } finally {
              if (isMounted.current) {
                setIsCancelling(false);
              }
            }

            // Clear the flag after 3 seconds to allow normal checks again
            setTimeout(() => {
              if (isMounted.current) {
                setSessionJustCancelled(false);
                // Re-check after delay to ensure backend is in sync
                checkForActiveSession();
              }
            }, 3000);
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.background, `${Colors.primary}08`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={styles.heroHeader}>
          <View style={styles.heroLeft}>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>{dateStr}</Text>
            </View>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.nameText}>{name}</Text>
            <View style={styles.motivationRow}>
              <View style={styles.motivationAccent} />
              <Text style={styles.motivationText}>{motivation}</Text>
            </View>
          </View>
          <Pressable style={styles.avatarBtn} onPress={handleProfileMenu}>
            <Ionicons name="person-outline" size={24} color={Colors.primary} />
          </Pressable>
        </View>

        {/* Dynamic Main Card */}
        {isCancelling ? (
          <View
            style={[
              styles.quickStartCard,
              styles.quickStartCardDisabled,
              { marginHorizontal: 16 },
            ]}
          >
            <View style={styles.quickStartContent}>
              <View style={styles.quickStartIconWrap}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 18 }}>
                <Text style={styles.quickStartTitle}>Cancelando sesión...</Text>
                <Text style={styles.quickStartSubtitle}>Por favor espera</Text>
              </View>
            </View>
          </View>
        ) : activeSession ? (
          <View style={styles.activeSessionContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/workout/active")}
              style={styles.activeCardWrapper}
            >
              <LinearGradient
                colors={["#18B97A1A", "#0F3D2240"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeCard}
              >
                <View style={styles.activeContent}>
                  <View style={styles.activeIconContainer}>
                    <Ionicons
                      name="play"
                      size={20}
                      color={Colors.primary}
                      style={{ marginLeft: 2 }}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.activeTag}>EN PROGRESO</Text>
                    <Text style={styles.activeTitle} numberOfLines={1}>
                      {activeSession.name}
                    </Text>
                    <Text style={styles.activeTime}>
                      {formatDuration(sessionElapsed)} transcurrido
                    </Text>
                  </View>
                  <View style={styles.resumeBtn}>
                    <Text style={styles.resumeBtnText}>Reanudar</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            <Pressable onPress={handleDiscardSession} style={styles.discardBtn}>
              <Ionicons name="trash-outline" size={14} color={Colors.error} />
              <Text style={styles.discardBtnText}>Descartar sesión</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            disabled={isLoading}
            onPress={async () => {
              try {
                setStartError("");
                await startSession();
                router.push("/workout/active");
              } catch (e: unknown) {
                const msg =
                  e instanceof Error ? e.message : "Error al iniciar sesión";
                setStartError(msg);
              }
            }}
          >
            <LinearGradient
              colors={["#0F3D22", "#18B97A59"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.quickStartCard,
                isLoading && styles.quickStartCardDisabled,
              ]}
            >
              <View style={styles.quickStartContent}>
                <View style={styles.quickStartIconWrap}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Ionicons name="add" size={28} color={Colors.primary} />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 18 }}>
                  <Text style={styles.quickStartTitle}>
                    {isLoading ? "Iniciando..." : "Iniciar entrenamiento"}
                  </Text>
                  <Text style={styles.quickStartSubtitle}>
                    {isLoading
                      ? "Preparando tu sesión..."
                      : "Toca para comenzar una nueva sesión"}
                  </Text>
                </View>
                {!isLoading && (
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={Colors.primary}
                  />
                )}
              </View>
            </LinearGradient>
          </Pressable>
        )}

        {/* Start Error Banner */}
        {startError ? (
          <View style={styles.startErrorBanner}>
            <View style={styles.errorContent}>
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={Colors.error}
              />
              <Text style={styles.startErrorText}>{startError}</Text>
            </View>
            <Pressable
              onPress={() => {
                setStartError("");
                clearError?.();
              }}
              style={styles.clearErrorBtn}
            >
              <Ionicons name="close" size={18} color={Colors.error} />
            </Pressable>
          </View>
        ) : null}

        {/* Today's Training */}
        {history.length === 0 && !activeSession ? (
          <View
            style={[
              styles.glassCard,
              { flexDirection: "row", alignItems: "center" },
            ]}
          >
            <View style={[styles.flameIconWrap, { borderRadius: 26 }]}>
              <Ionicons name="flash" size={26} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.cardTitle, { marginLeft: 0 }]}>
                ¿Listo para comenzar tu día?
              </Text>
              <Text style={[styles.motivationText, { marginTop: 4 }]}>
                No hay entrenamientos todavía — ¡vamos a cambiar eso!
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.glassCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.flameIconWrap}>
                <Ionicons name="flame" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Entrenamiento de hoy</Text>
              <View style={styles.cardPill}>
                <Text style={styles.cardPillText}>
                  {todayStats.count}{" "}
                  {todayStats.count === 1 ? "entrenamiento" : "entrenamientos"}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItemHalf}>
                <View style={styles.statIconCircle}>
                  <Ionicons name="barbell" size={18} color={Colors.primary} />
                </View>
                <Text style={styles.statNumberBig}>{todayStats.sets}</Text>
                <Text style={styles.statLabelMuted}>Sets</Text>
              </View>
              <View style={styles.statVerticalDivider} />
              <View style={styles.statItemHalf}>
                <View style={styles.statIconCircle}>
                  <Ionicons
                    name="trending-up"
                    size={18}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.statNumberBig}>
                  {todayStats.tonnage > 0 ? `${todayStats.tonnage}kg` : "—"}
                </Text>
                <Text style={styles.statLabelMuted}>Volumen</Text>
              </View>
            </View>
          </View>
        )}

        {/* This Week */}
        <View style={styles.glassCard}>
          <View style={styles.cardHeaderRowSpace}>
            <Text style={styles.sectionLabel}>ESTA SEMANA</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItemThird}>
              <View style={styles.statIconCircle}>
                <Ionicons name="calendar" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.statNumberSmall}>{weekStats.count}</Text>
              <Text style={styles.sectionLabel}>ENTRENAMIENTOS</Text>
            </View>
            <View style={styles.statVerticalDividerShort} />
            <View style={styles.statItemThird}>
              <View style={styles.statIconCircle}>
                <Ionicons name="barbell" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.statNumberSmall}>{weekStats.sets}</Text>
              <Text style={styles.sectionLabel}>SERIES</Text>
            </View>
            <View style={styles.statVerticalDividerShort} />
            <View style={styles.statItemThird}>
              <View style={styles.statIconCircle}>
                <Ionicons name="timer" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.statNumberSmall}>
                {weekStats.durationMin}M
              </Text>
              <Text style={styles.sectionLabel}>TIEMPO</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryBright]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressBarFill,
                  { width: `${Math.round(weekProgress * 100)}%` },
                ]}
              />
            </View>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressTextLeft}>
                {weekStats.count}/{weeklyGoal} entrenamientos
              </Text>
              <Text style={styles.progressTextRight}>
                +{weekStats.tonnage}kg vol
              </Text>
            </View>
          </View>
        </View>

        {/* Streak & PRs */}
        <View style={styles.streakRow}>
          <View style={styles.streakCardWrapper}>
            <View style={[styles.glassCard, styles.streakCard]}>
              <View style={styles.streakCardContent}>
                <LinearGradient
                  colors={[`${Colors.warning}38`, `${Colors.warning}1A`]}
                  style={styles.streakIconWrap}
                >
                  <Ionicons name="flame" size={24} color={Colors.warning} />
                </LinearGradient>
                <View style={styles.streakTextCol}>
                  <Text style={styles.streakNumber}>{streak}</Text>
                  <Text style={styles.streakLabel}>Racha diaria</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.streakCardWrapper}>
            <View style={[styles.glassCard, styles.streakCard]}>
              <View style={styles.streakCardContent}>
                <LinearGradient
                  colors={[`${Colors.pr}38`, `${Colors.pr}1A`]}
                  style={styles.streakIconWrap}
                >
                  <Ionicons name="trophy" size={24} color={Colors.pr} />
                </LinearGradient>
                <View style={styles.streakTextCol}>
                  <Text style={styles.streakNumber}>{history.length}</Text>
                  <Text style={styles.streakLabel}>Total entrenamientos</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { paddingBottom: 110 },

  // Hero
  heroHeader: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "flex-start",
    borderBottomWidth: 0.5,
    borderBottomColor: `${Colors.primary}1A`,
  },
  heroLeft: { flex: 1 },
  datePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}1A`,
    borderWidth: 0.5,
    borderColor: `${Colors.primary}33`,
  },
  datePillText: {
    fontFamily: "DMSans-Bold",
    fontSize: 11,
    letterSpacing: 0.3,
    color: Colors.primary,
  },
  greetingText: {
    fontFamily: "DMSans-Medium",
    fontSize: 13,
    letterSpacing: 0.2,
    color: Colors.textSecondary,
    marginTop: 14,
  },
  nameText: {
    fontFamily: "BebasNeue",
    fontSize: 46,
    letterSpacing: 1,
    color: Colors.textPrimary,
    lineHeight: 46,
    marginTop: 4,
  },
  motivationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  motivationAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  motivationText: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.elevated,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    ...Shadows.primaryGlow,
  },

  // Active Session Card
  activeSessionContainer: {
    marginHorizontal: 16,
  },
  activeCardWrapper: {
    borderRadius: 20,
  },
  activeCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.primary}4D`,
    padding: 16,
    ...Shadows.card,
  },
  discardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingVertical: 8,
    gap: 6,
  },
  discardBtnText: {
    fontFamily: "DMSans-Medium",
    fontSize: 12,
    color: Colors.error,
  },
  activeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  activeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}26`,
    justifyContent: "center",
    alignItems: "center",
  },
  activeTag: {
    fontFamily: "DMSans-Bold",
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.primary,
    marginBottom: 2,
  },
  activeTitle: {
    fontFamily: "DMSans-SemiBold",
    fontSize: 16,
    color: Colors.textPrimary,
  },
  activeTime: {
    fontFamily: "DMSans-Regular",
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  resumeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resumeBtnText: {
    fontFamily: "DMSans-Bold",
    fontSize: 13,
    color: "#FFF",
  },

  // Quick Start Card
  quickStartCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.primary}66`,
    padding: 20,
    ...Shadows.card,
  },
  quickStartCardDisabled: {
    opacity: 0.7,
  },
  quickStartContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  quickStartIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.primary}26`,
    borderWidth: 1.5,
    borderColor: `${Colors.primary}66`,
    justifyContent: "center",
    alignItems: "center",
  },
  quickStartTitle: {
    fontFamily: "ArchivoBlack",
    fontSize: 19,
    letterSpacing: -0.3,
    color: Colors.primary,
  },
  quickStartSubtitle: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // Error Banner
  startErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: `${Colors.error}1A`,
    borderWidth: 1,
    borderColor: `${Colors.error}4D`,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  startErrorText: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: Colors.error,
    flex: 1,
    marginLeft: 8,
  },
  clearErrorBtn: {
    padding: 4,
  },

  // GlassCard
  glassCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: Colors.elevated,
    borderWidth: 0.5,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeaderRowSpace: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  flameIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}1A`,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    flex: 1,
    fontFamily: "ArchivoBlack",
    fontSize: 15,
    letterSpacing: -0.2,
    color: Colors.textPrimary,
    marginLeft: 16,
  },
  cardPill: {
    backgroundColor: `${Colors.primary}1A`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardPillText: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    color: Colors.primary,
  },

  // Stats Grid inside Cards
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  statItemHalf: {
    flex: 1,
    alignItems: "center",
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}1A`,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${Colors.primary}33`,
  },
  statNumberBig: {
    fontFamily: "BebasNeue",
    fontSize: 32,
    color: Colors.textPrimary,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  statNumberSmall: {
    fontFamily: "BebasNeue",
    fontSize: 24,
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statLabelMuted: {
    fontFamily: "DMSans-Medium",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statVerticalDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },
  statVerticalDividerShort: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },

  // Thirds (Week Card)
  statItemThird: {
    flex: 1,
    alignItems: "center",
  },

  // Section
  sectionLabel: {
    fontFamily: "DMSans-Bold",
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    textTransform: "uppercase",
  },

  // Progress Bar
  progressContainer: {
    marginTop: 24,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: `${Colors.border}60`,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressTextLeft: {
    fontFamily: "DMSans-Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressTextRight: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    color: Colors.primary,
  },

  // Streak Row
  streakRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  streakCardWrapper: {
    flex: 1,
  },
  streakCard: {
    marginHorizontal: 0,
    marginTop: 0,
    padding: 14,
  },
  streakCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  streakTextCol: {
    flex: 1,
    justifyContent: "center",
  },
  streakNumber: {
    fontFamily: "BebasNeue",
    fontSize: 30,
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  streakLabel: {
    fontFamily: "DMSans-Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});
