// app/(tabs)/templates.tsx
// Carbon Forge v3.0 — "Industrial Premium Athletic" design

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, Gradients } from '../../src/theme/colors';
import { useWorkoutStore } from '../../src/stores/useWorkoutStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TemplatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { templates, isLoading, error, fetchTemplates, startSession, deleteRoutine } = useWorkoutStore();
  const [isStarting, setIsStarting] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [startError, setStartError] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleStartTemplate = async (routineId: string) => {
    setIsStarting(true);
    setStartingId(routineId);
    setStartError('');
    try {
      await startSession(undefined, routineId);
      router.push('/workout/active');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error starting session';
      setStartError(msg);
    } finally {
      setIsStarting(false);
      setStartingId(null);
    }
  };

  const handleDelete = (routineId: string, name: string) => {
    Alert.alert(
      `Delete "${name}"?`,
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRoutine(routineId),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Accent bar */}
          <View style={styles.accentBar} />
          <View>
            <Text style={styles.title}>TEMPLATES</Text>
            <Text style={styles.subtitle}>
              {templates.length > 0
                ? `${templates.length} routine${templates.length === 1 ? '' : 's'} saved`
                : 'Your custom routines'}
            </Text>
          </View>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push('/template/create')}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryBright]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addBtnGradient}
          >
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.addBtnText}>New</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* ── Start Error Banner ── */}
      {startError ? (
        <View style={styles.startErrorBanner}>
          <Ionicons name="alert-circle-outline" size={15} color={Colors.error} />
          <Text style={styles.startErrorText}>{startError}</Text>
          <Pressable onPress={() => setStartError('')}>
            <Ionicons name="close" size={16} color={Colors.error} />
          </Pressable>
        </View>
      ) : null}

      {/* ── Content ── */}
      {isLoading && templates.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading templates...</Text>
        </View>
      ) : error && templates.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={32} color={Colors.error} />
          </View>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => fetchTemplates()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isThisStarting = isStarting && startingId === item.id;
            return (
              <View style={styles.card}>
                {/* Green left accent border */}
                <View style={styles.cardAccent} />

                {/* Header row */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconWrap}>
                    <LinearGradient
                      colors={[`${Colors.primary}33`, `${Colors.primary}11`]}
                      style={styles.cardIconGradient}
                    >
                      <Ionicons name="barbell-outline" size={22} color={Colors.primary} />
                    </LinearGradient>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.cardMeta}>
                      <Ionicons name="layers-outline" size={12} color={Colors.textTertiary} />
                      <Text style={styles.cardSubtitle}>
                        {' '}{item.items.length} exercise{item.items.length === 1 ? '' : 's'}
                      </Text>
                    </View>
                  </View>
                  {/* Delete button */}
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id, item.name)}
                  >
                    <Ionicons name="trash-outline" size={17} color={Colors.error} />
                  </Pressable>
                </View>

                {/* Exercise list */}
                {item.items.length > 0 && (
                  <View style={styles.exerciseList}>
                    {item.items.slice(0, 4).map((exerciseItem, idx) => (
                      <View key={idx} style={styles.exerciseItemRow}>
                        <View style={styles.exerciseIndexBadge}>
                          <Text style={styles.exerciseIndexText}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.exerciseItemText} numberOfLines={1}>
                          {exerciseItem.targetSets ? `${exerciseItem.targetSets} × ` : ''}
                          {exerciseItem.exerciseName}
                        </Text>
                      </View>
                    ))}
                    {item.items.length > 4 && (
                      <View style={styles.moreRow}>
                        <Ionicons name="ellipsis-horizontal" size={14} color={Colors.textTertiary} />
                        <Text style={styles.moreText}>
                          {' '}{item.items.length - 4} more exercise{item.items.length - 4 === 1 ? '' : 's'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Start button */}
                <Pressable
                  style={[styles.startBtn, (isStarting) && styles.startBtnDisabled]}
                  onPress={() => handleStartTemplate(item.id)}
                  disabled={isStarting}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryBright]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.startBtnGradient}
                  >
                    {isThisStarting ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="play-circle-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.startBtnText}>Start Workout</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconOuter}>
                <View style={styles.emptyIconInner}>
                  <Ionicons name="library-outline" size={36} color={Colors.primary} />
                </View>
              </View>
              <Text style={styles.emptyTitle}>No templates yet</Text>
              <Text style={styles.emptySubtitle}>
                Create a custom routine to start your workouts faster and with more structure.
              </Text>
              <Pressable
                style={styles.createFirstBtn}
                onPress={() => router.push('/template/create')}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryBright]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createFirstBtnGradient}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.createFirstBtnText}>Create First Template</Text>
                </LinearGradient>
              </Pressable>
            </View>
          }
        />
      )}
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
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accentBar: {
    width: 4,
    height: 36,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  title: {
    fontFamily: 'BebasNeue',
    fontSize: 30,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Shadows.primaryGlow,
  },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: '#FFF',
    marginLeft: 6,
  },

  // Error Banner
  startErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
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

  // Center / Loading
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${Colors.error}1A`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  errorSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: `${Colors.primary}1A`,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${Colors.primary}4D`,
  },
  retryBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: Colors.primary,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    paddingTop: 4,
  },

  // Card
  card: {
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    padding: 16,
    paddingLeft: 20,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.card,
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardIconGradient: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 17,
    color: Colors.textPrimary,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  cardSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${Colors.error}15`,
    borderWidth: 1,
    borderColor: `${Colors.error}25`,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Exercise list
  exerciseList: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    gap: 8,
  },
  exerciseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: `${Colors.primary}20`,
    borderWidth: 1,
    borderColor: `${Colors.primary}35`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  exerciseIndexText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    color: Colors.primary,
  },
  exerciseItemText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    paddingLeft: 2,
  },
  moreText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.textTertiary,
  },

  // Start button
  startBtn: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  startBtnDisabled: { opacity: 0.65 },
  startBtnGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 13,
  },
  startBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: '#FFF',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${Colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
  },
  createFirstBtn: {
    marginTop: 28,
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadows.primaryGlow,
  },
  createFirstBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  createFirstBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: '#FFF',
  },
});
