// app/_layout.tsx
// Root layout — equivalent to main.dart
// Initializes fonts, Supabase auth listener, and provides navigation structure

import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { Colors } from '../src/theme/colors';
import { useAuthStore } from '../src/stores/useAuthStore';

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const { isAuthenticated, user, _initAuthListener } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Load fonts — matching Flutter typography (Bebas Neue, Archivo Black, DM Sans)
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        // Display fonts (Bebas Neue for headlines, numbers)
        'BebasNeue': require('../assets/fonts/BebasNeue-Regular.ttf'),
        // Archivo Black for section titles
        'ArchivoBlack': require('../assets/fonts/ArchivoBlack-Regular.ttf'),
        // DM Sans for body, labels, buttons
        'DMSans-Regular': require('../assets/fonts/DMSans-Regular.ttf'),
        'DMSans-Medium': require('../assets/fonts/DMSans-Medium.ttf'),
        'DMSans-SemiBold': require('../assets/fonts/DMSans-SemiBold.ttf'),
        'DMSans-Bold': require('../assets/fonts/DMSans-Bold.ttf'),
        // Inter for UI elements
        'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
        'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
        'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
        'Inter-ExtraBold': require('../assets/fonts/Inter-ExtraBold.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  // Initialize auth listener
  useEffect(() => {
    _initAuthListener();
  }, []);

  // Auth-based navigation guard (replaces GoRouter redirect)
  useEffect(() => {
    if (!fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup) {
      // Not logged in → go to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated) {
      const needsOnboarding = !(user?.hasCompletedOnboarding ?? true);
      if (needsOnboarding && !inOnboarding) {
        router.replace('/onboarding');
      } else if (!needsOnboarding && (inAuthGroup || inOnboarding)) {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, user?.hasCompletedOnboarding, fontsLoaded, segments]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
