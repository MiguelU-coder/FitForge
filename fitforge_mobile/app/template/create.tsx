// app/template/create.tsx
// Carbon Forge v3.0 — Create Template Screen

import { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows } from '../../src/theme/colors';
import { useWorkoutStore } from '../../src/stores/useWorkoutStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExercisePickerModal from '../../src/components/ExercisePickerModal';
import { Exercise } from '../../src/types/exercise';
import ExerciseCard from '../../src/components/ExerciseCard';

const GOAL_PRESETS = ['Hypertrophy', 'Strength', 'Endurance', 'Fat Loss', 'Mobility', 'Power'];

export default function CreateTemplateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createRoutine, isLoading } = useWorkoutStore();

  const [routineName, setRoutineName] = useState('');
  const [programName, setProgramName] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedGoalPreset, setSelectedGoalPreset] = useState('');
  const [error, setError] = useState('');

  // Exercise selection state
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isExercisePickerVisible, setIsExercisePickerVisible] = useState(false);

  const handleGoalPreset = (preset: string) => {
    if (selectedGoalPreset === preset) {
      setSelectedGoalPreset('');
      setGoal('');
    } else {
      setSelectedGoalPreset(preset);
      setGoal(preset);
    }
  };

  const handleGoalChange = (text: string) => {
    setGoal(text);
    setSelectedGoalPreset('');
  };

  const handleSave = async () => {
    if (!routineName.trim() || !programName.trim()) {
      setError('Routine name and Program group are required');
      return;
    }
    setError('');
    try {
      const routineId = await createRoutine(programName.trim(), routineName.trim(), goal || undefined);
      
      // Add exercises to the newly created routine
      if (selectedExercises.length > 0) {
        const { addExerciseToRoutine } = useWorkoutStore.getState();
        for (const exercise of selectedExercises) {
          // Defaulting to 3 sets, 10 reps, 2 RIR
          await addExerciseToRoutine(routineId, exercise.id, 3, 10, 2);
        }
      }
      
      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create routine');
    }
  };

  const handleAddExercise = (exercise: Exercise) => {
    if (selectedExercises.some(e => e.id === exercise.id)) {
      return; // Already added
    }
    setSelectedExercises([...selectedExercises, exercise]);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises(selectedExercises.filter(e => e.id !== exerciseId));
  };

  const isFormValid = routineName.trim().length > 0 && programName.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>NEW ROUTINE</Text>
        </View>
        {/* Spacer for symmetry */}
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section: Routine Info ── */}
        <Text style={styles.sectionLabel}>ROUTINE INFO</Text>

        {/* Routine Name */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <Ionicons name="create-outline" size={14} color={Colors.primary} />
            <Text style={styles.fieldLabel}>Routine Name</Text>
            <Text style={styles.requiredBadge}>required</Text>
          </View>
          <View style={[styles.inputWrap, routineName.length > 0 && styles.inputWrapFocused]}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Push Day, Full Body A..."
              placeholderTextColor={Colors.textMuted}
              value={routineName}
              onChangeText={(t) => { setRoutineName(t); setError(''); }}
              autoCapitalize="words"
            />
            {routineName.length > 0 && (
              <Pressable onPress={() => setRoutineName('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Program Group */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <Ionicons name="folder-outline" size={14} color={Colors.primary} />
            <Text style={styles.fieldLabel}>Program Group</Text>
            <Text style={styles.requiredBadge}>required</Text>
          </View>
          <Text style={styles.fieldHint}>Routines are organized into program groups</Text>
          <View style={[styles.inputWrap, programName.length > 0 && styles.inputWrapFocused]}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Hypertrophy Mesocycle 1"
              placeholderTextColor={Colors.textMuted}
              value={programName}
              onChangeText={(t) => { setProgramName(t); setError(''); }}
              autoCapitalize="words"
            />
            {programName.length > 0 && (
              <Pressable onPress={() => setProgramName('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Section: Goal ── */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>TRAINING GOAL</Text>
        <Text style={styles.sectionHint}>Optional — helps tailor recommendations</Text>

        {/* Goal Presets */}
        <View style={styles.presetGrid}>
          {GOAL_PRESETS.map((preset) => {
            const active = selectedGoalPreset === preset;
            return (
              <Pressable
                key={preset}
                style={[styles.presetChip, active && styles.presetChipActive]}
                onPress={() => handleGoalPreset(preset)}
              >
                {active && (
                  <Ionicons name="checkmark" size={13} color={Colors.primary} style={{ marginRight: 4 }} />
                )}
                <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>
                  {preset}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Goal custom text */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <Ionicons name="flag-outline" size={14} color={Colors.primary} />
            <Text style={styles.fieldLabel}>Custom Goal Description</Text>
          </View>
          <View style={[styles.inputWrap, styles.inputWrapMultiline]}>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Describe your goal in detail..."
              placeholderTextColor={Colors.textMuted}
              value={goal}
              onChangeText={handleGoalChange}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* ── Section: Exercises ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>EXERCISES</Text>
          <Text style={styles.exerciseCountBadge}>{selectedExercises.length}</Text>
        </View>
        <Text style={styles.sectionHint}>Add exercises to your routine (optional)</Text>

        <View style={styles.exerciseList}>
          {selectedExercises.map((exercise) => (
            <View key={exercise.id} style={styles.selectedExerciseItem}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName} numberOfLines={1}>{exercise.name}</Text>
                <Text style={styles.exerciseDetail}>3 sets • 10 reps • 2 RIR (Default)</Text>
              </View>
              <Pressable 
                onPress={() => handleRemoveExercise(exercise.id)}
                style={styles.removeExerciseBtn}
              >
                <Ionicons name="remove-circle-outline" size={20} color={Colors.error} />
              </Pressable>
            </View>
          ))}

          <Pressable 
            style={styles.addExerciseBtn} 
            onPress={() => setIsExercisePickerVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.addExerciseBtnText}>ADD EXERCISE</Text>
          </Pressable>
        </View>

        {/* ── Error ── */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Save Button ── */}
        <Pressable
          style={[styles.saveBtn, !isFormValid && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isLoading || !isFormValid}
        >
          <LinearGradient
            colors={isFormValid ? [Colors.primary, Colors.primaryBright] : [Colors.elevated, Colors.elevated]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={isFormValid ? '#FFF' : Colors.textTertiary}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.saveBtnText, !isFormValid && styles.saveBtnTextDisabled]}>
                  CREATE ROUTINE
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        <Text style={styles.saveHint}>
          You can add exercises to your routine after creating it.
        </Text>
      </ScrollView>

      {/* ── Exercise Picker Modal ── */}
      <ExercisePickerModal
        visible={isExercisePickerVisible}
        onClose={() => setIsExercisePickerVisible(false)}
        onSelect={handleAddExercise}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  exerciseCountBadge: {
    backgroundColor: `${Colors.primary}20`,
    color: Colors.primary,
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  exerciseList: {
    marginBottom: 24,
    gap: 10,
  },
  selectedExerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevated,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  exerciseDetail: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  removeExerciseBtn: {
    padding: 8,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${Colors.primary}40`,
    backgroundColor: `${Colors.primary}08`,
  },
  addExerciseBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: Colors.primary,
    letterSpacing: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: `${Colors.elevated}CC`,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },

  // Content
  content: {
    padding: 20,
    paddingBottom: 48,
  },

  // Section labels
  sectionLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.primary,
    marginBottom: 14,
  },
  sectionHint: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: -10,
    marginBottom: 14,
  },

  // Field group
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fieldLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  requiredBadge: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: Colors.textTertiary,
    backgroundColor: `${Colors.border}80`,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fieldHint: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 8,
    marginTop: -2,
  },

  // Input
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputWrapFocused: {
    borderColor: `${Colors.primary}60`,
    backgroundColor: `${Colors.elevated}`,
  },
  inputWrapMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 12,
    minHeight: 90,
  },
  input: {
    flex: 1,
    fontFamily: 'DMSans-Medium',
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  inputMultiline: {
    height: 72,
    paddingTop: 2,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 8,
  },

  // Goal presets
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
  },
  presetChipText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  presetChipTextActive: {
    color: Colors.primary,
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${Colors.error}15`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.error}30`,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.error,
    flex: 1,
  },

  // Save button
  saveBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    ...Shadows.primaryGlow,
  },
  saveBtnDisabled: {
    opacity: 0.5,
    ...Shadows.card,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  saveBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    letterSpacing: 1.5,
    color: '#FFF',
  },
  saveBtnTextDisabled: {
    color: Colors.textTertiary,
  },
  saveHint: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 12,
  },
});
