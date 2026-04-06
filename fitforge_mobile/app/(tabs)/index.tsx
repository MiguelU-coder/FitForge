// app/(tabs)/index.tsx
// Port of home_screen.dart — Home dashboard
// Design: Industrial Premium Athletic — "Carbon Forge"

import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Shadows, Gradients } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useWorkoutStore } from '../../src/stores/useWorkoutStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const { activeSession, startSession, history } = useWorkoutStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [startError, setStartError] = useState('');

  const name = user?.displayName?.split(' ')[0] ?? 'Athlete';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const motivation = hour < 12
    ? 'Ready to crush it today?'
    : hour < 18
    ? "Keep pushing, you're doing great!"
    : 'Evening grind hits different';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleProfileMenu = () => {
    Alert.alert(
      'Profile',
      '',
      [
        { text: 'View Profile', onPress: () => router.push('/(tabs)/profile') },
        { text: 'Log Out', style: 'destructive', onPress: handleLogout },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero Header ── */}
      <LinearGradient
        colors={['#0A2016', Colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroHeader}
      >
        <View style={styles.heroLeft}>
          <View style={styles.datePill}>
            <Text style={styles.datePillText}>{dateStr}</Text>
          </View>
          <Text style={styles.greetingText}>{greeting}</Text>
          <Text style={styles.nameText}>{name}</Text>
          <View style={styles.motivationRow}>
            <View style={styles.motivationAccent} />
            <Text style={styles.motivationText}>{motivation}</Text>
          </View>
        </View>
        <Pressable style={styles.avatarBtn} onPress={handleProfileMenu}>
          <Ionicons name="person-outline" size={24} color={Colors.primary} />
        </Pressable>
      </LinearGradient>

      {/* ── Dynamic Main Card (Active Session or Quick Start) ── */}
      {activeSession ? (
        <Pressable onPress={() => router.push('/workout/active')}>
          <LinearGradient
            colors={['#18B97A1A', '#0F3D2240']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activeCard}
          >
            <View style={styles.activeContent}>
              <View style={styles.activeIconContainer}>
                <Ionicons name="play" size={20} color={Colors.primary} style={{ marginLeft: 2 }} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.activeTag}>IN PROGRESS</Text>
                <Text style={styles.activeTitle} numberOfLines={1}>{activeSession.name}</Text>
                <Text style={styles.activeTime}>00:00 elapsed</Text>
              </View>
              <View style={styles.resumeBtn}>
                <Text style={styles.resumeBtnText}>Resume</Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      ) : (
        <Pressable
          onPress={async () => {
            try {
              setStartError('');
              await startSession();
              router.push('/workout/active');
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Error starting session';
              setStartError(msg);
            }
          }}
        >
          <LinearGradient
            colors={['#0F3D22', '#18B97A59']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickStartCard}
          >
            <View style={styles.quickStartContent}>
              <View style={styles.quickStartIconWrap}>
                <Ionicons name="add" size={28} color={Colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 18 }}>
                <Text style={styles.quickStartTitle}>Start Workout</Text>
                <Text style={styles.quickStartSubtitle}>Tap to begin a new session</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </View>
          </LinearGradient>
        </Pressable>
      )}

      {/* ── Start Error Banner ── */}
      {startError ? (
        <View style={styles.startErrorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
          <Text style={styles.startErrorText}>{startError}</Text>
        </View>
      ) : null}

      {/* ── Today's Training ── */}
      <View style={styles.glassCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.flameIconWrap}>
            <Ionicons name="flame" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Today's Training</Text>
          <View style={styles.cardPill}>
            <Text style={styles.cardPillText}>0 workouts</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItemHalf}>
            <View style={styles.statIconCircle}>
              <Ionicons name="barbell" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.statNumberBig}>0</Text>
            <Text style={styles.statLabelMuted}>Sets</Text>
          </View>
          <View style={styles.statVerticalDivider} />
          <View style={styles.statItemHalf}>
            <View style={styles.statIconCircle}>
              <Ionicons name="trending-up" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.statNumberBig}>0kg</Text>
            <Text style={styles.statLabelMuted}>Volume</Text>
          </View>
        </View>
      </View>

      {/* ── This Week ── */}
      <View style={styles.glassCard}>
        <View style={styles.cardHeaderRowSpace}>
          <Text style={styles.sectionLabel}>THIS WEEK</Text>
          <View style={styles.cardPill}>
            <Text style={styles.cardPillText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItemThird}>
            <View style={styles.statIconCircle}>
              <Ionicons name="calendar" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.statNumberSmall}>0</Text>
            <Text style={styles.sectionLabel}>WORKOUTS</Text>
          </View>
          <View style={styles.statVerticalDividerShort} />
          <View style={styles.statItemThird}>
            <View style={styles.statIconCircle}>
              <Ionicons name="barbell" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.statNumberSmall}>0</Text>
            <Text style={styles.sectionLabel}>SETS</Text>
          </View>
          <View style={styles.statVerticalDividerShort} />
          <View style={styles.statItemThird}>
            <View style={styles.statIconCircle}>
              <Ionicons name="timer" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.statNumberSmall}>0m</Text>
            <Text style={styles.sectionLabel}>TIME</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '0%' }]} />
          </View>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressTextLeft}>0/5 workouts</Text>
            <Text style={styles.progressTextRight}>+0kg vol</Text>
          </View>
        </View>
      </View>

      {/* ── Streak & PRs ── */}
      <View style={styles.streakRow}>
        <View style={[styles.glassCard, styles.streakCard]}>
          <View style={styles.streakCardContent}>
            <View style={styles.streakIconWrap}>
              <Ionicons name="flame" size={22} color={Colors.warning} />
            </View>
            <View>
              <Text style={styles.streakNumber}>0</Text>
              <Text style={styles.streakLabel}>Day streak</Text>
            </View>
          </View>
        </View>
        <View style={[styles.glassCard, styles.streakCard]}>
          <View style={styles.streakCardContent}>
            <View style={[styles.streakIconWrap, { backgroundColor: `${Colors.pr}1A` }]}>
              <Ionicons name="trophy" size={22} color={Colors.pr} />
            </View>
            <View>
              <Text style={styles.streakNumber}>0</Text>
              <Text style={styles.streakLabel}>Total workouts</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom spacer for tab bar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 20 },

  // Hero
  heroHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    alignItems: 'flex-start',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  heroLeft: { flex: 1 },
  datePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}1A`,
    borderWidth: 0.5,
    borderColor: `${Colors.primary}33`,
  },
  datePillText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    letterSpacing: 0.3,
    color: Colors.primary,
  },
  greetingText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 14,
  },
  nameText: {
    fontFamily: 'BebasNeue',
    fontSize: 46,
    letterSpacing: 1,
    color: Colors.textPrimary,
    lineHeight: 46,
    marginTop: 0,
  },
  motivationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  motivationAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  motivationText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...Shadows.primaryGlow,
  },

  // Active Session Card
  activeCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.primary}4D`,
    padding: 16,
    ...Shadows.card,
  },
  activeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}26`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTag: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.primary,
    marginBottom: 2,
  },
  activeTitle: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  activeTime: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  resumeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resumeBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: '#FFF',
  },

  // Quick Start Card
  quickStartCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.primary}66`,
    padding: 20,
    ...Shadows.card,
  },
  quickStartContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickStartIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.primary}26`,
    borderWidth: 1.5,
    borderColor: `${Colors.primary}66`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStartTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 20,
    color: Colors.primary,
    letterSpacing: -0.4,
  },
  quickStartSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // Error Banner
  startErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: `${Colors.error}1A`,
    borderWidth: 1,
    borderColor: `${Colors.error}4D`,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  startErrorText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.error,
    flex: 1,
  },

  // GlassCard
  glassCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: Colors.elevated,
    borderWidth: 0.5,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderRowSpace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flameIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontFamily: 'DMSans-Bold',
    fontSize: 17,
    color: Colors.textPrimary,
    marginLeft: 16,
  },
  cardPill: {
    backgroundColor: `${Colors.primary}1A`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardPillText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
    color: Colors.primary,
  },

  // Stats Grid inside Cards
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  statItemHalf: {
    flex: 1,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${Colors.primary}33`,
  },
  statNumberBig: {
    fontFamily: 'BebasNeue',
    fontSize: 32,
    color: Colors.textPrimary,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  statNumberSmall: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statLabelMuted: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statVerticalDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },
  statVerticalDividerShort: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },

  // Thirds (Week Card)
  statItemThird: {
    flex: 1,
    alignItems: 'center',
  },

  // Section
  sectionLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },

  // Progress Bar
  progressContainer: {
    marginTop: 24,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: `${Colors.border}80`,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressTextLeft: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressTextRight: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
    color: Colors.primary,
  },

  // Streak Row
  streakRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  streakCard: {
    flex: 1,
    padding: 14,
  },
  streakCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: `${Colors.warning}1A`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  streakNumber: {
    fontFamily: 'BebasNeue',
    fontSize: 30,
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  streakLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
