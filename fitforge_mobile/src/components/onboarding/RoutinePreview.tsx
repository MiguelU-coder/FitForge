// src/components/onboarding/RoutinePreview.tsx
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../../theme/colors';
import type { GeneratedProgram } from '../../stores/useOnboardingStore';

interface RoutinePreviewProps {
  program: GeneratedProgram;
  isLoading: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

export function RoutinePreview({ program, isLoading, onConfirm, onBack }: RoutinePreviewProps) {
  const formatRest = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu programa está listo</Text>
      <Text style={styles.subtitle}>
        {program.program.daysPerWeek} días/semana • {program.program.split.replace('_', ' ')}
      </Text>

      <View style={styles.configBadge}>
        <Text style={styles.configText}>
          {program.config.sets} series × {program.config.reps} reps • Descanso {formatRest(program.config.restSeconds)}
        </Text>
        <Text style={styles.configRir}>RIR {program.config.rir.min}-{program.config.rir.max}</Text>
      </View>

      <ScrollView style={styles.routinesList} showsVerticalScrollIndicator={false}>
        {program.routines.map((routine, index) => (
          <View key={routine.id} style={styles.routineCard}>
            <Text style={styles.routineName}>{routine.name}</Text>
            <View style={styles.exercisesList}>
              {routine.items.slice(0, 5).map((item, exIndex) => (
                <View key={exIndex} style={styles.exerciseRow}>
                  <Text style={styles.exerciseName} numberOfLines={1}>
                    {item.exerciseName}
                  </Text>
                  <Text style={styles.exerciseSets}>
                    {item.targetSets}×{item.targetReps}
                  </Text>
                </View>
              ))}
              {routine.items.length > 5 && (
                <Text style={styles.moreText}>+{routine.items.length - 5} más</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.disclaimer}>
          Ejercicios seleccionados por estabilidad y progresión segura
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  configBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}1A`,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  configText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  configRir: {
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: Colors.primary,
    color: Colors.textOnPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  routinesList: {
    flex: 1,
    gap: 12,
  },
  routineCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 12,
  },
  exercisesList: {
    gap: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: 12,
  },
  exerciseSets: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontFamily: 'monospace',
  },
  moreText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  footer: {
    paddingTop: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
