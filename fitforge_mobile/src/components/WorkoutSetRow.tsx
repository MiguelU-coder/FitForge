import { View, Text, StyleSheet, TextInput, Pressable, Animated, Modal } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Swipeable } from 'react-native-gesture-handler';

export type RirValue = undefined | 0 | 1 | 2 | 3 | 4;
export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure' | 'unilateral';

interface SetTypeConfig {
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  icon: string;
}

const SET_TYPE_CONFIG: Record<SetType, SetTypeConfig> = {
  normal:     { label: 'Normal',       shortLabel: '',  description: 'Serie estándar de trabajo',         color: Colors.textSecondary, icon: 'fitness-outline' },
  warmup:     { label: 'Calentamiento',shortLabel: 'W', description: 'Peso reducido para activar músculos', color: '#F59E0B',             icon: 'sunny-outline' },
  dropset:    { label: 'Drop Set',     shortLabel: 'D', description: 'Reduce el peso sin descanso',       color: '#0EA5E9',             icon: 'trending-down-outline' },
  failure:    { label: 'Al Fallo',     shortLabel: 'F', description: 'Hasta el fallo muscular',           color: '#EF4444',             icon: 'flame-outline' },
  unilateral: { label: 'Unilateral',   shortLabel: 'U', description: 'Un lado a la vez',                 color: '#A855F7',             icon: 'body-outline' },
};

export interface WorkoutSetRowProps {
  setNumber: number;
  weight: string;
  reps: string;
  rir: RirValue;
  setType?: SetType;
  isCompleted?: boolean;
  isEmptyRow?: boolean;
  onWeightChange: (val: string) => void;
  onRepsChange: (val: string) => void;
  onRirChange?: (val: RirValue) => void;
  onSetTypeChange?: (type: SetType) => void;
  onCheck: () => void;
  onDelete?: () => void;
  onBlur?: () => void;
  onOpenCalculator?: () => void;
}

const RIR_OPTIONS: number[] = [0, 1, 2, 3, 4];

const RIR_COLORS: Record<number, string> = {
  0: '#EF4444', // Red - Failure
  1: '#F97316', // Orange - Near Failure
  2: '#F59E0B', // Amber - Intense
  3: '#84CC16', // Lime - Moderate
  4: '#10B981', // Green - Warmup/Easy
};

