// app/template/create.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { useWorkoutStore } from '../../src/stores/useWorkoutStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CreateTemplateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createRoutine, isLoading } = useWorkoutStore();

  const [routineName, setRoutineName] = useState('');
  const [programName, setProgramName] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!routineName.trim() || !programName.trim()) {
      setError('Routine name & Program name are required');
      return;
    }

    try {
      await createRoutine(programName.trim(), routineName.trim(), goal);
      router.back();
    } catch (e: any) {
      setError(e.message || 'Failed to create routine');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.title}>NEW ROUTINE</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        
        <View style={styles.card}>
          <Text style={styles.label}>ROUTINE NAME</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Push Day, Full Body A..."
              placeholderTextColor={Colors.textMuted}
              value={routineName}
              onChangeText={setRoutineName}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>PROGRAM GROUP</Text>
          <Text style={styles.hint}>Routines are grouped into programs</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Hypertrophy Mesocycle 1"
              placeholderTextColor={Colors.textMuted}
              value={programName}
              onChangeText={setProgramName}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>PROGRAM GOAL (Optional)</Text>
          <View style={[styles.inputWrap, { height: 100, alignItems: 'flex-start' }]}>
            <TextInput
              style={[styles.input, { paddingTop: 16 }]}
              placeholder="Build mostly upper body mass..."
              placeholderTextColor={Colors.textMuted}
              value={goal}
              onChangeText={setGoal}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable 
          style={[styles.saveBtn, (isLoading || !routineName || !programName) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isLoading || !routineName || !programName}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>CREATE ROUTINE</Text>
          )}
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  backBtn: {
    width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 22,
    backgroundColor: `${Colors.elevated}80`,
  },
  backBtnText: { color: Colors.textPrimary, fontSize: 24 },
  content: { padding: 20 },
  card: {
    marginBottom: 24,
  },
  label: { 
    fontFamily: 'DMSans-Bold', 
    fontSize: 12, 
    letterSpacing: 1.5, 
    color: Colors.textTertiary, 
    marginBottom: 8 
  },
  hint: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: -4,
  },
  inputWrap: {
    backgroundColor: `${Colors.elevated}80`,
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: `${Colors.border}80`,
    paddingHorizontal: 16,
  },
  input: { 
    flex: 1,
    fontFamily: 'DMSans-Medium', 
    fontSize: 16, 
    color: Colors.textPrimary, 
    paddingVertical: 16 
  },
  errorBox: { 
    backgroundColor: `${Colors.error}1A`, 
    borderRadius: 8, 
    padding: 12, 
    marginTop: 8 
  },
  errorText: { 
    fontFamily: 'DMSans-Regular', 
    fontSize: 14, 
    color: Colors.error 
  },
  saveBtn: {
    height: 54, 
    borderRadius: 14, 
    backgroundColor: Colors.primary,
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 32,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { 
    fontFamily: 'DMSans-Bold', 
    fontSize: 15, 
    letterSpacing: 1.5, 
    color: '#FFF' 
  },
});
