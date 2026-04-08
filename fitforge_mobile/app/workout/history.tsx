import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '../../src/stores/useWorkoutStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../../src/theme/colors';

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { history, isLoading, fetchHistory } = useWorkoutStore();

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      month: d.toLocaleDateString('en', { month: 'short' }).toUpperCase(),
      day: d.getDate(),
      year: d.getFullYear(),
      full: d.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
    };
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--';
    const m = Math.floor(seconds / 60);
    return `${m}m`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>WORKOUT HISTORY</Text>
          <Text style={styles.headerSubtitle}>{history.length} Total sessions</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && history.length > 0}
            onRefresh={fetchHistory}
            tintColor={Colors.primary}
          />
        }
      >
        {isLoading && history.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="barbell-outline" size={48} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>NO WORKOUTS YET</Text>
            <Text style={styles.emptyText}>Start your first session to see your progress here.</Text>
            <Pressable 
                style={styles.startBtn}
                onPress={() => router.push('/(tabs)')}
            >
                <Text style={styles.startBtnText}>START WORKOUT</Text>
            </Pressable>
          </View>
        ) : (
          history.map((session) => {
            const date = formatDate(session.finishedAt || session.startedAt);
            const tonnage = session.exerciseBlocks?.reduce((acc, b) => 
               acc + b.sets.reduce((sAcc, s) => sAcc + (Math.round((s.weightKg || 0) * (s.reps || 0))), 0)
            , 0) || 0;

            return (
              <Pressable 
                key={session.id} 
                style={({ pressed }) => [styles.historyCard, pressed && styles.cardPressed]}
                onPress={() => router.push(`/workout/${session.id}`)}
              >
                <View style={styles.dateBadge}>
                  <Text style={styles.dateMonth}>{date.month}</Text>
                  <Text style={styles.dateDay}>{date.day}</Text>
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{session.name}</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.statText}>{formatDuration(session.durationSeconds)}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Ionicons name="trending-up" size={14} color={Colors.textMuted} />
                      <Text style={styles.statText}>{tonnage}kg</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Ionicons name="flash-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.statText}>RPE {session.perceivedExertion || '--'}</Text>
                    </View>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'ArchivoBlack',
    fontSize: 20,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  content: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardPressed: {
    backgroundColor: `${Colors.primary}0D`,
    borderColor: `${Colors.primary}40`,
  },
  dateBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${Colors.primary}33`,
  },
  dateMonth: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 1,
  },
  dateDay: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
    gap: 4,
  },
  cardTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textTertiary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontFamily: 'ArchivoBlack',
    fontSize: 18,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  emptyText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 240,
    lineHeight: 20,
  },
  startBtn: {
    marginTop: 32,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    ...Shadows.primaryGlow,
  },
  startBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: '#FFF',
    letterSpacing: 1,
  },
});
