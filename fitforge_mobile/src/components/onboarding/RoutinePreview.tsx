// src/components/onboarding/RoutinePreview.tsx
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/colors';
import type { GeneratedProgram } from '../../stores/useOnboardingStore';

interface RoutinePreviewProps {
  program: GeneratedProgram;
  isLoading: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SPLIT_LABELS: Record<string, string> = {
  FULL_BODY: 'Full Body',
  UPPER_LOWER: 'Upper / Lower',
  PUSH_PULL_LEGS: 'Push Pull Legs',
  BROSPLIT: 'Bro Split',
};

export function RoutinePreview({ program }: RoutinePreviewProps) {
  const formatRest = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return secs === 0 ? `${mins}m` : `${mins}m ${secs}s`;
  };

  const splitLabel = SPLIT_LABELS[program.program.split] ?? program.program.split.replace(/_/g, ' ');

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* ── Program header ── */}
      <View style={styles.programHeader}>
        <View style={styles.programIconWrap}>
          <LinearGradient
            colors={[`${Colors.primary}30`, `${Colors.primary}08`]}
            style={StyleSheet.absoluteFill}
            borderRadius={44}
          />
          <Ionicons name="calendar-outline" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.programName}>{program.program.name}</Text>

        {/* Badges row */}
        <View style={styles.badgesRow}>
          <View style={styles.badge}>
            <Ionicons name="time-outline" size={13} color={Colors.primary} />
            <Text style={styles.badgeText}>
              {program.program.daysPerWeek} days/week
            </Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="layers-outline" size={13} color={Colors.secondaryBright} />
            <Text style={[styles.badgeText, { color: Colors.secondaryBright }]}>
              {splitLabel}
            </Text>
          </View>
        </View>

        {/* Config pill */}
        <View style={styles.configPill}>
          <Text style={styles.configText}>
            {program.config.sets} sets × {program.config.reps} reps
          </Text>
          <View style={styles.configDivider} />
          <Text style={styles.configText}>
            Rest {formatRest(program.config.restSeconds)}
          </Text>
          <View style={styles.configDivider} />
          <View style={styles.rirBadge}>
            <Text style={styles.rirText}>RIR {program.config.rir.min}–{program.config.rir.max}</Text>
          </View>
        </View>
      </View>

      {/* ── Routine cards ── */}
      <Text style={styles.sectionLabel}>YOUR TRAINING DAYS</Text>

      {program.routines.map((routine, routineIdx) => (
        <View key={routine.id} style={styles.routineCard}>
          {/* Card accent bar */}
          <View style={styles.cardAccent} />

          {/* Day header */}
          <View style={styles.cardHeader}>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>
                {DAY_LABELS[routineIdx] ?? `Day ${routineIdx + 1}`}
              </Text>
            </View>
            <Text style={styles.routineName} numberOfLines={1}>
              {routine.name}
            </Text>
            <View style={styles.exerciseCountBadge}>
              <Text style={styles.exerciseCountText}>{routine.items.length}</Text>
            </View>
          </View>

          {/* Exercise list */}
          <View style={styles.exerciseList}>
            {routine.items.slice(0, 5).map((item, exIdx) => (
              <View key={exIdx} style={styles.exerciseRow}>
                <View style={styles.exerciseIndex}>
                  <Text style={styles.exerciseIndexText}>{exIdx + 1}</Text>
                </View>
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {item.exerciseName}
                </Text>
                <Text style={styles.exerciseSets}>
                  {item.targetSets}×{item.targetReps}
                </Text>
              </View>
            ))}
            {routine.items.length > 5 && (
              <View style={styles.moreRow}>
                <Ionicons name="ellipsis-horizontal" size={13} color={Colors.textTertiary} />
                <Text style={styles.moreText}>
                  {' '}{routine.items.length - 5} more exercise{routine.items.length - 5 === 1 ? '' : 's'}
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}

      {/* ── Footer note ── */}
      <View style={styles.footer}>
        <Ionicons name="shield-checkmark-outline" size={14} color={Colors.textTertiary} />
        <Text style={styles.footerText}>
          Exercises chosen for safe progression and muscle balance
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Program header
  programHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  programIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: `${Colors.primary}25`,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  programName: {
    fontFamily: 'BebasNeue',
    fontSize: 32,
    color: Colors.textPrimary,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${Colors.primary}12`,
    borderWidth: 1,
    borderColor: `${Colors.primary}25`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 12,
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  configPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  configText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  configDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
  },
  rirBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rirText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    color: '#FFF',
    letterSpacing: 0.5,
  },

  // Section label
  sectionLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.textTertiary,
    marginBottom: 12,
  },

  // Routine card
  routineCard: {
    backgroundColor: Colors.elevated,
    borderRadius: 18,
    padding: 16,
    paddingLeft: 20,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  dayBadge: {
    backgroundColor: `${Colors.primary}18`,
    borderWidth: 1,
    borderColor: `${Colors.primary}35`,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dayBadgeText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  routineName: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  exerciseCountBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseCountText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    color: Colors.textSecondary,
  },

  // Exercise list
  exerciseList: {
    gap: 6,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exerciseIndex: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: `${Colors.primary}15`,
    borderWidth: 1,
    borderColor: `${Colors.primary}25`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseIndexText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    color: Colors.primary,
  },
  exerciseName: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  exerciseSets: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 2,
    paddingTop: 2,
  },
  moreText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textTertiary,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  footerText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    flex: 1,
  },
});
