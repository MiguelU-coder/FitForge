// src/components/ExerciseCard.tsx
// Port of exercise_card.dart — Design System "Carbon Forge"
// Reference: lib/core/widgets/exercise_card.dart

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Exercise, formatLabel } from '../types/exercise';
import { Ionicons } from '@expo/vector-icons';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: (exercise: Exercise) => void;
  rightAction?: React.ReactNode;
  isSelected?: boolean;
}

export default function ExerciseCard({ exercise, onPress, rightAction, isSelected }: ExerciseCardProps) {
  const selected = isSelected ?? false;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, selected && styles.cardSelected]}
      onPress={() => onPress?.(exercise)}
      disabled={!onPress}
    >
      <View style={styles.content}>
        {exercise.imageUrl ? (
          <Image
            source={{ uri: exercise.imageUrl }}
            style={styles.image}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.placeholderImage, selected && styles.placeholderImageSelected]}>
            <Ionicons
              name="barbell"
              size={28}
              color={selected ? Colors.textOnPrimary : Colors.textTertiary}
            />
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{exercise.name}</Text>
          {exercise.primaryMuscles.length > 0 && (
            <Text style={styles.muscleGroup} numberOfLines={1}>
              {formatLabel(exercise.primaryMuscles[0])}
            </Text>
          )}
        </View>

        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.elevated,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    ...Shadows.card,
  },
  cardPressed: {
    opacity: 0.85,
    backgroundColor: `${Colors.elevated}CC`,
  },
  cardSelected: {
    borderColor: `${Colors.primary}80`,
    borderWidth: 1.5,
    backgroundColor: `${Colors.elevated}E6`,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImageSelected: {
    backgroundColor: Colors.primaryBright,
  },
  info: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  muscleGroup: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  rightAction: {
    marginLeft: 12,
  }
});
