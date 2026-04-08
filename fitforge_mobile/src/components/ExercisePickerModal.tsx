// src/components/ExercisePickerModal.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Colors } from '../theme/colors';
import { useExerciseStore } from '../stores/useExerciseStore';
import { Exercise, MUSCLE_GROUPS, EQUIPMENT_LIST, formatLabel } from '../types/exercise';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ExerciseCard from './ExerciseCard';
import { getMuscleColor } from '../utils/muscleColors';
import { ScrollView } from 'react-native';

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export default function ExercisePickerModal({ visible, onClose, onSelect }: ExercisePickerModalProps) {
  const insets = useSafeAreaInsets();
  const { filters, page, isLoading, fetchExercises, setFilters } = useExerciseStore();
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (visible) {
      if (!page || page.exercises.length === 0) {
        fetchExercises(1);
      }
    }
  }, [visible]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: searchInput });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, setFilters]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top || 20 }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Add Exercise</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={Colors.textSecondary}
              value={searchInput}
              onChangeText={setSearchInput}
            />
          </View>
          <Pressable 
            style={[styles.filterBtn, (filters.muscle || filters.equipment) && styles.filterBtnActive]} 
            onPress={() => setShowFilters(true)}
          >
            <Ionicons 
              name="options" 
              size={20} 
              color={!!(filters.muscle || filters.equipment) ? Colors.primary : Colors.textSecondary} 
            />
          </Pressable>
        </View>

        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {page?.total ?? 0} exercises
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={page?.exercises ?? []}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
            columnWrapperStyle={{ gap: 16, marginBottom: 16 }}
            renderItem={({ item }) => (
              <ExerciseCard 
                exercise={item} 
                onPress={() => {
                  onSelect(item);
                  onClose();
                }} 
              />
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="barbell-outline" size={48} color={Colors.textTertiary} style={{ marginBottom: 16, marginTop: 40 }} />
                <Text style={styles.emptyText}>No exercises found.</Text>
              </View>
            }
          />
        )}

        {/* ── Advanced Filters Modal ── */}
        <Modal visible={showFilters} animationType="slide" transparent>
          <Pressable style={styles.modalOverlay} onPress={() => setShowFilters(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>ADVANCED FILTERS</Text>
                <Pressable onPress={() => setFilters({ muscle: undefined, equipment: undefined, search: '' })}>
                  <Text style={styles.modalResetText}>Reset</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Muscle Group */}
                <View style={styles.filterSection}>
                  <Text style={styles.sectionTitle}>MUSCLE GROUP</Text>
                  <View style={styles.chipWrap}>
                    <Pressable
                      style={[styles.muscleChip, !filters.muscle && styles.muscleChipActive]}
                      onPress={() => setFilters({ muscle: undefined })}
                    >
                      <Ionicons name="apps" size={16} color={getMuscleColor('ALL')} />
                      <Text style={[styles.muscleChipText, !filters.muscle ? { color: '#FFF' } : null]}>All</Text>
                    </Pressable>
                    {MUSCLE_GROUPS.map(muscle => {
                      const isActive = filters.muscle === muscle;
                      return (
                        <Pressable
                          key={muscle}
                          style={[styles.muscleChip, isActive && styles.muscleChipActive]}
                          onPress={() => setFilters({ muscle: isActive ? undefined : muscle })}
                        >
                          <Ionicons name="body" size={16} color={getMuscleColor(muscle)} />
                          <Text style={[styles.muscleChipText, isActive ? { color: '#FFF' } : null]}>
                            {formatLabel(muscle)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Equipment */}
                <View style={styles.filterSection}>
                  <Text style={styles.sectionTitle}>EQUIPMENT</Text>
                  <View style={styles.chipWrap}>
                    <Pressable
                      style={[styles.equipChip, !filters.equipment && styles.equipChipActive]}
                      onPress={() => setFilters({ equipment: undefined })}
                    >
                      <Text style={[styles.equipChipText, !filters.equipment && styles.equipChipTextActive]}>All</Text>
                    </Pressable>
                    {EQUIPMENT_LIST.map(eq => {
                      const isActive = filters.equipment === eq;
                      return (
                        <Pressable
                          key={eq}
                          style={[styles.equipChip, isActive && styles.equipChipActive]}
                          onPress={() => setFilters({ equipment: isActive ? undefined : eq })}
                        >
                          <Text style={[styles.equipChipText, isActive && styles.equipChipTextActive]}>
                            {formatLabel(eq)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'ArchivoBlack',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: Colors.elevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'DMSans-Medium',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
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
  countRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  countText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: Colors.textTertiary,
  },
  center: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontFamily: 'DMSans-Medium',
    color: Colors.textSecondary,
    fontSize: 16,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#161616',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    maxHeight: '85%',
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
    color: Colors.textTertiary,
    letterSpacing: 1.5,
  },
  modalResetText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 13,
    color: Colors.primary,
  },
  filterSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    gap: 8,
  },
  muscleChipActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  muscleChipText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  equipChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  equipChipActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
  },
  equipChipText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  equipChipTextActive: {
    color: Colors.primary,
  },
});
