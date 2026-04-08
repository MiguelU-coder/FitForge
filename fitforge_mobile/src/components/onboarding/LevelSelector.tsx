// src/components/onboarding/LevelSelector.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../../theme/colors';
import type { TrainingLevel } from '../../stores/useOnboardingStore';

interface LevelSelectorProps {
  selected: TrainingLevel | null;
  onSelect: (level: TrainingLevel) => void;
}

const LEVELS: Array<{
  value: TrainingLevel;
  label: string;
  description: string;
  frequency: string;
  details: string;
}> = [
  {
    value: 'BEGINNER',
    label: 'Principiante',
    description: 'Nuevo en el gym o sin experiencia previa',
    frequency: '2 días/semana',
    details: 'Full Body • 2×10-12 reps • Descanso 2:30',
  },
  {
    value: 'IRREGULAR',
    label: 'Irregular',
    description: 'Entreno esporádicamente, necesito estructura',
    frequency: '3 días/semana',
    details: 'Upper/Lower • 3×8-10 reps • Descanso 2:30',
  },
  {
    value: 'MEDIUM',
    label: 'Intermedio',
    description: 'Entreno regularmente, busco progression',
    frequency: '4 días/semana',
    details: 'Push/Pull/Legs • 3×8-12 reps • Descanso 2:30',
  },
  {
    value: 'ADVANCED',
    label: 'Avanzado',
    description: 'Tengo experiencia, busco maximizar resultados',
    frequency: '5 días/semana',
    details: 'PPL+ • 4×6-10 reps • Descanso 2:30',
  },
];

export function LevelSelector({ selected, onSelect }: LevelSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Cuál es tu nivel?</Text>
      <Text style={styles.subtitle}>
        Elegí el nivel que mejor describe tu experiencia
      </Text>

      <View style={styles.list}>
        {LEVELS.map((level) => {
          const isSelected = selected === level.value;
          return (
            <Pressable
              key={level.value}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => onSelect(level.value)}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.label, isSelected && styles.labelSelected]}>
                  {level.label}
                </Text>
                <Text style={styles.frequency}>{level.frequency}</Text>
              </View>
              <Text style={styles.description}>{level.description}</Text>
              <Text style={styles.details}>{level.details}</Text>
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
    marginBottom: 24,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}1A`,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  labelSelected: {
    color: Colors.primary,
  },
  frequency: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    backgroundColor: `${Colors.primary}1A`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  details: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: 'monospace',
  },
});
