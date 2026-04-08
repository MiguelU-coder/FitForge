// src/components/onboarding/GoalSelector.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../../theme/colors';
import type { UserGoal } from '../../stores/useOnboardingStore';

interface GoalSelectorProps {
  selected: UserGoal | null;
  onSelect: (goal: UserGoal) => void;
  onSkip: () => void;
}

const GOALS: Array<{ value: UserGoal; label: string; icon: string; description: string }> = [
  { value: 'LOSE_WEIGHT', label: 'Perder peso', icon: '📉', description: 'Reducir grasa corporal' },
  { value: 'KEEP_FIT', label: 'Mantenerse', icon: '⚖️', description: 'Conservar condición física' },
  { value: 'GET_STRONGER', label: 'Ganar fuerza', icon: '💪', description: 'Aumentar fuerza máxima' },
  { value: 'GAIN_MUSCLE_MASS', label: 'Ganar músculo', icon: '🏋️', description: 'Hipertrofia muscular' },
];

export function GoalSelector({ selected, onSelect, onSkip }: GoalSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Cuál es tu objetivo?</Text>
      <Text style={styles.subtitle}>
        Opcional — Esto nos ayuda a personalizar tu programa
      </Text>

      <View style={styles.grid}>
        {GOALS.map((goal) => {
          const isSelected = selected === goal.value;
          return (
            <Pressable
              key={goal.value}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => onSelect(goal.value)}
            >
              <Text style={styles.icon}>{goal.icon}</Text>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {goal.label}
              </Text>
              <Text style={styles.description}>{goal.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipText}>Omitir por ahora</Text>
      </Pressable>
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
    marginBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  card: {
    width: '45%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}1A`,
  },
  icon: {
    fontSize: 32,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  labelSelected: {
    color: Colors.primary,
  },
  description: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  skipButton: {
    marginTop: 32,
    alignSelf: 'center',
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
});
