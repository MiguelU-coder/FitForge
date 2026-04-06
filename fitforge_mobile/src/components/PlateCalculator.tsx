// src/components/PlateCalculator.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal } from 'react-native';
import { Colors } from '../theme/colors';

const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const BAR_WEIGHT = 20;

export default function PlateCalculator() {
  const [visible, setVisible] = useState(false);
  const [targetWeight, setTargetWeight] = useState('');

  // Calculates plates for ONE side of the bar
  const calculatePlates = (target: number) => {
    let remaining = (target - BAR_WEIGHT) / 2;
    if (remaining <= 0) return [];

    const plates: number[] = [];
    for (const plate of AVAILABLE_PLATES) {
      while (remaining >= plate) {
        plates.push(plate);
        remaining -= plate;
        remaining = Math.round(remaining * 100) / 100; // fix float precision
      }
    }
    return plates;
  };

  const plates = targetWeight ? calculatePlates(parseFloat(targetWeight)) : [];

  return (
    <>
      <Pressable style={styles.fab} onPress={() => setVisible(true)}>
        <Text style={styles.fabText}>🧮</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>PLATE CALCULATOR</Text>
              <Pressable onPress={() => setVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.label}>TARGET WEIGHT (KG)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                autoFocus
                placeholder="100"
                placeholderTextColor={Colors.textMuted}
                value={targetWeight}
                onChangeText={setTargetWeight}
              />
              <Text style={styles.hint}>Assumes a standard 20kg barbell.</Text>
            </View>

            <View style={styles.resultArea}>
              <Text style={styles.resultTitle}>PLATES PER SIDE</Text>
              {targetWeight && parseFloat(targetWeight) < 20 ? (
                <Text style={styles.errorText}>Weight is less than the bar (20kg)</Text>
              ) : targetWeight && plates.length === 0 ? (
                <Text style={styles.successText}>Just the bar!</Text>
              ) : plates.length > 0 ? (
                <View style={styles.platesRow}>
                  {plates.map((p, i) => (
                    <View key={i} style={styles.plate}>
                      <Text style={styles.plateText}>{p}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Enter a weight to calculate</Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    left: 20,
    bottom: 100, // Above tabs and rest timer
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.elevated}E6`,
    borderWidth: 1,
    borderColor: `${Colors.primary}4D`,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: { fontSize: 20 },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    letterSpacing: 1,
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: `${Colors.elevated}80`,
    borderRadius: 16,
  },
  closeBtnText: {
    color: Colors.textTertiary,
    fontSize: 16,
  },
  inputWrap: { marginBottom: 24 },
  label: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: `${Colors.elevated}80`,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontFamily: 'BebasNeue',
    fontSize: 32,
    color: Colors.primary,
    textAlign: 'center',
  },
  hint: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  resultArea: {
    alignItems: 'center',
    backgroundColor: `${Colors.elevated}4D`,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
    letterSpacing: 1.5,
  },
  platesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  plate: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plateText: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    color: '#FFF',
  },
  errorText: { fontFamily: 'DMSans-Medium', color: Colors.error },
  successText: { fontFamily: 'DMSans-Bold', color: Colors.success, fontSize: 18 },
  emptyText: { fontFamily: 'DMSans-Medium', color: Colors.textTertiary },
});
