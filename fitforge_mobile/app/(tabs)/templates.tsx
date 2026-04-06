// app/(tabs)/templates.tsx
// Port of templates_screen.dart — "Industrial Premium Athletic" design
// Reference: lib/features/workouts/presentation/screens/templates_screen.dart

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
import { Colors, Shadows } from '../../src/theme/colors';
import { useWorkoutStore } from '../../src/stores/useWorkoutStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TemplatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { templates, isLoading, error, fetchTemplates, startSession, deleteRoutine } = useWorkoutStore();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleStartTemplate = async (routineId: string) => {
    setIsStarting(true);
    setStartError('');
    try {
      await startSession(undefined, routineId);
      router.push('/workout/active');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error starting session';
      setStartError(msg);
    } finally {
      setIsStarting(false);
    }
  };

  const handleDelete = (routineId: string, name: string) => {
    Alert.alert(
      'Delete template?',
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
        <View>
          <Text style={styles.title}>Templates</Text>
          <Text style={styles.subtitle}>Your custom routines</Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push('/template/create')}
        >
          <LinearGradient
            colors={['#1A7A3A', Colors.primary]}
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
        </View>
      ) : null}

      {/* ── Content ── */}
      {isLoading && templates.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
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
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Header row */}
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name="list" size={24} color={Colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {item.items.length} exercise{item.items.length === 1 ? '' : 's'}
                  </Text>
                </View>
                {/* Delete button */}
                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id, item.name)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={Colors.error}
                  />
                </Pressable>
              </View>

              {/* Exercise list */}
              {item.items.length > 0 && (
                <View style={styles.exerciseList}>
                  {item.items.slice(0, 4).map((exerciseItem, idx) => (
                    <View key={idx} style={styles.exerciseItemRow}>
                      <View style={styles.exerciseItemDot} />
                      <Text style={styles.exerciseItemText} numberOfLines={1}>
                        {exerciseItem.targetSets
                          ? `${exerciseItem.targetSets}x `
                          : ''}
                        {exerciseItem.exerciseName}
                      </Text>
                    </View>
                  ))}
                  {item.items.length > 4 && (
                    <Text style={styles.moreText}>
                      +{item.items.length - 4} more exercises
                    </Text>
                  )}
                </View>
              )}

              {/* Start button */}
              <Pressable
                style={[
                  styles.startBtn,
                  isStarting && styles.startBtnDisabled,
                ]}
                onPress={() => handleStartTemplate(item.id)}
                disabled={isStarting}
              >
                <LinearGradient
                  colors={['#1A7A3A', Colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.startBtnGradient}
                >
                  <Ionicons
                    name="play"
                    size={18}
                    color="#FFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.startBtnText}>Start Workout</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons
                  name="library"
                  size={34}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>No templates yet</Text>
              <Text style={styles.emptySubtitle}>
                Create a custom routine to start your workouts faster and with
                more structure.
              </Text>
              <Pressable
                style={styles.createFirstBtn}
                onPress={() => router.push('/template/create')}
              >
                <Text style={styles.createFirstBtnText}>
                  Create First Template
                </Text>
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
  title: {
    fontFamily: 'BebasNeue',
    fontSize: 30,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 3,
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
    paddingBottom: 100,
  },

  // Card
  card: {
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 17,
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.error}1A`,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Exercise list
  exerciseList: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  exerciseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  exerciseItemDot: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: `${Colors.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseItemText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  moreText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 4,
  },

  // Start button
  startBtn: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  startBtnDisabled: { opacity: 0.7 },
  startBtnGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  startBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: '#FFF',
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${Colors.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  createFirstBtn: {
    marginTop: 28,
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    ...Shadows.primaryGlow,
  },
  createFirstBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: '#FFF',
  },
});
