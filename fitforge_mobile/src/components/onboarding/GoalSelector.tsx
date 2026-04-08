// src/components/onboarding/GoalSelector.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import type { UserGoal } from '../../stores/useOnboardingStore';

interface GoalSelectorProps {
  selected: UserGoal | null;
  onSelect: (goal: UserGoal) => void;
  onSkip: () => void;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const GOALS: Array<{ value: UserGoal; label: string; icon: IoniconName; description: string }> = [
  { value: 'LOSE_WEIGHT', label: 'Perder peso', icon: 'trending-down-outline', description: 'Reducir grasa corporal' },
  { value: 'KEEP_FIT', label: 'Mantenerse', icon: 'pulse-outline', description: 'Conservar condición física' },
  { value: 'GET_STRONGER', label: 'Ganar fuerza', icon: 'barbell-outline', description: 'Aumentar fuerza máxima' },
  { value: 'GAIN_MUSCLE_MASS', label: 'Ganar músculo', icon: 'body-outline', description: 'Hipertrofia muscular' },
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
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
                isSelected && styles.cardSelected,
              ]}
              onPress={() => onSelect(goal.value)}
              accessibilityRole="radio"
              accessibilityLabel={goal.label}
              accessibilityState={{ selected: isSelected }}
            >
              <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                <Ionicons
                  name={goal.icon}
                  size={28}
                  color={isSelected ? Colors.primary : Colors.textSecondary}
                />
              </View>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {goal.label}
              </Text>
              <Text style={styles.description}>{goal.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={({ pressed }) => [styles.skipButton, pressed && styles.skipButtonPressed]}
        onPress={onSkip}
        accessibilityRole="button"
        accessibilityLabel="Omitir selección de objetivo"
      >
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
    fontFamily: 'BebasNeue',
    fontSize: 32,
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
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
  cardPressed: {
    backgroundColor: Colors.elevated,
    opacity: 0.85,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}1A`,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${Colors.elevated}80`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapSelected: {
    backgroundColor: `${Colors.primary}1A`,
  },
  label: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  labelSelected: {
    color: Colors.primary,
  },
  description: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  skipButton: {
    marginTop: 32,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  skipButtonPressed: {
    opacity: 0.6,
  },
  skipText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 15,
    color: Colors.textTertiary,
  },
});
