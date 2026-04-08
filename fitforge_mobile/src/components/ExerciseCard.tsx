// src/components/ExerciseCard.tsx
// Port of exercise_card.dart — Design System "Carbon Forge"
// Reference: lib/core/widgets/exercise_card.dart

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { Image } from 'expo-image';
import { Colors, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Exercise, formatLabel } from '../types/exercise';
import { getMuscleColor } from '../utils/muscleColors';
import { Ionicons } from '@expo/vector-icons';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: (exercise: Exercise) => void;
  rightAction?: React.ReactNode;
  isSelected?: boolean;
}

export default function ExerciseCard({ exercise, onPress, rightAction, isSelected }: ExerciseCardProps) {
  const selected = isSelected ?? false;
  const [imageError, setImageError] = useState(false);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, selected && styles.cardSelected]}
      onPress={() => onPress?.(exercise)}
      disabled={!onPress}
    >
      <View style={styles.imageContainer}>
        {exercise.imageUrl && !imageError ? (
          <Image
            source={{ uri: exercise.imageUrl }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholderWrap}>
            <Ionicons
              name="barbell"
              size={54}
              color={`${Colors.primary}25`}
            />
          </View>
        )}

        <View style={styles.badgeLeft}>
          <Ionicons name="bookmark" size={12} color="#FFF" />
        </View>
        <View style={styles.badgeRight}>
          <Ionicons name="help" size={14} color="#FFF" />
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={2}>
          {exercise.name}
        </Text>
        {exercise.primaryMuscles.length > 0 && (
          <Text 
            style={[styles.muscleGroup, { color: getMuscleColor(exercise.primaryMuscles[0]) }]} 
            numberOfLines={1}
          >
            {formatLabel(exercise.primaryMuscles[0])}
          </Text>
        )}
      </View>

      {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    overflow: 'hidden',
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardSelected: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#0E1E16',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.primary}40`,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0E1E16',
  },
  badgeLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 12,
    minHeight: 74,
    justifyContent: 'flex-start',
  },
  name: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 3,
    lineHeight: 17,
    letterSpacing: -0.1,
  },
  muscleGroup: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.primary,
  },
  rightAction: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  }
});
