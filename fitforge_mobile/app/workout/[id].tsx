import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '../../src/stores/useWorkoutStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../../src/theme/colors';
import { WorkoutSession } from '../../src/types/workout';
import { LinearGradient } from 'expo-linear-gradient';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fetchSessionById, isLoading } = useWorkoutStore();
  const [session, setSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    if (id) {
      fetchSessionById(id).then(setSession);
    }
  }, [id]);

  const stats = useMemo(() => {
    if (!session) return { sets: 0, tonnage: 0, exercises: 0 };
    let sets = 0;
    let tonnage = 0;
    session.exerciseBlocks.forEach(b => {
      b.sets.forEach(s => {
        if (s.weightKg != null && s.reps != null) {
          sets++;
          tonnage += Math.round(s.weightKg * s.reps);
        }
      });
    });
    return { sets, tonnage, exercises: session.exerciseBlocks.length };
  }, [session]);

  const formatTime = (seconds?: number) => {
    if (!seconds) return '--:--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading && !session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!session) return null;

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{session.name}</Text>
          <Text style={styles.headerDate}>{formatDate(session.finishedAt || session.startedAt)}</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Summary Stats ── */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatTime(session.durationSeconds)}</Text>
            <Text style={styles.statLabel}>DURATION</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.tonnage}kg</Text>
            <Text style={styles.statLabel}>VOLUME</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.sets}</Text>
            <Text style={styles.statLabel}>SETS</Text>
          </View>
        </View>

        {/* ── Intensity ── */}
        <View style={styles.intensityCard}>
            <View style={styles.intensityIcon}>
                <Ionicons name="flash" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.intensityLabel}>INTENSITY (RPE)</Text>
                <Text style={styles.intensityValue}>
                    {session.perceivedExertion || 'Not rated'} / 10
                </Text>
            </View>
            {session.perceivedExertion != null && (
                <View style={styles.intensityPill}>
                    <Text style={styles.intensityPillText}>
                        {session.perceivedExertion >= 9 ? 'HARD' : session.perceivedExertion >= 7 ? 'CHALLENGING' : 'MODERATE'}
                    </Text>
                </View>
            )}
        </View>

        {/* ── Exercises ── */}
        <Text style={styles.sectionTitle}>EXERCISES</Text>
        {session.exerciseBlocks.map((block, idx) => (
          <View key={block.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseIndex}>
                <Text style={styles.exerciseIndexText}>{idx + 1}</Text>
              </View>
              <Text style={styles.exerciseName}>{block.exerciseName}</Text>
            </View>

            <View style={styles.setsTable}>
               <View style={styles.tableHeader}>
                 <Text style={[styles.tableHeaderText, { width: 30 }]}>SET</Text>
                 <Text style={[styles.tableHeaderText, { width: 60 }]}>WEIGHT</Text>
                 <Text style={[styles.tableHeaderText, { width: 40 }]}>REPS</Text>
                 <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>RIR</Text>
               </View>
               {block.sets.map((set) => (
                 <View key={set.id} style={styles.setRow}>
                    <Text style={[styles.setText, { width: 30, color: Colors.textTertiary }]}>{set.setNumber}</Text>
                    <Text style={[styles.setText, { width: 60 }]}>{set.weightKg}kg</Text>
                    <Text style={[styles.setText, { width: 40 }]}>{set.reps}</Text>
                    <Text style={[styles.setText, { flex: 1, textAlign: 'right', color: Colors.primary }]}>
                        {set.rir != null ? `+${set.rir}` : '--'}
                    </Text>
                 </View>
               ))}
            </View>
          </View>
        ))}

        {session.notes && (
            <View style={styles.notesCard}>
                <Text style={styles.notesTitle}>NOTES</Text>
                <Text style={styles.notesText}>{session.notes}</Text>
            </View>
        )}
      </ScrollView>

      {/* ── Share Floating Action (Placeholder) ── */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
        <Pressable 
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8 }]}
          onPress={() => {}}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryBright]}
            style={styles.fabGradient}
          >
            <Ionicons name="share-social" size={20} color="#FFF" />
            <Text style={styles.fabText}>SHARE SUMMARY</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'ArchivoBlack',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  headerDate: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  content: {
    padding: 16,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    ...Shadows.card,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'BebasNeue',
    fontSize: 28,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 9,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.border,
    alignSelf: 'center',
  },
  intensityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevated,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    gap: 16,
  },
  intensityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 9,
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  intensityValue: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  intensityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}20`,
  },
  intensityPillText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    color: Colors.primary,
  },
  sectionTitle: {
    fontFamily: 'ArchivoBlack',
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
    paddingLeft: 4,
  },
  exerciseCard: {
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  exerciseIndex: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${Colors.primary}33`,
  },
  exerciseIndexText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    color: Colors.primary,
  },
  exerciseName: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  setsTable: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: `${Colors.border}80`,
  },
  setText: {
    fontFamily: 'BebasNeue',
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  notesCard: {
    backgroundColor: `${Colors.primary}05`,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
    marginTop: 8,
    borderStyle: 'dashed',
  },
  notesTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 9,
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  notesText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  fabContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  fab: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.primaryGlow,
  },
  fabGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  fabText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: '#FFF',
    letterSpacing: 1,
  },
});
