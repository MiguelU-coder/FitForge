// src/components/ExercisePickerModal.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Colors } from '../theme/colors';
import { useExerciseStore } from '../stores/useExerciseStore';
import { Exercise, MUSCLE_GROUPS, formatLabel } from '../types/exercise';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ExerciseCard from './ExerciseCard';

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export default function ExercisePickerModal({ visible, onClose, onSelect }: ExercisePickerModalProps) {
  const insets = useSafeAreaInsets();
  const { filters, page, isLoading, fetchExercises, setFilters } = useExerciseStore();
  const [searchInput, setSearchInput] = useState('');

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
          <Text style={styles.title}>SELECT EXERCISE</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </Pressable>
        </View>

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

        <View style={{ marginBottom: 12 }}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['ALL', ...MUSCLE_GROUPS]}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected = item === 'ALL' ? !filters.muscle : filters.muscle === item;
              return (
                <Pressable
                  style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                  onPress={() => setFilters({ muscle: item === 'ALL' ? undefined : item })}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                    {item === 'ALL' ? 'All Groups' : formatLabel(item)}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={page?.exercises ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
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
    marginBottom: 16,
  },
  title: {
    fontFamily: 'BebasNeue',
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: Colors.elevated,
    borderRadius: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
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
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipSelected: {
    backgroundColor: Colors.primaryBright,
    borderColor: Colors.primaryBright,
  },
  filterChipText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterChipTextSelected: {
    color: '#000',
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
  }
});
