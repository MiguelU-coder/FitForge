// app/workout/active.tsx
// Design: Industrial Premium Athletic — "Carbon Forge"

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../src/theme/colors';
import { useWorkoutStore } from '../../src/stores/useWorkoutStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RestTimer from '../../src/components/RestTimer';
import ExercisePickerModal from '../../src/components/ExercisePickerModal';

// RIR values: undefined = not set, 0–4 = reps in reserve
const RIR_CYCLE = [undefined, 0, 1, 2, 3, 4] as const;
type RirValue = typeof RIR_CYCLE[number];

function nextRir(current: RirValue): RirValue {
  const idx = RIR_CYCLE.indexOf(current);
  return RIR_CYCLE[(idx + 1) % RIR_CYCLE.length];
}

function rirLabel(rir: RirValue): string {
  return rir === undefined ? '—' : `R${rir}`;
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
    activeSession, isLoading, error,
    finishSession, cancelSession, logSet, deleteSet, removeExercise, addExercise,
  } = useWorkoutStore();
  const { user } = useAuthStore();

  const [timerVisible, setTimerVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [restSeconds] = useState(user?.defaultRestSeconds ?? 90);
  const [openMenuBlockId, setOpenMenuBlockId] = useState<string | null>(null);

  const [inputs, setInputs] = useState<Record<string, SetInputs>>({});

  useEffect(() => {
    if (!activeSession && !isLoading) {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/templates');
    }
  }, [activeSession, isLoading]);

  const handleFinish = () => {
    Alert.alert(
      'Finish Workout',
      "Are you sure you're done?",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Finish', onPress: async () => { await finishSession(); router.back(); } },
      ],
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Workout',
      'This will discard all progress. Are you sure?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Discard', style: 'destructive',
          onPress: async () => { await cancelSession(); router.back(); },
        },
      ],
    );
  };

  const handleDeleteSet = (blockId: string, setId: string, setNumber: number) => {
    Alert.alert(
      'Delete Set',
      `Remove set ${setNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteSet(blockId, setId) },
      ],
    );
  };

  const handleRemoveExercise = (blockId: string, exerciseName: string) => {
    setOpenMenuBlockId(null);
    Alert.alert(
      'Remove Exercise',
      `Remove "${exerciseName}" from this session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeExercise(blockId) },
      ],
    );
  };

  const handleLogSet = async (blockId: string, setNumber: number, setId?: string) => {
    const key = setId || `${blockId}-new`;
    const input = inputs[key] || { weight: '', reps: '', rir: undefined };
    if (!input.weight || !input.reps) return;

    await logSet({
      blockId,
      setId,
      setNumber,
      weightKg: parseFloat(input.weight),
      reps: parseInt(input.reps, 10),
      rir: input.rir,
    });

    if (!setId) {
      setInputs((prev) => ({ ...prev, [key]: { weight: '', reps: '', rir: undefined } }));
      setTimerVisible(true);
    }
  };

  const updateInput = (key: string, field: keyof SetInputs, value: string | RirValue) => {
    setInputs((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || { weight: '', reps: '', rir: undefined }), [field]: value },
    }));
  };

  const cycleRir = (key: string, current: RirValue) => {
    updateInput(key, 'rir', nextRir(current));
  };

  if (isLoading && !activeSession) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!activeSession) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={handleCancel} style={styles.cancelBtn} hitSlop={8}>
          <Ionicons name="close" size={26} color={Colors.error} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.titleText} numberOfLines={1}>{activeSession.name}</Text>
          <Text style={styles.duration}>00:00 elapsed</Text>
        </View>
        <Pressable onPress={handleFinish} style={styles.finishBtn}>
          <Text style={styles.finishBtnText}>FINISH</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {activeSession.exerciseBlocks.map((block) => (
          <View key={block.id} style={styles.blockCard}>
            {/* ── Block Header ── */}
            <View style={styles.blockHeader}>
              <Text style={styles.exerciseName} numberOfLines={1}>{block.exerciseName}</Text>
              <Pressable
                style={styles.menuBtn}
                onPress={() => setOpenMenuBlockId(openMenuBlockId === block.id ? null : block.id)}
                hitSlop={8}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {/* ── Inline Exercise Menu ── */}
            {openMenuBlockId === block.id && (
              <View style={styles.inlineMenu}>
                <Pressable
                  style={styles.inlineMenuItem}
                  onPress={() => handleRemoveExercise(block.id, block.exerciseName)}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  <Text style={styles.inlineMenuItemText}>Remove Exercise</Text>
                </Pressable>
              </View>
            )}

            {/* ── Column Headers ── */}
            <View style={styles.colHeaderRow}>
              <Text style={[styles.colHeader, styles.colSet]}>SET</Text>
              <Text style={[styles.colHeader, styles.colWeight]}>KG</Text>
              <Text style={[styles.colHeader, styles.colReps]}>REPS</Text>
              <Text style={[styles.colHeader, styles.colRir]}>RIR</Text>
              <View style={styles.colCheck} />
              <View style={styles.colDelete} />
            </View>

            {/* ── Existing Sets ── */}
            {block.sets.map((set) => {
              const inputValue = inputs[set.id] || {
                weight: set.weightKg?.toString() ?? '',
                reps: set.reps?.toString() ?? '',
                rir: set.rir as RirValue,
              };
              return (
                <View
                  key={set.id}
                  style={[styles.setRow, set.isPr && styles.prRow]}
                >
                  {/* Set number */}
                  <View style={[styles.colSet, styles.setNumWrap]}>
                    <View style={[styles.setNumPill, set.isPr && styles.setNumPillPr]}>
                      <Text style={[styles.setNumText, set.isPr && styles.setNumTextPr]}>
                        {set.setNumber}
                      </Text>
                    </View>
                  </View>

                  {/* Weight */}
                  <TextInput
                    style={[styles.inputBox, styles.colWeight, styles.inputBoxFilled]}
                    keyboardType="decimal-pad"
                    value={inputValue.weight}
                    onChangeText={(v) => updateInput(set.id, 'weight', v)}
                    onBlur={() => handleLogSet(block.id, set.setNumber, set.id)}
                  />

                  {/* Reps */}
                  <TextInput
                    style={[styles.inputBox, styles.colReps, styles.inputBoxFilled]}
                    keyboardType="number-pad"
                    value={inputValue.reps}
                    onChangeText={(v) => updateInput(set.id, 'reps', v)}
                    onBlur={() => handleLogSet(block.id, set.setNumber, set.id)}
                  />

                  {/* RIR cycler */}
                  <Pressable
                    style={[styles.colRir, styles.rirBtn,
                      inputValue.rir !== undefined && styles.rirBtnSet]}
                    onPress={() => cycleRir(set.id, inputValue.rir)}
                  >
                    <Text style={[styles.rirText, inputValue.rir !== undefined && styles.rirTextSet]}>
                      {rirLabel(inputValue.rir)}
                    </Text>
                  </Pressable>

                  {/* Check */}
                  <Pressable style={styles.colCheck}>
                    <View style={styles.checkActive}>
                      <Ionicons name="checkmark" size={15} color={Colors.background} />
                    </View>
                  </Pressable>

                  {/* Delete */}
                  <Pressable
                    style={styles.colDelete}
                    onPress={() => handleDeleteSet(block.id, set.id, set.setNumber)}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={14} color={Colors.textTertiary} />
                  </Pressable>
                </View>
              );
            })}

            {/* ── New Set Row ── */}
            {(() => {
              const newKey = `${block.id}-new`;
              const newInput = inputs[newKey] || { weight: '', reps: '', rir: undefined };
              return (
                <View style={styles.setRow}>
                  <View style={[styles.colSet, styles.setNumWrap]}>
                    <View style={styles.setNumPillEmpty}>
                      <Text style={styles.setNumTextEmpty}>{block.sets.length + 1}</Text>
                    </View>
                  </View>

                  <TextInput
                    style={[styles.inputBox, styles.colWeight, styles.inputBoxEmpty]}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={Colors.textMuted}
                    value={newInput.weight}
                    onChangeText={(v) => updateInput(newKey, 'weight', v)}
                  />
                  <TextInput
                    style={[styles.inputBox, styles.colReps, styles.inputBoxEmpty]}
                    keyboardType="number-pad"
                    placeholder="—"
                    placeholderTextColor={Colors.textMuted}
                    value={newInput.reps}
                    onChangeText={(v) => updateInput(newKey, 'reps', v)}
                  />

                  <Pressable
                    style={[styles.colRir, styles.rirBtn,
                      newInput.rir !== undefined && styles.rirBtnSet]}
                    onPress={() => cycleRir(newKey, newInput.rir)}
                  >
                    <Text style={[styles.rirText, newInput.rir !== undefined && styles.rirTextSet]}>
                      {rirLabel(newInput.rir)}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.colCheck}
                    onPress={() => handleLogSet(block.id, block.sets.length + 1)}
                  >
                    <View style={styles.checkEmpty}>
                      <Ionicons name="checkmark" size={15} color={Colors.textSecondary} />
                    </View>
                  </Pressable>

                  <View style={styles.colDelete} />
                </View>
              );
            })()}
          </View>
        ))}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* ── Bottom Action Bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 20 }]}>
        <Pressable style={styles.addExerciseBtn} onPress={() => setPickerVisible(true)}>
          <Ionicons name="add" size={22} color={Colors.background} />
          <Text style={styles.addExerciseBtnText}>Add Exercise</Text>
        </Pressable>
        <Pressable style={styles.timerBtn} onPress={() => setTimerVisible(true)}>
          <Ionicons name="timer-outline" size={24} color={Colors.primaryBright} />
        </Pressable>
      </View>

      {timerVisible && (
        <RestTimer
          initialSeconds={restSeconds}
          onDismiss={() => setTimerVisible(false)}
          onTimerEnd={() => setTimerVisible(false)}
        />
      )}

      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(exercise) => { addExercise(exercise.id); }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelBtn: { padding: 4 },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  titleText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  duration: {
    fontFamily: 'DMSans-Medium',
    fontSize: 11,
    color: Colors.primaryBright,
    marginTop: 2,
  },
  finishBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    ...Shadows.primaryGlow,
  },
  finishBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
    letterSpacing: 1,
    color: Colors.textOnPrimary,
  },

  // Content
  content: { padding: 16 },

  blockCard: {
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: Colors.border,
    ...Shadows.card,
  },

  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseName: {
    flex: 1,
    fontFamily: 'ArchivoBlack',
    fontSize: 16,
    color: Colors.primaryBright,
    letterSpacing: 0.3,
    marginRight: 8,
  },
  menuBtn: { padding: 4 },

  // Inline menu
  inlineMenu: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  inlineMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inlineMenuItemText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    color: Colors.error,
  },

  // Table columns (shared widths)
  colSet: { width: 40 },
  colWeight: { flex: 1.2 },
  colReps: { flex: 1 },
  colRir: { width: 44 },
  colCheck: { width: 40, alignItems: 'center', justifyContent: 'center' },
  colDelete: { width: 32, alignItems: 'center', justifyContent: 'center' },

  // Column headers
  colHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 12,
    paddingHorizontal: 2,
  },
  colHeader: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  // Set rows
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 48,
  },
  prRow: {
    backgroundColor: `${Colors.pr}0D`,
    borderRadius: 12,
  },
  setNumWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumPill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setNumPillPr: {
    backgroundColor: `${Colors.pr}33`,
    borderWidth: 1,
    borderColor: `${Colors.pr}80`,
  },
  setNumText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  setNumTextPr: { color: Colors.pr },
  setNumPillEmpty: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: `${Colors.border}80`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setNumTextEmpty: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: Colors.textMuted,
  },

  // Inputs
  inputBox: {
    height: 44,
    borderRadius: 10,
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  inputBoxFilled: {
    backgroundColor: '#172B1F',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  inputBoxEmpty: {
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: `${Colors.border}80`,
  },

  // RIR cycler
  rirBtn: {
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: `${Colors.border}80`,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  rirBtnSet: {
    backgroundColor: `${Colors.accentCyan}1A`,
    borderColor: `${Colors.accentCyan}60`,
  },
  rirText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
    color: Colors.textTertiary,
    letterSpacing: 0.3,
  },
  rirTextSet: {
    color: Colors.accentCyan,
  },

  // Check buttons
  checkActive: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkEmpty: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  addExerciseBtn: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Shadows.primaryGlow,
  },
  addExerciseBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: Colors.textOnPrimary,
  },
  timerBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: `${Colors.primary}4D`,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