export default function WorkoutSetRow({
  setNumber, weight, reps, rir, setType = 'normal', isCompleted, isEmptyRow,
  onWeightChange, onRepsChange, onRirChange, onSetTypeChange, onCheck, onDelete, onBlur, onOpenCalculator
}: WorkoutSetRowProps) {
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const typeConfig = SET_TYPE_CONFIG[setType];

  const renderRightActions = (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Pressable style={styles.deleteAction} onPress={onDelete}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={24} color="#FFF" />
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <Swipeable 
      renderRightActions={(!isEmptyRow && onDelete) ? renderRightActions : undefined} 
      rightThreshold={40}
      friction={2}
    >
      <View style={styles.container}>
        {/* Set Number — tap to change set type */}
        <View style={styles.setNumberWrap}>
          <Pressable
            style={[
              styles.setNumberBox,
              isCompleted && styles.setNumberBoxActive,
              setType !== 'normal' && { borderColor: typeConfig.color, backgroundColor: `${typeConfig.color}1A` },
            ]}
            onPress={() => onSetTypeChange && setTypeModalVisible(true)}
            disabled={!onSetTypeChange}
          >
            {setType !== 'normal' ? (
              <Text style={[styles.setTypeShortLabel, { color: typeConfig.color }]}>
                {typeConfig.shortLabel}
              </Text>
            ) : (
              <Text style={[styles.setNumberText, isCompleted && styles.setNumberTextActive]}>
                {setNumber}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Weight Input */}
        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.input, isCompleted && styles.inputCompleted]}
            value={weight}
            onChangeText={onWeightChange}
            onBlur={onBlur}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={Colors.textTertiary}
            editable={!isCompleted}
          />
        </View>

        {/* Plate Calculator Button */}
        {onOpenCalculator && !isCompleted ? (
          <Pressable
            style={({ pressed }) => [
              styles.calcBtn,
              pressed && styles.calcBtnPressed,
            ]}
            onPress={onOpenCalculator}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Abrir calculadora de discos"
          >
            <Ionicons name="barbell-outline" size={16} color={Colors.primary} />
          </Pressable>
        ) : (
          /* placeholder to preserve layout when completed */
          <View style={styles.calcBtnPlaceholder} />
        )}

        {/* Reps Input */}
        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.input, isCompleted && styles.inputCompleted]}
            value={reps}
            onChangeText={onRepsChange}
            onBlur={onBlur}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={Colors.textTertiary}
            editable={!isCompleted}
          />
        </View>

        {/* RIR Selector */}
        <View style={styles.rirArray}>
          {RIR_OPTIONS.map((val) => {
            const isSelected = rir === val;
            const rirColor = RIR_COLORS[val];
            
            return (
              <Pressable 
                key={val} 
                style={[
                  styles.rirPill, 
                  isSelected && {
                    borderColor: rirColor,
                    backgroundColor: `${rirColor}1A`, // 10% opacity
                  },
                  isCompleted && !isSelected && { opacity: 0.5 }
                ]}
                onPress={() => !isCompleted && onRirChange?.(val as RirValue)}
                disabled={isCompleted}
              >
                <Text style={[
                  styles.rirText, 
                  isSelected && {
                    color: rirColor,
                    fontFamily: 'DMSans-Bold',
                  }
                ]}>
                  {val}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Check Button */}
        <View style={styles.checkWrap}>
          <Pressable 
            style={[styles.checkBtn, isCompleted && styles.checkBtnActive, isEmptyRow && styles.checkBtnEmpty]}
            onPress={onCheck}
          >
            <Ionicons 
              name="checkmark" 
              size={20} 
              color={isCompleted ? Colors.background : (isEmptyRow ? Colors.textTertiary : Colors.background)} 
              style={isCompleted ? {} : { opacity: isEmptyRow ? 0.5 : 1 }}
            />
          </Pressable>
        </View>
      </View>

      {/* ── Set Type Picker Modal ── */}
      <Modal
        visible={typeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTypeModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setTypeModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Tipo de Serie — Set {setNumber}</Text>
            <Text style={styles.modalSubtitle}>Selecciona el tipo para esta serie</Text>

            <View style={styles.modalOptions}>
              {(Object.keys(SET_TYPE_CONFIG) as SetType[]).map((type) => {
                const cfg = SET_TYPE_CONFIG[type];
                const isSelected = setType === type;
                return (
                  <Pressable
                    key={type}
                    style={[
                      styles.modalOption,
                      isSelected && { borderColor: cfg.color, backgroundColor: `${cfg.color}12` },
                    ]}
                    onPress={() => {
                      onSetTypeChange?.(type);
                      setTypeModalVisible(false);
                    }}
                  >
                    <View style={[styles.modalOptionIcon, { backgroundColor: `${cfg.color}20` }]}>
                      <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
                    </View>
                    <View style={styles.modalOptionText}>
                      <Text style={[styles.modalOptionLabel, isSelected && { color: cfg.color }]}>
                        {cfg.label}
                      </Text>
                      <Text style={styles.modalOptionDesc}>{cfg.description}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={cfg.color} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
    gap: 6,
  },
  setNumberWrap: {
    width: 28,
    alignItems: 'center',
  },
  setNumberBox: {
    width: 24,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${Colors.border}80`,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  setNumberBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}1A`,
  },
  setNumberText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  setNumberTextActive: {
    color: Colors.primary,
  },
  setTypeShortLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  inputWrap: {
    width: 38,
  },
  input: {
    height: 28,
    backgroundColor: '#1E1E1E', // Dark carbon input
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    color: Colors.textPrimary,
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    textAlign: 'center',
  },
  inputCompleted: {
    backgroundColor: '#121212',
    borderColor: 'transparent',
    color: Colors.textSecondary,
  },
  rirArray: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
    justifyContent: 'center',
    marginLeft: 6,
  },
  rirPill: {
    width: 22,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  rirText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: Colors.textTertiary,
  },
  checkWrap: {
    width: 38,
    alignItems: 'flex-end',
  },
  checkBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  checkBtnEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333333',
  },
  deleteAction: {
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    marginVertical: 6,
    marginRight: 16,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  calcBtn: {
    width: 38,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}15`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  calcBtnPressed: {
    backgroundColor: `${Colors.primary}30`,
    borderColor: Colors.primary,
  },
  calcBtnPlaceholder: {
    width: 38,
  },

  // ── Set Type Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  modalOptions: {
    gap: 10,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.elevated,
    gap: 14,
  },
  modalOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionLabel: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  modalOptionDesc: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
