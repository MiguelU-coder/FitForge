// src/components/WorkoutCard.tsx
// Port of workout_card.dart — Design System "Carbon Forge"
// Reference: lib/core/widgets/workout_card.dart

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';
import { WorkoutSession } from '../types/workout';

interface WorkoutCardProps {
  session: WorkoutSession;
  onPress?: (session: WorkoutSession) => void;
  isActive?: boolean;
}

export default function WorkoutCard({ session, onPress, isActive }: WorkoutCardProps) {
  const date = new Date(session.startedAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const durationMin = session.durationSeconds ? Math.floor(session.durationSeconds / 60) : null;
  const numExercises = session.exerciseBlockCount ?? session.exerciseBlocks?.length ?? 0;
  const active = isActive ?? (!session.finishedAt);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, active && styles.cardActive]}
      onPress={() => onPress?.(session)}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{session.name}</Text>
        {active && (
          <View style={styles.activeTag}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>ACTIVE</Text>
          </View>
        )}
      </View>

      {session.notes ? (
        <Text style={styles.subtitle} numberOfLines={2}>{session.notes}</Text>
      ) : null}

      {(durationMin !== null || numExercises > 0) && (
        <View style={styles.statsRow}>
          {durationMin !== null && (
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={13} color={Colors.textTertiary} style={styles.statIconView} />
              <Text style={styles.statValue}>
                {durationMin < 60 ? `${durationMin} min` : `${Math.floor(durationMin / 60)}h ${durationMin % 60}min`}
              </Text>
            </View>
          )}
          {numExercises > 0 && (
            <View style={styles.stat}>
              <Ionicons name="barbell-outline" size={13} color={Colors.textTertiary} style={styles.statIconView} />
              <Text style={styles.statValue}>{numExercises} {numExercises === 1 ? 'exercise' : 'exercises'}</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  cardPressed: {
    backgroundColor: `${Colors.elevated}B3`,
  },
  cardActive: {
    borderColor: `${Colors.primary}80`,
    borderWidth: 1.5,
    ...Shadows.primaryGlow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    fontFamily: 'DMSans-Bold',
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.elevated}80`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statIconView: {
    marginRight: 6,
  },
  statValue: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}33`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primaryBright,
    marginRight: 6,
  },
  activeText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.primaryBright,
  }
});
