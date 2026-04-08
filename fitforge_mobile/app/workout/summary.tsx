import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../src/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import ConfettiCannon from 'react-native-confetti-cannon'; // Note: User might need to install this, but I'll stick to native for now or simple animations

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WorkoutSummaryScreen() {
  const { name, duration, tonnage, sets, rpe } = useLocalSearchParams<{ 
    name: string; 
    duration: string; 
    tonnage: string; 
    sets: string; 
    rpe: string; 
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D2016', Colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Celebration Header ── */}
        <View style={styles.header}>
            <View style={styles.trophyContainer}>
                <LinearGradient
                    colors={[Colors.primary, Colors.primaryBright]}
                    style={styles.trophyGradient}
                >
                    <Ionicons name="trophy" size={48} color="#FFF" />
                </LinearGradient>
                {/* Subtle rings */}
                <View style={[styles.trophyRing, { width: 120, height: 120, opacity: 0.3 }]} />
                <View style={[styles.trophyRing, { width: 150, height: 150, opacity: 0.1 }]} />
            </View>

            <Text style={styles.title}>WORKOUT COMPLETE!</Text>
            <Text style={styles.subtitle}>Another step closer to your peak potential.</Text>
        </View>

        {/* ── Main Stats Card ── */}
        <View style={styles.mainCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderTitle}>{name || 'Great Session'}</Text>
                <View style={styles.datePill}>
                    <Text style={styles.datePillText}>TODAY</Text>
                </View>
            </View>

            <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                    <View style={[styles.statIconWrap, { backgroundColor: '#0EA5E920' }]}>
                        <Ionicons name="time" size={20} color="#0EA5E9" />
                    </View>
                    <Text style={styles.statValue}>{duration || '00:00'}</Text>
                    <Text style={styles.statLabel}>DURATION</Text>
                </View>

                <View style={[styles.statItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border }]}>
                    <View style={[styles.statIconWrap, { backgroundColor: '#F59E0B20' }]}>
                        <Ionicons name="barbell" size={20} color="#F59E0B" />
                    </View>
                    <Text style={styles.statValue}>{tonnage || '0'}kg</Text>
                    <Text style={styles.statLabel}>VOLUME</Text>
                </View>

                <View style={styles.statItem}>
                    <View style={[styles.statIconWrap, { backgroundColor: '#8B5CF620' }]}>
                        <Ionicons name="layers" size={20} color="#8B5CF6" />
                    </View>
                    <Text style={styles.statValue}>{sets || '0'}</Text>
                    <Text style={styles.statLabel}>SETS</Text>
                </View>
            </View>

            {rpe && (
                <View style={styles.rpeBox}>
                    <Text style={styles.rpeLabel}>INTENSITY: </Text>
                    <Text style={styles.rpeValue}>RPE {rpe} / 10</Text>
                </View>
            )}
        </View>

        {/* ── Personal Records Section (Mocked for now) ── */}
        <View style={styles.prSection}>
            <View style={styles.sectionHeader}>
                <Ionicons name="star" size={18} color={Colors.warning} />
                <Text style={styles.sectionTitle}>NEW PERSONAL RECORDS</Text>
            </View>
            
            <View style={styles.prCard}>
                <LinearGradient
                    colors={[`${Colors.warning}20`, `${Colors.warning}05`]}
                    style={styles.prGradient}
                >
                    <View style={styles.prIconBox}>
                        <Ionicons name="medal" size={20} color={Colors.warning} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.prExercise}>Bench Press (Dumbbell)</Text>
                        <Text style={styles.prDescription}>New Max Volume: 1,240kg</Text>
                    </View>
                    <Ionicons name="arrow-up-circle" size={24} color={Colors.success} />
                </LinearGradient>
            </View>
        </View>

        {/* ── Actions ── */}
        <View style={styles.actions}>
            <Pressable 
                style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
                onPress={() => router.replace('/(tabs)')}
            >
                <LinearGradient
                    colors={[Colors.primary, Colors.primaryBright]}
                    style={styles.btnGradient}
                >
                    <Text style={styles.primaryBtnText}>BACK TO DASHBOARD</Text>
                </LinearGradient>
            </Pressable>

            <Pressable 
                style={({ pressed }) => [styles.secondaryBtn, pressed && { backgroundColor: `${Colors.primary}15` }]}
                onPress={() => {}}
            >
                <Ionicons name="share-social-outline" size={20} color={Colors.primary} />
                <Text style={styles.secondaryBtnText}>SHARE YOUR PROGRESS</Text>
            </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  trophyContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  trophyGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    ...Shadows.primaryGlow,
  },
  trophyRing: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  title: {
    fontFamily: 'ArchivoBlack',
    fontSize: 28,
    color: '#FFF',
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  mainCard: {
    width: '100%',
    backgroundColor: Colors.elevated,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardHeaderTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: `${Colors.primary}20`,
    borderRadius: 8,
  },
  datePillText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 9,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginTop: 2,
  },
  rpeBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rpeLabel: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  rpeValue: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: Colors.primary,
  },
  prSection: {
    width: '100%',
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
    color: Colors.warning,
    letterSpacing: 1,
  },
  prCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${Colors.warning}30`,
  },
  prGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  prIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${Colors.warning}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prExercise: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  prDescription: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    overflow: 'hidden',
    ...Shadows.primaryGlow,
  },
  btnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: '#FFF',
    letterSpacing: 1,
  },
  secondaryBtn: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  secondaryBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
});
