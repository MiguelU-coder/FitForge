// app/(tabs)/progress.tsx
// Port of progress_screen.dart — "Industrial Premium Athletic" design
// Reference: lib/features/progress/presentation/screens/progress_screen.dart
// Tabs: PERFORMANCE, PHYSICAL, AWARDS

import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../../src/theme/colors';
import { useProgressStore } from '../../src/stores/useProgressStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/useAuthStore';
import MuscleHeatmap from '../../src/components/MuscleHeatmap';
import DonutChart from '../../src/components/DonutChart';
import LineChart from '../../src/components/LineChart';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabName = 'PERFORMANCE' | 'PHYSICAL' | 'AWARDS';

export default function ProgressScreen() {
  const router = useRouter();
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
    addMetric,
  } = useProgressStore();
  const rawVolumeHistory = useProgressStore(s => s.rawVolumeHistory);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>('PERFORMANCE');
  const [showAddMetric, setShowAddMetric] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Modal States
  const [metricWeight, setMetricWeight] = useState('');
  const [metricBodyFat, setMetricBodyFat] = useState('');
  const [metricBodyWater, setMetricBodyWater] = useState('');
  const [metricBoneMass, setMetricBoneMass] = useState('');
  const [metricVisceralFat, setMetricVisceralFat] = useState('');
  const [metricWaist, setMetricWaist] = useState('');
  const [metricHips, setMetricHips] = useState('');
  const [metricDate, setMetricDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    await Promise.all([fetchMetrics(), fetchVolumeHistory(), fetchPRs()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatNum = (val: any, decimals = 1) => {
    const n = Number(val);
    if (isNaN(n)) return '--';
    return n.toFixed(decimals);
  };

  const tabs: TabName[] = ['PERFORMANCE', 'PHYSICAL', 'AWARDS'];

  // Parse current week volume data for Heatmap (Strictly Monday-Sunday)
  const currentWeekStarts = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    const diff = (dayOfWeek + 6) % 7;
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    
    // Robust local YYYY-MM-DD formatting to avoid UTC date shifts
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const day = String(monday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const currentWeekVolume = useMemo(() => {
    return rawVolumeHistory.filter(v => {
      // Backend might return full ISO strings. We compare only the date part.
      const vDate = v.weekStart.split('T')[0];
      return vDate === currentWeekStarts;
    });
  }, [rawVolumeHistory, currentWeekStarts]);

  // ── Derived chart data ──────────────────────────────────────────
  // Donut: muscle group distribution (current week)
  const MUSCLE_COLORS: Record<string, string> = {
    chest:       '#10B981',
    'upper-back':'#3B82F6',
    deltoids:    '#F59E0B',
    biceps:      '#8B5CF6',
    triceps:     '#EC4899',
    quadriceps:  '#EF4444',
    hamstring:   '#06B6D4',
    gluteal:     '#F97316',
    calves:      '#84CC16',
    abs:         '#A78BFA',
  };

  const donutData = useMemo(() => {
    const map: Record<string, number> = {};
    currentWeekVolume.forEach(v => {
      if (!v.muscleGroup) return;
      const slug = v.muscleGroup.toLowerCase().replace('back', 'upper-back').replace('quads', 'quadriceps').replace('hamstrings', 'hamstring').replace('glutes', 'gluteal');
      map[slug] = (map[slug] || 0) + v.totalSets;
    });
    return Object.entries(map)
      .map(([label, value]) => ({
        label: label.replace('upper-back', 'Back').replace('-', ' ').replace(/^\w/, c => c.toUpperCase()),
        value,
        color: MUSCLE_COLORS[label] || '#888888',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [currentWeekVolume]);

  const totalWeeklySets = donutData.reduce((s, d) => s + d.value, 0);

  // Line: last 8 weeks trend
  const lineData = useMemo(() => {
    return volumeHistory.slice(-8).map(v => ({
      value: v.totalVolumeKg ?? v.totalSets,
      label: new Date(v.weekStart).toLocaleDateString('en', { month: 'short', day: 'numeric' }).replace(' ', '\n'),
    }));
  }, [volumeHistory]);

  // ── Physical tab chart data ──────────────────────────────────────
  const N_PHYSICAL = 12; // show up to 12 measurements per chart

  const weightChartData = useMemo(() => {
    return metrics
      .filter(m => m.weightKg != null)
      .slice(-N_PHYSICAL)
      .map((m, i, arr) => ({
        value: m.weightKg!,
        // only show label every other point to avoid overlap
        label: i % 2 === 0 || i === arr.length - 1
          ? new Date(m.recordedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })
          : '',
      }));
  }, [metrics]);

  const bodyFatChartData = useMemo(() => {
    return metrics
      .filter(m => m.bodyFatPct != null)
      .slice(-N_PHYSICAL)
      .map((m, i, arr) => ({
        value: m.bodyFatPct!,
        label: i % 2 === 0 || i === arr.length - 1
          ? new Date(m.recordedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })
          : '',
      }));
  }, [metrics]);

  const waistChartData = useMemo(() => {
    return metrics
      .filter(m => m.waistCm != null)
      .slice(-N_PHYSICAL)
      .map((m, i, arr) => ({
        value: m.waistCm!,
        label: i % 2 === 0 || i === arr.length - 1
          ? new Date(m.recordedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })
          : '',
      }));
  }, [metrics]);

  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  const weightDelta = useMemo(() => {
    const pts = metrics.filter(m => m.weightKg != null);
    if (pts.length < 2) return null;
    return pts[pts.length - 1].weightKg! - pts[0].weightKg!;
  }, [metrics]);

  const bodyFatDelta = useMemo(() => {
    const pts = metrics.filter(m => m.bodyFatPct != null);
    if (pts.length < 2) return null;
    return pts[pts.length - 1].bodyFatPct! - pts[0].bodyFatPct!;
  }, [metrics]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DASHBOARD</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable 
            onPress={() => router.push('/workout/history')} 
            style={[styles.refreshBtn, { width: 'auto', paddingHorizontal: 12, flexDirection: 'row', gap: 6 }]}
          >
            <Ionicons name="time" size={18} color={Colors.primary} />
            <Text style={{ fontFamily: 'DMSans-Bold', fontSize: 11, color: Colors.primary }}>HISTORY</Text>
          </Pressable>
          <Pressable onPress={loadData} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>
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

            {/* Muscle Heatmap */}
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
              <MuscleHeatmap volumeData={currentWeekVolume} />
            )}

            {/* ── Donut: Muscle Distribution ── */}
            {donutData.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                  <View style={styles.sectionIconWrap}>
                    <Ionicons name="pie-chart" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Muscle Distribution</Text>
                </View>
                <View style={styles.chartCard}>
                  <Text style={styles.chartCardLabel}>THIS WEEK · {totalWeeklySets} SETS</Text>
                  <DonutChart
                    data={donutData}
                    size={160}
                    strokeWidth={24}
                    centerLabel={`${totalWeeklySets}`}
                    centerSubLabel="SETS"
                  />
                </View>
              </>
            )}

            {/* ── Line: Weekly Volume Trend ── */}
            {lineData.length > 1 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                  <View style={styles.sectionIconWrap}>
                    <Ionicons name="trending-up" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Volume Trend</Text>
                </View>
                <View style={styles.chartCard}>
                  <Text style={styles.chartCardLabel}>WEEKLY KG LIFTED</Text>
                  <LineChart data={lineData} color={Colors.primary} />
                </View>
              </>
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
                    ? `${formatNum(user.goalWeightKg)} kg`
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
                colors={['#0D1D14', '#08120C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addMetricBannerGradient}
              >
                <View style={styles.addMetricIconBox}>
                  <Ionicons name="analytics" size={22} color={Colors.primary} />
                </View>
                
                <View style={styles.addMetricTextContent}>
                  <Text style={styles.addMetricEyebrow}>LOG MEASUREMENTS</Text>
                  <Text style={styles.addMetricTitle}>
                    Track weight, fat & metrics
                  </Text>
                </View>

                <View style={styles.addMetricCircleBtn}>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={Colors.primary}
                  />
                </View>
              </LinearGradient>
            </Pressable>

            {/* ── Current Stats Snapshot ── */}
            {metrics.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="time" size={28} color={Colors.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No metrics recorded</Text>
                <Text style={styles.emptySubtitle}>
                  Tap REGISTER above to log your first measurement
                </Text>
              </View>
            ) : (
              <>
                {/* Latest measurement snapshot */}
                {latestMetric && (
                  <View style={styles.snapshotCard}>
                    <Text style={styles.snapshotDate}>
                      Latest · {new Date(latestMetric.recordedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                    <View style={styles.snapshotRow}>
                      {latestMetric.weightKg != null && (
                        <View style={styles.snapshotStat}>
                          <Text style={styles.snapshotValue}>{formatNum(latestMetric.weightKg)}</Text>
                          <Text style={styles.snapshotUnit}>kg</Text>
                          <Text style={styles.snapshotLabel}>WEIGHT</Text>
                        </View>
                      )}
                      {latestMetric.bodyFatPct != null && (
                        <View style={styles.snapshotStat}>
                          <Text style={styles.snapshotValue}>{formatNum(latestMetric.bodyFatPct)}</Text>
                          <Text style={styles.snapshotUnit}>%</Text>
                          <Text style={styles.snapshotLabel}>BODY FAT</Text>
                        </View>
                      )}
                      {latestMetric.bmi != null && (
                        <View style={styles.snapshotStat}>
                          <Text style={styles.snapshotValue}>{formatNum(latestMetric.bmi)}</Text>
                          <Text style={styles.snapshotUnit}></Text>
                          <Text style={styles.snapshotLabel}>BMI</Text>
                        </View>
                      )}
                      {latestMetric.waistCm != null && (
                        <View style={styles.snapshotStat}>
                          <Text style={styles.snapshotValue}>{formatNum(latestMetric.waistCm, 0)}</Text>
                          <Text style={styles.snapshotUnit}>cm</Text>
                          <Text style={styles.snapshotLabel}>WAIST</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* ── Weight Trend ── */}
                {weightChartData.length >= 1 && (
                  <>
                    <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                      <View style={styles.sectionIconWrap}>
                        <Ionicons name="scale" size={18} color={Colors.primary} />
                      </View>
                      <Text style={styles.sectionTitle}>Weight Trend</Text>
                      {weightDelta != null && (
                        <View style={[
                          styles.trendBadge,
                          { backgroundColor: weightDelta > 0 ? `${Colors.warning}20` : `${Colors.success}20` },
                        ]}>
                          <Ionicons
                            name={weightDelta > 0 ? 'trending-up' : 'trending-down'}
                            size={11}
                            color={weightDelta > 0 ? Colors.warning : Colors.success}
                          />
                          <Text style={[
                            styles.trendBadgeText,
                            { color: weightDelta > 0 ? Colors.warning : Colors.success },
                          ]}>
                            {weightDelta > 0 ? '+' : ''}{formatNum(weightDelta)} kg
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.chartCard}>
                      <Text style={styles.chartCardLabel}>
                        KG · LAST {weightChartData.length} MEASUREMENT{weightChartData.length !== 1 ? 'S' : ''}
                      </Text>
                      {weightChartData.length === 1 ? (
                        <View style={styles.singlePointHint}>
                          <Text style={styles.singlePointValue}>{formatNum(weightChartData[0].value)} kg</Text>
                          <Text style={styles.singlePointSub}>Add more measurements to see your trend</Text>
                        </View>
                      ) : (
                        <LineChart data={weightChartData} color={Colors.primary} />
                      )}
                    </View>
                  </>
                )}

                {/* ── Body Fat Trend ── */}
                {bodyFatChartData.length >= 1 && (
                  <>
                    <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                      <View style={styles.sectionIconWrap}>
                        <Ionicons name="body" size={18} color="#F59E0B" />
                      </View>
                      <Text style={styles.sectionTitle}>Body Fat Trend</Text>
                      {bodyFatDelta != null && (
                        <View style={[
                          styles.trendBadge,
                          { backgroundColor: bodyFatDelta < 0 ? `${Colors.success}20` : `${Colors.warning}20` },
                        ]}>
                          <Ionicons
                            name={bodyFatDelta < 0 ? 'trending-down' : 'trending-up'}
                            size={11}
                            color={bodyFatDelta < 0 ? Colors.success : Colors.warning}
                          />
                          <Text style={[
                            styles.trendBadgeText,
                            { color: bodyFatDelta < 0 ? Colors.success : Colors.warning },
                          ]}>
                            {bodyFatDelta > 0 ? '+' : ''}{formatNum(bodyFatDelta)}%
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.chartCard}>
                      <Text style={styles.chartCardLabel}>
                        % · LAST {bodyFatChartData.length} MEASUREMENT{bodyFatChartData.length !== 1 ? 'S' : ''}
                      </Text>
                      {bodyFatChartData.length === 1 ? (
                        <View style={styles.singlePointHint}>
                          <Text style={styles.singlePointValue}>{formatNum(bodyFatChartData[0].value)}%</Text>
                          <Text style={styles.singlePointSub}>Add more measurements to see your trend</Text>
                        </View>
                      ) : (
                        <LineChart data={bodyFatChartData} color="#F59E0B" />
                      )}
                    </View>
                  </>
                )}

                {/* ── Waist Trend ── */}
                {waistChartData.length >= 2 && (
                  <>
                    <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                      <View style={styles.sectionIconWrap}>
                        <Ionicons name="resize" size={18} color="#0EA5E9" />
                      </View>
                      <Text style={styles.sectionTitle}>Waist Trend</Text>
                    </View>
                    <View style={styles.chartCard}>
                      <Text style={styles.chartCardLabel}>
                        CM · LAST {waistChartData.length} MEASUREMENTS
                      </Text>
                      <LineChart data={waistChartData} color="#0EA5E9" />
                    </View>
                  </>
                )}

                {/* ── View History Button ── */}
                <View style={{ marginTop: 24, marginBottom: 16 }}>
                  <Pressable 
                    style={styles.historyBtn}
                    onPress={() => router.push('/progress/metrics-history')}
                  >
                    <Ionicons name="list" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={styles.historyBtnText}>VIEW FULL HISTORY</Text>
                    <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} style={{ marginLeft: 'auto' }} />
                  </Pressable>
                  <Text style={styles.historyHint}>
                    {metrics.length} measurements recorded since you joined
                  </Text>
                </View>
              </>
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
                      {formatNum(pr.value)} kg
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Add Metric Modal ── */}
      <Modal visible={showAddMetric} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>LOG METRICS</Text>
              <Pressable onPress={() => setShowAddMetric(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              {/* CORE METRICS */}
              <View style={styles.modalSectionHeader}>
                <Ionicons name="star" size={14} color={Colors.primary} />
                <Text style={styles.modalSectionLabel}>CORE METRICS *</Text>
              </View>
              <View style={styles.modalCardGroup}>
                <View style={styles.modalRowGroup}>
                  <View style={styles.modalInputWrap}>
                    <Text style={styles.modalInputLabel}>Weight <Text style={{ color: Colors.primary }}>*</Text></Text>
                    <View style={styles.modalInputBox}>
                      <Ionicons name="scale-outline" size={16} color={Colors.textTertiary} />
                      <TextInput 
                        style={styles.modalTextInput} 
                        placeholder="0.0" 
                        placeholderTextColor={Colors.border}
                        keyboardType="decimal-pad" 
                        value={metricWeight}
                        onChangeText={setMetricWeight}
                      />
                      <Text style={styles.modalInputUnitPrimary}>kg</Text>
                    </View>
                  </View>
                  <View style={styles.modalInputWrap}>
                    <Text style={styles.modalInputLabel}>Body Fat</Text>
                    <View style={styles.modalInputBox}>
                      <Text style={{ color: Colors.textTertiary, fontFamily: 'DMSans-Medium' }}>%</Text>
                      <TextInput 
                        style={styles.modalTextInput} 
                        placeholder="0.0" 
                        placeholderTextColor={Colors.border}
                        keyboardType="decimal-pad" 
                        value={metricBodyFat}
                        onChangeText={setMetricBodyFat}
                      />
                      <Text style={styles.modalInputUnitPrimary}>%</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* BODY COMPOSITION */}
              <View style={styles.modalSectionHeader}>
                <Ionicons name="bar-chart-outline" size={14} color={Colors.primary} />
                <Text style={styles.modalSectionLabel}>BODY COMPOSITION</Text>
              </View>
              <View style={styles.modalCardGroup}>
                <View style={styles.modalRowGroup}>
                  <View style={styles.modalInputWrap}>
                    <Text style={styles.modalInputLabel}>Body Water</Text>
                    <View style={styles.modalInputBox}>
                      <Ionicons name="water-outline" size={16} color={Colors.textTertiary} />
                      <TextInput 
                        style={styles.modalTextInput} 
                        placeholder="0.0" 
                        placeholderTextColor={Colors.border}
                        keyboardType="decimal-pad" 
                        value={metricBodyWater}
                        onChangeText={setMetricBodyWater}
                      />
                      <Text style={styles.modalInputUnitPrimary}>%</Text>
                    </View>
                  </View>
                  <View style={styles.modalInputWrap}>
                    <Text style={styles.modalInputLabel}>Bone Mass</Text>
                    <View style={styles.modalInputBox}>
                      <Ionicons name="resize" size={16} color={Colors.textTertiary} style={{ transform: [{ rotate: '45deg' }] }} />
                      <TextInput 
                        style={styles.modalTextInput} 
                        placeholder="0.0" 
                        placeholderTextColor={Colors.border}
                        keyboardType="decimal-pad" 
                        value={metricBoneMass}
                        onChangeText={setMetricBoneMass}
                      />
                      <Text style={styles.modalInputUnitPrimary}>kg</Text>
                    </View>
                  </View>
                </View>
                
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.modalInputLabel}>Visceral Fat Rating</Text>
                  <View style={styles.modalInputBoxFull}>
                    <Ionicons name="speedometer-outline" size={16} color={Colors.textTertiary} />
                    <TextInput 
                      style={styles.modalTextInputFull} 
                      placeholder="1 - 20" 
                      placeholderTextColor={Colors.border}
                      keyboardType="number-pad" 
                      value={metricVisceralFat}
                      onChangeText={setMetricVisceralFat}
                    />
                    <Text style={styles.modalInputUnitPrimary}>lvl</Text>
                  </View>
                </View>
              </View>

              {/* CIRCUMFERENCES */}
              <View style={styles.modalSectionHeader}>
                <Ionicons name="options-outline" size={16} color={Colors.primary} />
                <Text style={styles.modalSectionLabel}>CIRCUMFERENCES</Text>
              </View>
              <View style={styles.modalCardGroup}>
                <View style={styles.modalRowGroup}>
                  <View style={styles.modalInputWrap}>
                    <Text style={styles.modalInputLabel}>Waist</Text>
                    <View style={styles.modalInputBox}>
                      <Ionicons name="ellipse-outline" size={16} color={Colors.textTertiary} />
                      <TextInput 
                        style={styles.modalTextInput} 
                        placeholder="0" 
                        placeholderTextColor={Colors.border}
                        keyboardType="decimal-pad" 
                        value={metricWaist}
                        onChangeText={setMetricWaist}
                      />
                      <Text style={styles.modalInputUnitPrimary}>cm</Text>
                    </View>
                  </View>
                  <View style={styles.modalInputWrap}>
                    <Text style={styles.modalInputLabel}>Hips</Text>
                    <View style={styles.modalInputBox}>
                      <Ionicons name="body-outline" size={16} color={Colors.textTertiary} />
                      <TextInput 
                        style={styles.modalTextInput} 
                        placeholder="0" 
                        placeholderTextColor={Colors.border}
                        keyboardType="decimal-pad" 
                        value={metricHips}
                        onChangeText={setMetricHips}
                      />
                      <Text style={styles.modalInputUnitPrimary}>cm</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* DATE */}
              <View style={styles.modalSectionHeader}>
                <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
                <Text style={styles.modalSectionLabel}>DATE</Text>
              </View>
              <Pressable 
                style={[styles.modalCardGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.modalDateIcon}>
                    <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.modalInputLabel}>Measurement date</Text>
                    <Text style={styles.modalDateValue}>
                      {metricDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
              </Pressable>

              {showDatePicker && (
                Platform.OS === 'ios' ? (
                  <Modal transparent animationType="fade" visible={showDatePicker}>
                    <View style={styles.datePickerOverlay}>
                      <View style={styles.datePickerContainer}>
                        <View style={styles.datePickerHeader}>
                          <Text style={styles.datePickerTitle}>SELECT DATE</Text>
                          <Pressable onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.datePickerDone}>Done</Text>
                          </Pressable>
                        </View>
                        <DateTimePicker
                          value={metricDate}
                          mode="date"
                          display="spinner"
                          onChange={(event, selectedDate) => {
                            if (selectedDate) setMetricDate(selectedDate);
                          }}
                          maximumDate={new Date()}
                          textColor={Colors.textPrimary}
                        />
                      </View>
                    </View>
                  </Modal>
                ) : (
                  <DateTimePicker
                    value={metricDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setMetricDate(selectedDate);
                    }}
                    maximumDate={new Date()}
                  />
                )
              )}

              <Pressable style={styles.saveBtn} onPress={async () => {
                if (!metricWeight) return; // Validation: Weight is required
                await addMetric({
                  weightKg: parseFloat(metricWeight),
                  bodyFatPct: metricBodyFat ? parseFloat(metricBodyFat) : undefined,
                  bodyWaterPct: metricBodyWater ? parseFloat(metricBodyWater) : undefined,
                  boneMassKg: metricBoneMass ? parseFloat(metricBoneMass) : undefined,
                  visceralFatRating: metricVisceralFat ? parseFloat(metricVisceralFat) : undefined,
                  waistCm: metricWaist ? parseFloat(metricWaist) : undefined,
                  hipsCm: metricHips ? parseFloat(metricHips) : undefined,
                  recordedAt: metricDate.toISOString()
                });
                setShowAddMetric(false);
                setMetricWeight('');
                setMetricBodyFat('');
                setMetricDate(new Date());
              }}>
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
    fontSize: 34,
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
    fontFamily: 'BebasNeue',
    fontSize: 13,
    letterSpacing: 1.5,
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.primary,
    letterSpacing: 1.5,
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
    paddingBottom: 100,
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
    fontFamily: 'ArchivoBlack',
    fontSize: 14,
    letterSpacing: -0.2,
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
    borderRadius: 18,
    overflow: 'hidden',
  },
  addMetricBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#18B97A33', // Subtle green border
  },
  addMetricIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#18B97A4D',
    backgroundColor: '#18B97A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMetricTextContent: {
    flex: 1,
    marginLeft: 14,
  },
  addMetricEyebrow: {
    fontFamily: 'DMSans-Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    color: Colors.primary,
  },
  addMetricTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 2,
  },
  addMetricCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#18B97A1A',
    justifyContent: 'center',
    alignItems: 'center',
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
  // Chart cards (donut / line)
  chartCard: {
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    padding: 20,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  chartCardLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 9,
    letterSpacing: 1.5,
    color: '#555555',
    marginBottom: 16,
  },
  // Web Heatmap Fallback
  webHeatmapPlaceholder: {
    backgroundColor: '#111111',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  webHeatmapIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  webHeatmapText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: '#CCCCCC',
    letterSpacing: 1,
    marginBottom: 8,
  },
  webHeatmapSub: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    maxWidth: 280,
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

  // Modal Design
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-start', // Instead of flex-end to cover full screen
    paddingTop: 60,
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: 'ArchivoBlack',
    fontSize: 22,
    color: '#F4F4F5', // Off-white typical in Carbon design
    letterSpacing: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 20,
    gap: 6,
  },
  modalSectionLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },
  modalCardGroup: {
    backgroundColor: Colors.elevated,
    borderRadius: 16,
    padding: 16,
  },
  modalRowGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  modalInputWrap: {
    flex: 1,
  },
  modalInputLabel: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  modalInputBox: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E', // Darker carbon input
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    alignItems: 'center',
  },
  modalInputBoxFull: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    alignItems: 'center',
  },
  modalTextInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    textAlign: 'center',
  },
  modalTextInputFull: {
    flex: 1,
    color: Colors.textPrimary,
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    textAlign: 'center',
  },
  modalInputUnitPrimary: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
    color: Colors.primary,
  },
  modalDateIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDateValue: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    ...Shadows.primaryGlow,
  },
  saveBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    letterSpacing: 1,
    color: Colors.background,
  },

  // ── Physical Tab: Snapshot Card ─────────────────────────────────
  snapshotCard: {
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    padding: 20,
    borderWidth: 0.5,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  snapshotDate: {
    fontFamily: 'DMSans-Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    color: Colors.textTertiary,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  snapshotStat: {
    alignItems: 'center',
    flex: 1,
  },
  snapshotValue: {
    fontFamily: 'BebasNeue',
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  snapshotUnit: {
    fontFamily: 'DMSans-Medium',
    fontSize: 11,
    color: Colors.primary,
    marginTop: -4,
  },
  snapshotLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    color: Colors.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
  },

  // ── Physical Tab: Single Point Fallback ─────────────────────────
  singlePointHint: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  singlePointValue: {
    fontFamily: 'BebasNeue',
    fontSize: 36,
    color: Colors.primary,
    letterSpacing: 1,
  },
  singlePointSub: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },

  // ── Physical Tab: History List ───────────────────────────────────
  historyCount: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevated,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  historyDateCol: {
    width: 52,
    alignItems: 'center',
    marginRight: 14,
  },
  historyDateDay: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  historyDateYear: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  historyStats: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    backgroundColor: `${Colors.border}60`,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  historyStatVal: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  historyStatUnit: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: Colors.textSecondary,
  },
  historyMore: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  datePickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.primaryGlow,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  datePickerTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },
  datePickerDone: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: Colors.primary,
    padding: 8,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevated,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  historyHint: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
});
