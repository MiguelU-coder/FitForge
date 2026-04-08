import { View, Text, StyleSheet, TextInput, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Swipeable } from 'react-native-gesture-handler';

export type RirValue = undefined | 0 | 1 | 2 | 3 | 4;

export interface WorkoutSetRowProps {
  setNumber: number;
  weight: string;
  reps: string;
  rir: RirValue;
  isCompleted?: boolean;
  isEmptyRow?: boolean;
  onWeightChange: (val: string) => void;
  onRepsChange: (val: string) => void;
  onRirChange?: (val: RirValue) => void;
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
  setNumber, weight, reps, rir, isCompleted, isEmptyRow,
  onWeightChange, onRepsChange, onRirChange, onCheck, onDelete, onBlur, onOpenCalculator
}: WorkoutSetRowProps) {

  const renderRightActions = (progress: any, dragX: any) => {
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
        {/* Set Number */}
        <View style={styles.setNumberWrap}>
          <View style={[styles.setNumberBox, isCompleted && styles.setNumberBoxActive]}>
            <Text style={[styles.setNumberText, isCompleted && styles.setNumberTextActive]}>
              {setNumber}
            </Text>
          </View>
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
          {onOpenCalculator && !isCompleted && (
            <Pressable 
                style={styles.calcTrigger} 
                onPress={onOpenCalculator}
                hitSlop={6}
            >
                <Ionicons name="calculator-outline" size={10} color={Colors.textTertiary} />
            </Pressable>
          )}
        </View>

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
    width: 28,
    height: 32,
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
  inputWrap: {
    width: 44,
  },
  input: {
    height: 38,
    backgroundColor: '#1E1E1E', // Dark carbon input
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    color: Colors.textPrimary,
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
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
    width: 44,
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
  calcTrigger: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    backgroundColor: '#333',
    borderRadius: 4,
    padding: 1,
  }
});
