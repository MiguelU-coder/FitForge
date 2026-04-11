// app/(tabs)/exercises.tsx
// Port of exercises_screen.dart — "Industrial Premium Athletic" design
// Reference: lib/features/exercises/presentation/screens/exercises_screen.dart

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, Shadows } from "../../src/theme/colors";
import { useExerciseStore } from "../../src/stores/useExerciseStore";
import {
  MUSCLE_GROUPS,
  EQUIPMENT_LIST,
  formatLabel,
} from "../../src/types/exercise";
import ExerciseCard from "../../src/components/ExerciseCard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getMuscleColor } from "../../src/utils/muscleColors";
import { ScrollView } from "react-native";

export default function ExercisesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { filters, page, isLoading, error, setFilters, fetchExercises } =
    useExerciseStore();
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
    setFilters({ muscle: undefined, equipment: undefined, search: "" });
    setSearchInput("");
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
            <Text style={styles.title}>EJERCICIOS</Text>
            <Text style={styles.subtitle}>Base de datos de ejercicios</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={[
                styles.filterBtn,
                hasActiveFilters && styles.filterBtnActive,
              ]}
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
              onPress={() => router.push("/exercise/create")}
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
            placeholder="Buscar ejercicios..."
            placeholderTextColor={Colors.textMuted}
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <Pressable
              onPress={() => {
                setSearchInput("");
                setFilters({ search: "" });
              }}
              style={{ padding: 4 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={Colors.textTertiary}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Exercise Grid ── */}
      {isLoading && (!page || page.exercises.length === 0) ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <View style={styles.errorIconWrap}>
            <Ionicons
              name="wifi-outline"
              size={32}
              color={Colors.textTertiary}
            />
          </View>
          <Text style={styles.errorTitle}>Error de conexión</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => fetchExercises(1)}>
            <Text style={styles.retryBtnText}>Reintentar</Text>
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
              <Text style={styles.emptyTitle}>
                No se encontraron resultados
              </Text>
              <Text style={styles.emptySubtitle}>
                Intenta con un término de búsqueda diferente o borra los filtros
              </Text>
              {hasActiveFilters && (
                <Pressable
                  style={styles.clearFiltersBtn}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearFiltersBtnText}>Borrar filtros</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}

      {/* ── Advanced Filters Modal ── */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowFilters(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>FILTROS AVANZADOS</Text>
              <Pressable onPress={clearFilters}>
                <Text style={styles.modalResetText}>Reiniciar</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Muscle Group */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>GRUPO MUSCULAR</Text>
                <View style={styles.chipWrap}>
                  <Pressable
                    style={[
                      styles.muscleChip,
                      !filters.muscle && styles.muscleChipActive,
                    ]}
                    onPress={() => setFilters({ muscle: undefined })}
                  >
                    <Ionicons
                      name="apps"
                      size={16}
                      color={getMuscleColor("ALL")}
                    />
                    <Text
                      style={[
                        styles.muscleChipText,
                        !filters.muscle && { color: "#FFF" },
                      ]}
                    >
                      All
                    </Text>
                  </Pressable>
                  {MUSCLE_GROUPS.map((muscle) => {
                    const isActive = filters.muscle === muscle;
                    return (
                      <Pressable
                        key={muscle}
                        style={[
                          styles.muscleChip,
                          isActive && styles.muscleChipActive,
                        ]}
                        onPress={() =>
                          setFilters({ muscle: isActive ? undefined : muscle })
                        }
                      >
                        <Ionicons
                          name="body"
                          size={16}
                          color={getMuscleColor(muscle)}
                        />
                        <Text
                          style={[
                            styles.muscleChipText,
                            isActive ? { color: "#FFF" } : null,
                          ]}
                        >
                          {formatLabel(muscle)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Equipment */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>EQUIPAMIENTO</Text>
                <View style={styles.chipWrap}>
                  <Pressable
                    style={[
                      styles.equipChip,
                      !filters.equipment && styles.equipChipActive,
                    ]}
                    onPress={() => setFilters({ equipment: undefined })}
                  >
                    <Text
                      style={[
                        styles.equipChipText,
                        !filters.equipment && styles.equipChipTextActive,
                      ]}
                    >
                      All
                    </Text>
                  </Pressable>
                  {EQUIPMENT_LIST.map((eq) => {
                    const isActive = filters.equipment === eq;
                    return (
                      <Pressable
                        key={eq}
                        style={[
                          styles.equipChip,
                          isActive && styles.equipChipActive,
                        ]}
                        onPress={() =>
                          setFilters({ equipment: isActive ? undefined : eq })
                        }
                      >
                        <Text
                          style={[
                            styles.equipChipText,
                            isActive ? styles.equipChipTextActive : null,
                          ]}
                        >
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  headerSection: {
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontFamily: "BebasNeue",
    fontSize: 34,
    letterSpacing: 2,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: "DMSans-Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.elevated,
    justifyContent: "center",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.primaryGlow,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    fontFamily: "DMSans-Medium",
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
    fontFamily: "DMSans-Bold",
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
    justifyContent: "center",
    alignItems: "center",
  },

  // Error
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.elevated,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  errorTitle: {
    fontFamily: "DMSans-Bold",
    fontSize: 16,
    color: Colors.textPrimary,
  },
  errorSubtitle: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
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
    fontFamily: "DMSans-Bold",
    fontSize: 13,
    color: Colors.primary,
  },

  // Exercise List
  exerciseList: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  exerciseRow: {
    gap: 16,
    marginBottom: 16,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.elevated,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: "DMSans-Bold",
    fontSize: 16,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    fontWeight: "300",
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
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
    fontFamily: "DMSans-Bold",
    fontSize: 13,
    color: Colors.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#161616",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textTertiary,
    letterSpacing: 1.5,
  },
  modalResetText: {
    fontFamily: "DMSans-SemiBold",
    fontSize: 13,
    color: Colors.primary,
  },
  filterSection: {
    // Add general section spacing
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: "DMSans-Medium",
    fontSize: 12,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: "row",
    gap: 12,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  // Source Chips
  sourceChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  sourceChipActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
  },
  sourceChipText: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sourceChipTextActive: {
    color: Colors.primary,
    fontFamily: "DMSans-Medium",
  },

  // Muscle Chips
  muscleChip: {
    flexDirection: "row",
    alignItems: "center",
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
    fontFamily: "DMSans-Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Equipment Chips
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
    fontFamily: "DMSans-Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  equipChipTextActive: {
    color: Colors.primary,
  },
});
