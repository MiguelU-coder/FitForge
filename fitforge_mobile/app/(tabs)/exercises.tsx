// app/(tabs)/exercises.tsx
// Port of exercises_screen.dart — "Industrial Premium Athletic" design
// Reference: lib/features/exercises/presentation/screens/exercises_screen.dart

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../../src/theme/colors';
import { useExerciseStore } from '../../src/stores/useExerciseStore';
import { MUSCLE_GROUPS, formatLabel } from '../../src/types/exercise';
import ExerciseCard from '../../src/components/ExerciseCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ExercisesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { filters, page, isLoading, error, setFilters, fetchExercises } = useExerciseStore();
  const [searchInput, setSearchInput] = useState(filters.search);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchExercises(1);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setFilters]);

  const clearFilters = () => {
    setFilters({ muscle: undefined, equipment: undefined, search: '' });
    setSearchInput('');
  };

  const hasActiveFilters =
    filters.equipment != null ||
    filters.muscle != null ||
    filters.search.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header & Search ── */}
      <View style={styles.headerSection}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Library</Text>
            <Text style={styles.subtitle}>Global exercise database</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
              onPress={() => setShowFilters(true)}
            >
              <Ionicons
                name="options"
                size={20}
                color={hasActiveFilters ? Colors.primary : Colors.textSecondary}
              />
            </Pressable>
            <Pressable
              style={styles.addBtn}
              onPress={() => router.push('/exercise/create')}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </Pressable>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={Colors.textMuted}
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <Pressable
              onPress={() => {
                setSearchInput('');
                setFilters({ search: '' });
              }}
              style={{ padding: 4 }}
            >
              <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Filter Chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['ALL', ...MUSCLE_GROUPS]}
          contentContainerStyle={styles.filterChipsContainer}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isSelected =
              item === 'ALL' ? !filters.muscle : filters.muscle === item;
            return (
              <Pressable
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
                onPress={() => {
                  setFilters({
                    muscle: item === 'ALL' ? undefined : item,
                  });
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {item === 'ALL' ? 'ALL' : formatLabel(item)}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* ── Exercise Grid ── */}
      {isLoading && (!page || page.exercises.length === 0) ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="wifi-outline" size={32} color={Colors.textTertiary} />
          </View>
          <Text style={styles.errorTitle}>Connection error</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => fetchExercises(1)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={page?.exercises ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.exerciseList}
          columnWrapperStyle={styles.exerciseRow}
          renderItem={({ item }) => <ExerciseCard exercise={item} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons
                  name="search"
                  size={34}
                  color={Colors.textTertiary}
                  style={{ opacity: 0.5 }}
                />
              </View>
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>
                Try a different search term or clear the filters
              </Text>
              {hasActiveFilters && (
                <Pressable style={styles.clearFiltersBtn} onPress={clearFilters}>
                  <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}

      {/* ── Filter Modal (placeholder) ── */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ADVANCED FILTERS</Text>
              <Pressable onPress={() => setShowFilters(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>
            {/* Filter options would go here */}
            <Pressable
              style={styles.applyFiltersBtn}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFiltersBtnText}>APPLY FILTERS</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  headerSection: {
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'BebasNeue',
    fontSize: 30,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    fontWeight: '300',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}1A`,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.primaryGlow,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: Colors.elevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${Colors.border}80`,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // Filter Chips
  filterChipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: `${Colors.border}80`,
  },
  filterChipSelected: {
    backgroundColor: `${Colors.primary}1A`,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    letterSpacing: 0.5,
    color: Colors.textSecondary,
  },
  filterChipTextSelected: {
    color: Colors.primary,
  },

  // Center / Loading
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Error
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  errorSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: `${Colors.primary}1A`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${Colors.primary}4D`,
  },
  retryBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: Colors.primary,
  },

  // Exercise List
  exerciseList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  exerciseRow: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    fontWeight: '300',
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  clearFiltersBtn: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: `${Colors.primary}1A`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${Colors.primary}4D`,
  },
  clearFiltersBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: Colors.primary,
  },

  // Modal (placeholder)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
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
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  modalClose: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 13,
    color: Colors.primary,
  },
  applyFiltersBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  applyFiltersBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    letterSpacing: 1.5,
    color: '#FFF',
  },
});

