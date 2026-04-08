// src/components/RestTimer.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Colors } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNotifications } from '../hooks/useNotifications';

interface RestTimerProps {
  initialSeconds: number;
  onTimerEnd?: () => void;
  onDismiss?: () => void;
}

export default function RestTimer({ initialSeconds, onTimerEnd, onDismiss }: RestTimerProps) {
  const { scheduleRestTimerNotification, cancelAllNotifications } = useNotifications();
  
  // States based on timestamps for better accuracy
  const [targetTime, setTargetTime] = useState<number>(Date.now() + initialSeconds * 1000);
  const [remaining, setRemaining] = useState(initialSeconds);
  const progressAnim = useRef(new Animated.Value(1)).current;

  // Initialize and schedule notification
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scheduleRestTimerNotification(initialSeconds);
    return () => {
      cancelAllNotifications();
    };
  }, []);

  // Sync internal state if initialSeconds changes
  useEffect(() => {
    const newTarget = Date.now() + initialSeconds * 1000;
    setTargetTime(newTarget);
    setRemaining(initialSeconds);
  }, [initialSeconds]);

  // Main loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((targetTime - now) / 1000));
      
      setRemaining(prev => {
        if (prev !== diff) return diff;
        return prev;
      });

      const totalDuration = initialSeconds; 
      const currentProgress = Math.max(0, (targetTime - now) / (totalDuration * 1000));
      
      Animated.timing(progressAnim, {
        toValue: currentProgress,
        duration: 200,
        useNativeDriver: false,
      }).start();

      if (now >= targetTime) {
        clearInterval(interval);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onTimerEnd?.();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [targetTime, initialSeconds]); // Removed onTimerEnd to prevent constant restarts

  const addTime = useCallback(async (secs: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newRemaining = remaining + secs;
    const newTarget = targetTime + secs * 1000;
    
    setTargetTime(newTarget);
    setRemaining(newRemaining);

    // Reschedule notification
    await cancelAllNotifications();
    await scheduleRestTimerNotification(newRemaining);
  }, [remaining, targetTime]);

  const skipTimer = () => {
    Haptics.selectionAsync();
    cancelAllNotifications();
    onDismiss?.();
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (remaining <= 0 && Date.now() >= targetTime) return null;

  return (
    <View style={styles.container}>
      <View style={styles.progressBarContainer}>
        <Animated.View 
          style={[
            styles.progressBar, 
            { 
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              }) 
            }
          ]} 
        />
      </View>

      <View style={styles.content}>
        <View style={styles.left}>
          <Text style={styles.label}>RESTING</Text>
          <Text style={styles.timer}>{formatTime(remaining)}</Text>
        </View>
        
        <View style={styles.actions}>
          <Pressable style={styles.btn} onPress={() => addTime(30)}>
            <Text style={styles.btnText}>+30s</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.skipBtn]} onPress={skipTimer}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryBright]}
              style={styles.skipGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.skipText}>SKIP</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: `${Colors.elevated}FB`,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.border}`,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: `${Colors.border}40`,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  left: {
    gap: -4,
  },
  label: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
  },
  timer: {
    fontFamily: 'BebasNeue',
    fontSize: 38,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btn: {
    backgroundColor: `${Colors.border}40`,
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  skipBtn: {
    borderWidth: 0,
  },
  skipGradient: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  skipText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: '#FFF',
    letterSpacing: 0.5,
  }
});
