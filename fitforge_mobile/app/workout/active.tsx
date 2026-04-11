// app/workout/active.tsx
// Design: Industrial Premium Athletic — "Carbon Forge"

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Shadows } from "../../src/theme/colors";
import { useWorkoutStore } from "../../src/stores/useWorkoutStore";
import { useAuthStore } from "../../src/stores/useAuthStore";
import { useAiCoachStore } from "../../src/stores/useAiCoachStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import RestTimer from "../../src/components/RestTimer";
import ExercisePickerModal from "../../src/components/ExercisePickerModal";
import WorkoutSetRow from "../../src/components/WorkoutSetRow";
import AiRecommendationCard from "../../src/components/AiRecommendationCard";
import FinishWorkoutModal from "../../src/components/FinishWorkoutModal";
import PlateCalculator from "../../src/components/PlateCalculator";

const RIR_CYCLE = [undefined, 0, 1, 2, 3, 4] as const;
type RirValue = (typeof RIR_CYCLE)[number];

function nextRir(current: RirValue): RirValue {
  const idx = RIR_CYCLE.indexOf(current);
  return RIR_CYCLE[(idx + 1) % RIR_CYCLE.length];
}

interface SetInputs {
  weight: string;
  reps: string;
  rir: RirValue;
}

export default function ActiveSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    activeSession,
    isLoading,
    error,
    finishSession,
    cancelSession,
    logSet,
    unlogSet,
    deleteSet,
    removeExercise,
    addExercise,
  } = useWorkoutStore();
  const { user } = useAuthStore();
  const { coachResponse, isFetchingCoach, coachError, fetchCoachFeedback } =
    useAiCoachStore();

  const [timerVisible, setTimerVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [restSeconds] = useState(user?.defaultRestSeconds ?? 90);
  const [activeRestSeconds, setActiveRestSeconds] = useState(restSeconds);
  const [openMenuBlockId, setOpenMenuBlockId] = useState<string | null>(null);
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(
    new Set(),
  );
  const [inputs, setInputs] = useState<Record<string, SetInputs>>({});
  const [elapsed, setElapsed] = useState(0);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [drafts, setDrafts] = useState<
    Record<string, { tempId: string; setNumber: number }[]>
  >({});
  const [plateCalcVisible, setPlateCalcVisible] = useState(false);
  const [plateCalcWeight, setPlateCalcWeight] = useState("");

  const onDismissTimer = useCallback(() => setTimerVisible(false), []);
  const onTimerEnd = useCallback(() => setTimerVisible(false), []);

  // ── Session stats ──
  const stats = useMemo(() => {
    if (!activeSession) return { sets: 0, tonnage: 0 };
    return activeSession.exerciseBlocks.reduce(
      (acc, block) => {
        block.sets.forEach((set) => {
          if (set.weightKg != null && set.reps != null) {
            acc.sets += 1;
            acc.tonnage += Math.round(set.weightKg * set.reps);
          }
        });
        return acc;
      },
      { sets: 0, tonnage: 0 },
    );
  }, [activeSession]);

  // ── Timer ──
  useEffect(() => {
    if (!activeSession?.startedAt) return;
    const start = new Date(activeSession.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.startedAt]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  useEffect(() => {
    if (!activeSession && !isLoading) {
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)/templates");
    }
  }, [activeSession, isLoading]);

  // ── Collapse helpers ──
  const toggleCollapsed = (blockId: string) => {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  };

  const collapseAll = () => {
    if (!activeSession) return;
    setCollapsedBlocks(new Set(activeSession.exerciseBlocks.map((b) => b.id)));
  };

  const expandAll = () => setCollapsedBlocks(new Set());

  // ── Actions ──
  const handleFinish = () => setShowFinishModal(true);

  const onConfirmFinish = async (rpe: number) => {
    // Capture stats before finishing (as finish clears activeSession)
    const summaryData = {
      name: activeSession?.name || "Workout",
      duration: formatTime(elapsed),
      tonnage: stats.tonnage.toString(),
      sets: stats.sets.toString(),
      rpe: rpe.toString(),
    };

    await finishSession(rpe);

    // Navigate to summary with params
    router.replace({
      pathname: "/workout/summary",
      params: summaryData,
    });
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancelar Entrenamiento",
      "Esto descartará todo el progreso. ¿Estás seguro?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, Descartar",
          style: "destructive",
          onPress: async () => {
            await cancelSession();
          },
        },
      ],
    );
  };

  const handleDeleteSet = (
    blockId: string,
    setId: string,
    setNumber: number,
    isDraft?: boolean,
  ) => {
    if (isDraft) {
      setDrafts((prev) => ({
        ...prev,
        [blockId]: prev[blockId].filter((d) => d.tempId !== setId),
      }));
      return;
    }

    Alert.alert("Eliminar Serie", `¿Eliminar serie ${setNumber}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteSet(blockId, setId),
      },
    ]);
  };

  const handleRemoveExercise = (blockId: string, exerciseName: string) => {
    setOpenMenuBlockId(null);
    Alert.alert(
      "Eliminar Ejercicio",
      `¿Eliminar "${exerciseName}" de esta sesión?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => removeExercise(blockId),
        },
      ],
    );
  };

  const handleLogSet = async (
    blockId: string,
    setNumber: number,
    setId?: string,
    isDraft?: boolean,
  ) => {
    const key = setId || `${blockId}-new`;
    const input = inputs[key] || { weight: "", reps: "", rir: undefined };

    // Only block if we're trying to "complete" an existing set with empty values.
    // Allow creating a new set (empty or filled).
    if (setId && (!input.weight || !input.reps)) return;

    const weight = parseFloat(input.weight);
    const reps = parseInt(input.reps, 10);

    await logSet({
      blockId,
      setId: isDraft ? undefined : setId,
      setNumber,
      weightKg: isNaN(weight) ? undefined : weight,
      reps: isNaN(reps) ? undefined : reps,
      rir: input.rir,
    });

    // If it was a draft, remove it from drafts after successful log
    if (isDraft) {
      setDrafts((prev) => ({
        ...prev,
        [blockId]: prev[blockId].filter(
          (d) => d.tempId !== (setId || `${blockId}-new`),
        ),
      }));
    }

    if (!setId || isDraft) {
      setInputs((prev) => ({
        ...prev,
        [key]: { weight: "", reps: "", rir: undefined },
      }));

      // Only trigger rest timer and coach feedback if we actually logged data
      if (input.weight && input.reps) {
        if (user && activeSession) {
          const block = activeSession.exerciseBlocks.find(
            (b) => b.id === blockId,
          );
          if (block) {
            // Use exercise specific rest if available
            setActiveRestSeconds(block.restSeconds || restSeconds);
            setTimerVisible(true);

            const formattedSets = [
              ...block.sets,
              {
                weightKg: parseFloat(input.weight),
                reps: parseInt(input.reps, 10),
                rir: input.rir || 2,
              },
            ].map((s: any) => ({
              weight: s.weightKg || 0,
              reps: s.reps || 0,
              rpe: s.rpe || 10 - (s.rir || 2),
              rir: s.rir || 2,
            }));
            fetchCoachFeedback({
              userId: user.id,
              exercise: block.exerciseName,
              sets: formattedSets,
              fatigueScore: 50,
              estimated1RM:
                parseFloat(input.weight) * (1 + parseInt(input.reps, 10) / 30),
              isPR: false,
              injuryRisk: "LOW",
            });
          }
        }
      }
    }
  };

  const updateInput = (
    key: string,
    field: keyof SetInputs,
    value: string | RirValue,
  ) => {
    setInputs((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { weight: "", reps: "", rir: undefined }),
        [field]: value,
      },
    }));
  };

  if (isLoading && !activeSession) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!activeSession) return null;

  const totalBlocks = activeSession.exerciseBlocks.length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={handleCancel} style={styles.cancelBtn} hitSlop={8}>
          <Ionicons name="close" size={24} color={Colors.error} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeSession.name}
          </Text>
          <View style={styles.statsRow}>
            <Text style={styles.statTime}>{formatTime(elapsed)}</Text>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons
                name="barbell-outline"
                size={11}
                color="#0EA5E9"
                style={{ transform: [{ rotate: "-45deg" }] }}
              />
              <Text style={styles.statSets}>{stats.sets}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={11} color="#F59E0B" />
              <Text style={styles.statTonnage}>{stats.tonnage}kg</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons
                name="list-outline"
                size={11}
                color={Colors.textTertiary}
              />
              <Text style={styles.statExercises}>{totalBlocks}</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleFinish}
          style={[styles.finishBtn, isLoading && styles.finishBtnDisabled]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <LinearGradient
              colors={[Colors.primary, Colors.primaryBright]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.finishBtnGradient}
            >
              <Text style={styles.finishBtnText}>Terminar</Text>
            </LinearGradient>
          )}
        </Pressable>
      </View>

      {/* ── Error Banner ── */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={15} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => useWorkoutStore.getState().clearError()}>
            <Ionicons name="close" size={15} color={Colors.textTertiary} />
          </Pressable>
        </View>
      )}

      {/* ── Collapse All / Expand All toolbar ── */}
      {totalBlocks > 1 && (
        <View style={styles.collapseToolbar}>
          <Text style={styles.collapseToolbarLabel}>
            {totalBlocks} Ejercicios
          </Text>
          <View style={styles.collapseToolbarActions}>
            <Pressable onPress={collapseAll} style={styles.collapseToolbarBtn}>
              <Ionicons
                name="remove-circle-outline"
                size={14}
                color={Colors.textSecondary}
              />
              <Text style={styles.collapseToolbarBtnText}>Minimizar Todas</Text>
            </Pressable>
            <View style={styles.collapseToolbarSep} />
            <Pressable onPress={expandAll} style={styles.collapseToolbarBtn}>
              <Ionicons
                name="add-circle-outline"
                size={14}
                color={Colors.textSecondary}
              />
              <Text style={styles.collapseToolbarBtnText}>Expandir Todas</Text>
            </Pressable>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {activeSession.exerciseBlocks.map((block, blockIndex) => {
          const isCollapsed = collapsedBlocks.has(block.id);
          const isMenuOpen = openMenuBlockId === block.id;

          const completedSets = block.sets.filter(
            (s) => s.weightKg != null && s.reps != null,
          ).length;
          const blockTonnage = block.sets.reduce((acc, s) => {
            if (s.weightKg != null && s.reps != null)
              acc += Math.round(s.weightKg * s.reps);
            return acc;
          }, 0);

          const blockDrafts = drafts[block.id] || [];
          const nextSetNumber =
            Math.max(
              block.sets.reduce(
                (max, s) => Math.max(max, s.setNumber || 0),
                0,
              ) || 0,
              blockDrafts.reduce(
                (max, d) => Math.max(max, d.setNumber || 0),
                0,
              ) || 0,
            ) + 1;
          const newKey = `${block.id}-new`;
          const newInput = inputs[newKey] || {
            weight: "",
            reps: "",
            rir: undefined,
          };

          return (
            <View key={block.id} style={styles.blockCard}>
              <View
                style={[
                  styles.blockAccent,
                  completedSets > 0 && { backgroundColor: Colors.primary },
                ]}
              />

              <Pressable
                style={styles.blockHeader}
                onPress={() => toggleCollapsed(block.id)}
                hitSlop={4}
              >
                <View style={styles.blockIndexBadge}>
                  <Text style={styles.blockIndexText}>{blockIndex + 1}</Text>
                </View>

                <View style={styles.blockTitleArea}>
                  <Text style={styles.exerciseName} numberOfLines={1}>
                    {block.exerciseName || "Exercise"}
                  </Text>
                  <View style={styles.blockMeta}>
                    {completedSets > 0 ? (
                      <>
                        <View
                          style={[
                            styles.metaPill,
                            { backgroundColor: `${Colors.primary}20` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.metaPillText,
                              { color: Colors.primary },
                            ]}
                          >
                            {completedSets}/
                            {block.sets.length + blockDrafts.length} sets
                          </Text>
                        </View>
                        {blockTonnage > 0 && (
                          <Text style={styles.metaVolume}>
                            {blockTonnage}kg
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text style={styles.metaEmpty}>
                        {block.sets.length > 0
                          ? `${block.sets.length} sets planned`
                          : "No sets yet"}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.blockHeaderRight}>
                  <Pressable
                    style={styles.menuBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      setOpenMenuBlockId(isMenuOpen ? null : block.id);
                    }}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={20}
                      color={Colors.textSecondary}
                    />
                  </Pressable>
                  <View style={styles.chevronWrap}>
                    <Ionicons
                      name={isCollapsed ? "chevron-down" : "chevron-up"}
                      size={16}
                      color={Colors.textTertiary}
                    />
                  </View>
                </View>
              </Pressable>

              {isMenuOpen && (
                <View style={styles.inlineMenu}>
                  <Pressable
                    style={styles.inlineMenuItem}
                    onPress={() =>
                      handleRemoveExercise(block.id, block.exerciseName)
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={15}
                      color={Colors.error}
                    />
                    <Text style={styles.inlineMenuItemText}>
                      Eliminar Ejercicio
                    </Text>
                  </Pressable>
                </View>
              )}

              {!isCollapsed && (
                <View style={styles.blockBody}>
                  {block.sets.length + blockDrafts.length > 0 && (
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min((completedSets / (block.sets.length + blockDrafts.length)) * 100, 100)}%`,
                          },
                        ]}
                      />
                    </View>
                  )}

                  <View style={styles.colHeaderRow}>
                    <Text style={[styles.colHeader, { width: 28 }]}>SET</Text>
                    <Text
                      style={[styles.colHeader, { width: 40, marginLeft: 6 }]}
                    >
                      KG
                    </Text>
                    <Text
                      style={[styles.colHeader, { width: 120, marginLeft: 6 }]}
                    >
                      REPS
                    </Text>
                    <Text
                      style={[
                        styles.colHeader,
                        { flex: 1, textAlign: "center", marginLeft: 8 },
                      ]}
                    >
                      RIR
                    </Text>
                    <View style={{ width: 70, marginLeft: 4 }} />
                  </View>

                  {block.sets.map((set) => {
                    const inputValue = inputs[set.id] || {
                      weight: set.weightKg?.toString() ?? "",
                      reps: set.reps?.toString() ?? "",
                      rir: set.rir as RirValue,
                    };
                    const isCompleted =
                      set.weightKg != null && set.reps != null;

                    return (
                      <WorkoutSetRow
                        key={set.id}
                        setNumber={set.setNumber}
                        weight={inputValue.weight}
                        reps={inputValue.reps}
                        rir={inputValue.rir}
                        isCompleted={isCompleted}
                        onWeightChange={(val) =>
                          updateInput(set.id, "weight", val)
                        }
                        onRepsChange={(val) => updateInput(set.id, "reps", val)}
                        onRirChange={(val) => updateInput(set.id, "rir", val)}
                        onCheck={() => {
                          if (isCompleted) unlogSet(block.id, set.id);
                          else {
                            if (!inputValue.weight || !inputValue.reps) {
                              Alert.alert(
                                "Campos vacíos",
                                "Por favor ingresa peso y repeticiones.",
                              );
                              return;
                            }
                            handleLogSet(block.id, set.setNumber, set.id);
                          }
                        }}
                        onDelete={() =>
                          handleDeleteSet(block.id, set.id, set.setNumber)
                        }
                        onOpenCalculator={() => {
                          setPlateCalcWeight(inputValue.weight);
                          setPlateCalcVisible(true);
                        }}
                      />
                    );
                  })}

                  {blockDrafts.map((draft) => {
                    const inputValue = inputs[draft.tempId] || {
                      weight: "",
                      reps: "",
                      rir: undefined,
                    };
                    return (
                      <WorkoutSetRow
                        key={draft.tempId}
                        setNumber={draft.setNumber}
                        weight={inputValue.weight}
                        reps={inputValue.reps}
                        rir={inputValue.rir}
                        isCompleted={false}
                        onWeightChange={(val) =>
                          updateInput(draft.tempId, "weight", val)
                        }
                        onRepsChange={(val) =>
                          updateInput(draft.tempId, "reps", val)
                        }
                        onRirChange={(val) =>
                          updateInput(draft.tempId, "rir", val)
                        }
                        onCheck={() =>
                          handleLogSet(
                            block.id,
                            draft.setNumber,
                            draft.tempId,
                            true,
                          )
                        }
                        onDelete={() =>
                          handleDeleteSet(
                            block.id,
                            draft.tempId,
                            draft.setNumber,
                            true,
                          )
                        }
                        onOpenCalculator={() => {
                          setPlateCalcWeight(inputValue.weight);
                          setPlateCalcVisible(true);
                        }}
                      />
                    );
                  })}

                  <View style={styles.newSetArea}>
                    {(isFetchingCoach || coachResponse || coachError) && (
                      <AiRecommendationCard
                        isLoading={
                          isFetchingCoach && !coachResponse && !coachError
                        }
                        message={
                          coachError
                            ? `Error: ${coachError}`
                            : coachResponse?.summary ||
                              coachResponse?.recommendations?.[0] ||
                              coachResponse?.motivation
                        }
                        action={coachError ? "Coach Error" : "Coach Insight"}
                      />
                    )}

                    <Pressable
                      style={styles.addSetBtn}
                      onPress={() => {
                        const tempId = `draft-${Date.now()}`;
                        setDrafts((prev) => ({
                          ...prev,
                          [block.id]: [
                            ...(prev[block.id] || []),
                            { tempId, setNumber: nextSetNumber },
                          ],
                        }));
                      }}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={16}
                        color={Colors.primary}
                      />
                      <Text style={styles.addSetBtnText}>Añadir Set</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {isCollapsed && completedSets > 0 && (
                <View style={styles.collapsedBar}>
                  <LinearGradient
                    colors={[`${Colors.primary}18`, "transparent"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.collapsedBarGradient}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={Colors.primary}
                    />
                    <Text style={styles.collapsedBarText}>
                      {completedSets} set{completedSets !== 1 ? "s" : ""} logged
                      {blockTonnage > 0 ? ` · ${blockTonnage}kg` : ""}
                    </Text>
                    <Text style={styles.collapsedBarTap}>Tap to expand</Text>
                  </LinearGradient>
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* ── Bottom Action Bar ── */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Platform.OS === "ios" ? insets.bottom + 8 : 20 },
        ]}
      >
        <Pressable
          style={styles.addExerciseBtn}
          onPress={() => setPickerVisible(true)}
        >
          <Ionicons name="add" size={20} color={Colors.background} />
          <Text style={styles.addExerciseBtnText}>Añadir Ejercicio</Text>
        </Pressable>
        <Pressable
          style={styles.timerBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTimerVisible(!timerVisible);
          }}
        >
          <Ionicons
            name="timer-outline"
            size={22}
            color={timerVisible ? Colors.primary : Colors.primaryBright}
          />
        </Pressable>
      </View>

      {timerVisible && (
        <RestTimer
          initialSeconds={activeRestSeconds}
          onDismiss={onDismissTimer}
          onTimerEnd={onTimerEnd}
        />
      )}

      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(exercise) => {
          addExercise(exercise.id, exercise.name);
        }}
      />

      <FinishWorkoutModal
        visible={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        onConfirm={onConfirmFinish}
        session={activeSession}
        durationSeconds={elapsed}
      />

      <PlateCalculator
        visible={plateCalcVisible}
        onClose={() => setPlateCalcVisible(false)}
        initialWeight={plateCalcWeight}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  cancelBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${Colors.error}18`,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: "DMSans-Bold",
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statDivider: {
    width: 1,
    height: 10,
    backgroundColor: Colors.border,
  },
  statTime: {
    fontFamily: "BebasNeue",
    fontSize: 15,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  statSets: {
    fontFamily: "BebasNeue",
    fontSize: 15,
    color: "#0EA5E9",
    letterSpacing: 0.5,
  },
  statTonnage: {
    fontFamily: "BebasNeue",
    fontSize: 15,
    color: "#F59E0B",
    letterSpacing: 0.5,
  },
  statExercises: {
    fontFamily: "BebasNeue",
    fontSize: 15,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  finishBtn: {
    borderRadius: 10,
    overflow: "hidden",
    ...Shadows.primaryGlow,
  },
  finishBtnDisabled: { opacity: 0.6 },
  finishBtnGradient: {
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  finishBtnText: {
    fontFamily: "DMSans-Bold",
    fontSize: 13,
    letterSpacing: 0.5,
    color: "#FFF",
  },

  // ── Error Banner ──
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.error}18`,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: `${Colors.error}30`,
  },
  errorText: {
    flex: 1,
    fontFamily: "DMSans-Medium",
    fontSize: 12,
    color: Colors.error,
  },

  // ── Collapse toolbar ──
  collapseToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  collapseToolbarLabel: {
    fontFamily: "DMSans-Medium",
    fontSize: 12,
    color: Colors.textTertiary,
  },
  collapseToolbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  collapseToolbarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  collapseToolbarBtnText: {
    fontFamily: "DMSans-Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  collapseToolbarSep: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
  },

  // ── Content ──
  content: { padding: 14 },

  // ── Block Card ──
  blockCard: {
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: "hidden",
    ...Shadows.card,
  },
  blockAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.border,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },

  // Block Header (tappable)
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20, // account for 4px accent + spacing
    paddingRight: 12,
    paddingVertical: 14,
    gap: 12,
  },
  blockIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}20`,
    borderWidth: 1,
    borderColor: `${Colors.primary}35`,
    justifyContent: "center",
    alignItems: "center",
  },
  blockIndexText: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    color: Colors.primary,
  },
  blockTitleArea: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    fontFamily: "ArchivoBlack",
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  blockMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaPill: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  metaPillText: {
    fontFamily: "DMSans-Bold",
    fontSize: 11,
  },
  metaVolume: {
    fontFamily: "DMSans-Medium",
    fontSize: 11,
    color: Colors.textTertiary,
  },
  metaEmpty: {
    fontFamily: "DMSans-Regular",
    fontSize: 11,
    color: Colors.textTertiary,
  },
  blockHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
  },

  // Inline menu
  inlineMenu: {
    backgroundColor: Colors.card,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    overflow: "hidden",
  },
  inlineMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  inlineMenuItemText: {
    fontFamily: "DMSans-Medium",
    fontSize: 14,
    color: Colors.error,
  },

  // Block body (expanded)
  blockBody: {
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },

  // Progress bar
  progressBar: {
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
    marginTop: 10,
    marginBottom: 2,
    borderRadius: 1,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },

  // Column headers
  colHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  colHeader: {
    fontFamily: "DMSans-Bold",
    fontSize: 9,
    letterSpacing: 1.2,
    color: Colors.textTertiary,
    textTransform: "uppercase",
    textAlign: "center",
  },

  // New set area
  newSetArea: {
    marginTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: `${Colors.border}60`,
    paddingTop: 6,
  },
  addSetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 2,
  },
  addSetBtnText: {
    fontFamily: "DMSans-Bold",
    fontSize: 13,
    color: Colors.primary,
  },
  addSetBtnDisabled: {
    opacity: 0.5,
  },
  addSetBtnTextDisabled: {
    color: Colors.textMuted,
    fontFamily: "DMSans-Regular",
  },

  // Collapsed summary bar
  collapsedBar: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    overflow: "hidden",
  },
  collapsedBarGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 6,
  },
  collapsedBarText: {
    fontFamily: "DMSans-Medium",
    fontSize: 12,
    color: Colors.primary,
    flex: 1,
  },
  collapsedBarTap: {
    fontFamily: "DMSans-Regular",
    fontSize: 11,
    color: Colors.textTertiary,
  },

  // ── Bottom Bar ──
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  addExerciseBtn: {
    flex: 1,
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    ...Shadows.primaryGlow,
  },
  addExerciseBtnText: {
    fontFamily: "DMSans-Bold",
    fontSize: 14,
    color: Colors.textOnPrimary,
  },
  timerBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
    justifyContent: "center",
    alignItems: "center",
  },
});
