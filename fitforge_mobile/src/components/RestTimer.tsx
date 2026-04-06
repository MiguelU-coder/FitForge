// src/components/RestTimer.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../theme/colors';

interface RestTimerProps {
  initialSeconds: number;
  onTimerEnd?: () => void;
  onDismiss?: () => void;
}

export default function RestTimer({ initialSeconds, onTimerEnd, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && remaining > 0) {
      interval = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            onTimerEnd?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, remaining, onTimerEnd]);

  useEffect(() => {
    setRemaining(initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);

  const addTime = (secs: number) => {
    setRemaining((prev) => prev + secs);
    setIsActive(true);
  };

  const skipTimer = () => {
    setRemaining(0);
    setIsActive(false);
    onDismiss?.();
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isActive && remaining === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>RESTING</Text>
        <Text style={styles.timer}>{formatTime(remaining)}</Text>
        
        <View style={styles.actions}>
          <Pressable style={styles.btn} onPress={() => addTime(30)}>
            <Text style={styles.btnText}>+30s</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.skipBtn]} onPress={skipTimer}>
            <Text style={[styles.btnText, { color: '#FFF' }]}>SKIP</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: `${Colors.elevated}EB`, // slight transparency
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${Colors.primary}4D`,
    padding: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    letterSpacing: 1.5,
    color: Colors.primaryBright,
    position: 'absolute',
    top: -6,
    left: 4,
  },
  timer: {
    fontFamily: 'BebasNeue',
    fontSize: 42,
    color: Colors.textPrimary,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: `${Colors.background}80`,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  btnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
    color: Colors.textSecondary,
  }
});
