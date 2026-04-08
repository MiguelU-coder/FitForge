// src/components/onboarding/GenderSelector.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../../theme/colors';
import type { Gender } from '../../stores/useOnboardingStore';

interface GenderSelectorProps {
  selected: Gender | null;
  onSelect: (gender: Gender) => void;
}

const GENDERS: Array<{ value: Gender; label: string; icon: string; description: string }> = [
  { value: 'MALE', label: 'Masculino', icon: '♂️', description: 'Biomecánica masculina' },
  { value: 'FEMALE', label: 'Femenino', icon: '♀️', description: 'Biomecánica femenina' },
  { value: 'NON_BINARY', label: 'No binario', icon: '⚧️', description: 'Otro' },
  { value: 'OTHER', label: 'Otro', icon: '🧑', description: 'Prefiero no decir' },
];

export function GenderSelector({ selected, onSelect }: GenderSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Cómo te identifies?</Text>
      <Text style={styles.subtitle}>
        Esto nos ayuda a adaptar los ejercicios a tu biomecánica
      </Text>

      <View style={styles.grid}>
        {GENDERS.map((gender) => {
          const isSelected = selected === gender.value;
          return (
            <Pressable
              key={gender.value}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => onSelect(gender.value)}
            >
              <Text style={styles.icon}>{gender.icon}</Text>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {gender.label}
              </Text>
              <Text style={styles.description}>{gender.description}</Text>
            </Pressable>
          );
        })}
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
  cardPressed: {
    backgroundColor: Colors.elevated,
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  labelSelected: {
    color: Colors.primary,
  },
  description: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
