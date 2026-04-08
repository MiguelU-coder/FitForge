// src/components/onboarding/GenderSelector.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import type { Gender } from '../../stores/useOnboardingStore';

interface GenderSelectorProps {
  selected: Gender | null;
  onSelect: (gender: Gender) => void;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const GENDERS: Array<{ value: Gender; label: string; icon: IoniconName; description: string }> = [
  { value: 'MALE', label: 'Masculino', icon: 'male-outline', description: 'Biomecánica masculina' },
  { value: 'FEMALE', label: 'Femenino', icon: 'female-outline', description: 'Biomecánica femenina' },
  { value: 'NON_BINARY', label: 'No binario', icon: 'transgender-outline', description: 'Otro' },
  { value: 'OTHER', label: 'Otro', icon: 'person-circle-outline', description: 'Prefiero no decir' },
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
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
                isSelected && styles.cardSelected,
              ]}
              onPress={() => onSelect(gender.value)}
              accessibilityRole="radio"
              accessibilityLabel={gender.label}
              accessibilityState={{ selected: isSelected }}
            >
              <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                <Ionicons
                  name={gender.icon}
                  size={28}
                  color={isSelected ? Colors.primary : Colors.textSecondary}
                />
              </View>
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
});
