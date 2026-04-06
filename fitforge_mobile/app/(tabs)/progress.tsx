// app/(tabs)/progress.tsx
// Port of progress_screen.dart — "Industrial Premium Athletic" design
// Reference: lib/features/progress/presentation/screens/progress_screen.dart
// Tabs: PERFORMANCE, PHYSICAL, AWARDS

import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows } from '../../src/theme/colors';
import { useProgressStore } from '../../src/stores/useProgressStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/useAuthStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabName = 'PERFORMANCE' | 'PHYSICAL' | 'AWARDS';

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const {
    metrics,
    volumeHistory,
    prs,
    isLoadingMetrics,
    isLoadingVolume,
    isLoadingPRs,
    fetchMetrics,
    fetchVolumeHistory,
    fetchPRs,
  } = useProgressStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>('PERFORMANCE');
  const [showAddMetric, setShowAddMetric] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadData = async () => {
    setRefreshing(true);
    await Promise.all([fetchMetrics(), fetchVolumeHistory(), fetchPRs()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const tabs: TabName[] = ['PERFORMANCE', 'PHYSICAL', 'AWARDS'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DASHBOARD</Text>
        <Pressable onPress={loadData} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* ── Tab Bar ── */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── FAB for Physical tab ── */}
      {activeTab === 'PHYSICAL' && (
        <Pressable
          style={styles.fab}
          onPress={() => setShowAddMetric(true)}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryBright]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={24} color="#FFF" />
            <Text style={styles.fabText}>REGISTER</Text>
          </LinearGradient>
        </Pressable>
      )}

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadData}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── PERFORMANCE TAB ── */}
        {activeTab === 'PERFORMANCE' && (
          <View style={styles.tabContent}>
            {/* Current Week Volume */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="bar-chart" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Current Week Volume</Text>
            </View>

            {isLoadingVolume ? (
              <View style={styles.loadingCard}>
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : volumeHistory.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="barbell" size={28} color={Colors.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No volume data</Text>
                <Text style={styles.emptySubtitle}>
                  Start a workout to track your volume
                </Text>
              </View>
            ) : (
              <View style={styles.volumeCard}>
                {/* Placeholder for muscle heatmap - would go here */}
                <Text style={styles.volumeLabel}>SETS PER MUSCLE</Text>
                <View style={styles.volumeChart}>
                  {volumeHistory.slice(-6).map((vol, idx) => (
                    <View key={idx} style={styles.volumeBarCol}>
                      <Text style={styles.volumeBarValue}>
                        {vol.totalSets}
                      </Text>
                      <View style={styles.volumeBarWrap}>
                        <View
                          style={[
                            styles.volumeBar,
                            {
                              height: `${Math.min(
                                (vol.totalSets / 20) * 100,
                                100,
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.volumeBarLabel}>
                        {vol.muscleGroup?.substring(0, 3).toUpperCase() ?? 'ALL'}
                      </Text>
                    </View>
                  ))}
                </View>
                {/* Legend */}
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                    <Text style={styles.legendText}>Under MEV</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                    <Text style={styles.legendText}>Optimal</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
                    <Text style={styles.legendText}>Over MRV</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Total Sets Trend */}
            <View style={[styles.sectionHeader, { marginTop: 32 }]}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="trending-up" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Total Sets Trend</Text>
            </View>

            {volumeHistory.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Not enough historical data</Text>
              </View>
            ) : (
              <View style={styles.trendCard}>
                <Text style={styles.trendLabel}>WEEKLY TOTAL SETS</Text>
                <View style={styles.trendChart}>
                  {volumeHistory.slice(-8).map((vol, idx) => (
                    <View key={idx} style={styles.trendBarCol}>
                      <Text style={styles.trendBarValue}>
                        {vol.totalSets}
                      </Text>
                      <View style={styles.trendBarWrap}>
                        <View
                          style={[
                            styles.trendBar,
                            {
                              height: `${Math.min(
                                (vol.totalSets /
                                  Math.max(...volumeHistory.map((v) => v.totalSets))) *
                                  100,
                                100,
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── PHYSICAL TAB ── */}
        {activeTab === 'PHYSICAL' && (
          <View style={styles.tabContent}>
            {/* Metric Header */}
            <View style={styles.metricHeader}>
              <View style={styles.metricItem}>
                <Ionicons name="resize" size={18} color={Colors.primary} />
                <Text style={styles.metricValue}>
                  {user?.heightCm ? `${user.heightCm} cm` : '--'}
                </Text>
                <Text style={styles.metricLabel}>HEIGHT</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Ionicons name="flag" size={18} color={Colors.primary} />
                <Text style={styles.metricValue}>
                  {user?.goalWeightKg
                    ? `${user.goalWeightKg.toFixed(1)} kg`
                    : '--'}
                </Text>
                <Text style={styles.metricLabel}>GOAL WEIGHT</Text>
              </View>
            </View>

            {/* Add Metric Banner */}
            <Pressable
              style={styles.addMetricBanner}
              onPress={() => setShowAddMetric(true)}
            >
              <LinearGradient
                colors={['#0F3D22', '#18B97A40']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addMetricBannerGradient}
              >
                <View style={styles.addMetricIconWrap}>
                  <Ionicons name="add-circle" size={24} color={Colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.addMetricEyebrow}>LOG MEASUREMENTS</Text>
                  <Text style={styles.addMetricTitle}>
                    Track weight, fat & metrics
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Colors.primary}
                />
              </LinearGradient>
            </Pressable>

            {/* Weight & Body Fat */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="scale" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Weight & Body Fat</Text>
            </View>

            {metrics.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="time" size={28} color={Colors.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No metrics recorded</Text>
                <Text style={styles.emptySubtitle}>
                  Add your weight in Profile to see progress
                </Text>
              </View>
            ) : (
              <View style={styles.weightCard}>
                <View style={styles.weightHeader}>
                  <Text style={styles.weightLabel}>WEIGHT TREND (KG)</Text>
                  {metrics.length >= 2 && (
                    <View style={styles.trendBadge}>
                      <Ionicons
                        name={
                          (metrics[metrics.length - 1].weightKg ?? 0) >=
                          (metrics[0].weightKg ?? 0)
                            ? 'trending-up'
                            : 'trending-down'
                        }
                        size={12}
                        color={
                          (metrics[metrics.length - 1].weightKg ?? 0) >=
                          (metrics[0].weightKg ?? 0)
                            ? Colors.warning
                            : Colors.success
                        }
                      />
                      <Text
                        style={[
                          styles.trendBadgeText,
                          {
                            color:
                              (metrics[metrics.length - 1].weightKg ?? 0) >=
                              (metrics[0].weightKg ?? 0)
                                ? Colors.warning
                                : Colors.success,
                          },
                        ]}
                      >
                        {(
                          (metrics[metrics.length - 1].weightKg ?? 0) -
                          (metrics[0].weightKg ?? 0)
                        ).toFixed(1)}{' '}
                        kg
                      </Text>
                    </View>
                  )}
                </View>

                {/* Weight chart placeholder */}
                <View style={styles.weightChart}>
                  {metrics.slice(-8).map((m, idx) => (
                    <View key={idx} style={styles.weightPoint}>
                      <View
                        style={[
                          styles.weightDot,
                          idx === metrics.slice(-8).length - 1 &&
                            styles.weightDotActive,
                        ]}
                      />
                    </View>
                  ))}
                </View>
                <Text style={styles.weightChartLabel}>
                  Showing last {Math.min(metrics.length, 8)} measurements
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── AWARDS TAB ── */}
        {activeTab === 'AWARDS' && (
          <View style={styles.tabContent}>
            {isLoadingPRs ? (
              <View style={styles.loadingCard}>
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : prs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons
                    name="trophy"
                    size={48}
                    color={Colors.textTertiary}
                  />
                </View>
                <Text style={styles.emptyTitle}>No awards yet</Text>
                <Text style={styles.emptySubtitle}>
                  Hit new personal records to see them here
                </Text>
              </View>
            ) : (
              <View style={styles.prsList}>
                {prs.map((pr, idx) => (
                  <View key={idx} style={styles.prCard}>
                    <View
                      style={[
                        styles.prIconWrap,
                        {
                          backgroundColor:
                            pr.prType === 'ONE_RM_ESTIMATED'
                              ? `${Colors.primary}1A`
                              : `${Colors.pr}1A`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          pr.prType === 'ONE_RM_ESTIMATED'
                            ? 'calculator'
                            : 'trophy'
                        }
                        size={20}
                        color={
                          pr.prType === 'ONE_RM_ESTIMATED'
                            ? Colors.primary
                            : Colors.pr
                        }
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.prExerciseName}>
                        {pr.exerciseName}
                      </Text>
                      <Text style={styles.prType}>
                        {pr.prType === 'ONE_RM_ESTIMATED'
                          ? 'Estimated 1RM'
                          : 'Max Weight'}
                      </Text>
                    </View>
                    <Text style={styles.prValue}>
                      {pr.value.toFixed(1)} kg
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Add Metric Modal (placeholder) ── */}
      <Modal visible={showAddMetric} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>LOG MEASUREMENTS</Text>
              <Pressable onPress={() => setShowAddMetric(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView>
              <Text style={styles.modalSectionLabel}>CORE METRICS</Text>
              <View style={styles.modalInput}>
                <Text style={styles.modalInputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="0.0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.modalInput}>
                <Text style={styles.modalInputLabel}>Body Fat (%)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="0.0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>

              <Pressable style={styles.saveBtn} onPress={() => setShowAddMetric(false)}>
                <Text style={styles.saveBtnText}>SAVE MEASUREMENTS</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontFamily: 'BebasNeue',
    fontSize: 30,
    letterSpacing: 2,
    color: Colors.textPrimary,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: `${Colors.primary}1A`,
    borderColor: Colors.primary,
  },
  tabText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 10,
    ...Shadows.primaryGlow,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fabText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: '#FFF',
    marginLeft: 8,
  },

  // Content
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  tabContent: {
    flex: 1,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },

  // Loading
  loadingCard: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Empty
  emptyCard: {
    backgroundColor: Colors.elevated,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },

  // Volume Card
  volumeCard: {
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    padding: 20,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  volumeLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  volumeChart: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  volumeBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  volumeBarValue: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  volumeBarWrap: {
    height: 100,
    width: 18,
    backgroundColor: `${Colors.border}60`,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  volumeBar: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  volumeBarLabel: {
    fontFamily: 'DMSans-Medium',
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    fontWeight: '300',
    color: Colors.textSecondary,
  },

  // Trend Card
  trendCard: {
    backgroundColor: Colors.elevated,
    borderRadius: 16,
    padding: 20,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  trendLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  trendChart: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  trendBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  trendBarValue: {
    fontFamily: 'DMSans-Bold',
    fontSize: 9,
    color: Colors.primary,
    marginBottom: 4,
    height: 12,
  },
  trendBarWrap: {
    height: 90,
    width: 14,
    backgroundColor: `${Colors.border}60`,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBar: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },

  // Physical Tab - Metric Header
  metricHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 0.5,
    height: 40,
    backgroundColor: Colors.border,
  },
  metricValue: {
    fontFamily: 'BebasNeue',
    fontSize: 20,
    color: Colors.textPrimary,
    marginTop: 8,
  },
  metricLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.textMuted,
    marginTop: 4,
  },

  // Add Metric Banner
  addMetricBanner: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  addMetricBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: `${Colors.primary}4D`,
  },
  addMetricIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: `${Colors.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMetricEyebrow: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.primary,
  },
  addMetricTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: Colors.textPrimary,
    marginTop: 4,
  },

  // Weight Card
  weightCard: {
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    padding: 20,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  weightLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.warning}1A`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  trendBadgeText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
  },
  weightChart: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  weightPoint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  weightDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    opacity: 0.5,
  },
  weightDotActive: {
    opacity: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  weightChartLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },

  // PRs List
  prsList: {
    gap: 10,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  prIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prExerciseName: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  prType: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    fontWeight: '300',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  prValue: {
    fontFamily: 'BebasNeue',
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 32,
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalSectionLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
    letterSpacing: 1.5,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  modalInput: {
    marginBottom: 16,
  },
  modalInputLabel: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: Colors.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'DMSans-Medium',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    letterSpacing: 1.5,
    color: '#FFF',
  },
});
