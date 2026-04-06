// app/onboarding/index.tsx
// Placeholder — will be built in Phase 2

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../../src/theme/colors';
import { useAuthStore } from '../../src/stores/useAuthStore';

export default function OnboardingScreen() {
  const { updateProfile } = useAuthStore();

  const handleSkip = async () => {
    await updateProfile({ has_completed_onboarding: true });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ONBOARDING</Text>
      <Text style={styles.subtitle}>Full onboarding flow coming in Phase 2</Text>
      <Pressable style={styles.btn} onPress={handleSkip}>
        <Text style={styles.btnText}>SKIP FOR NOW</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  title: { fontFamily: 'BebasNeue', fontSize: 40, color: Colors.primary },
  subtitle: {
    fontFamily: 'DMSans-Regular', fontSize: 14, color: Colors.textSecondary,
    marginTop: 12, textAlign: 'center',
  },
  btn: {
    marginTop: 32, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 14, backgroundColor: Colors.primary,
  },
  btnText: { fontFamily: 'DMSans-Bold', fontSize: 15, letterSpacing: 1, color: '#FFF' },
});
