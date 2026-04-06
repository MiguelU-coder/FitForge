// src/components/SessionSummary.tsx
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Colors } from '../theme/colors';
import { WorkoutSession } from '../types/workout';

interface SessionSummaryProps {
  session: WorkoutSession | null;
  visible: boolean;
  onClose: () => void;
}

export default function SessionSummary({ session, visible, onClose }: SessionSummaryProps) {
  if (!session) return null;

  const totalSets = session.exerciseBlocks?.reduce((acc, block) => acc + block.sets.length, 0) || 0;
  const totalVolume = session.exerciseBlocks?.reduce((acc, block) => {
    return acc + block.sets.reduce((setAcc, set) => setAcc + ((set.weightKg || 0) * (set.reps || 0)), 0);
  }, 0) || 0;

  const durationMin = session.durationSeconds ? Math.floor(session.durationSeconds / 60) : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBg}>
        <View style={styles.modalContent}>
          <Text style={styles.congrats}>WORKOUT COMPLETE! 🏆</Text>
          <Text style={styles.title}>{session.name}</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>DURATION</Text>
              <Text style={styles.statValue}>{durationMin}m</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>VOLUME</Text>
              <Text style={styles.statValue}>{totalVolume} kg</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>SETS</Text>
              <Text style={styles.statValue}>{totalSets}</Text>
            </View>
            {session.perceivedExertion ? (
               <View style={styles.statBox}>
               <Text style={styles.statLabel}>RPE (EFFORT)</Text>
               <Text style={styles.statValue}>{session.perceivedExertion}/10</Text>
             </View>
            ) : null}
          </View>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>DONE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${Colors.primary}4D`,
  },
  congrats: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    letterSpacing: 2,
    color: Colors.primaryBright,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'BebasNeue',
    fontSize: 32,
    color: Colors.textPrimary,
    marginBottom: 32,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  statBox: {
    backgroundColor: `${Colors.elevated}80`,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: '45%',
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    letterSpacing: 1.5,
    color: Colors.textTertiary,
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'BebasNeue',
    fontSize: 28,
    color: Colors.secondaryBright,
  },
  closeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  closeBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    letterSpacing: 2,
    color: '#FFF',
  }
});
