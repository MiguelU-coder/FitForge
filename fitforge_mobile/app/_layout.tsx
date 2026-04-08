import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, LogBox, Platform } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../src/theme/colors';
import { useAuthStore } from '../src/stores/useAuthStore';

// Suppress known development-only warnings from react-native-svg on web
// These come from the library passing native RN props to the DOM and are harmless
if (Platform.OS === 'web') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const msg = args[0];
    if (typeof msg === 'string' && (
      msg.includes('accessible') ||
      msg.includes('onStartShouldSetResponder') ||
      msg.includes('onResponderTerminationRequest') ||
      msg.includes('onResponderGrant') ||
      msg.includes('onResponderRelease') ||
      msg.includes('onResponderMove') ||
      msg.includes('non-boolean attribute')
    )) return;
    originalConsoleError(...args);
  };
}

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

    const currentPath = segments.join('/');
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = currentPath === 'onboarding' || currentPath === '(auth)/onboarding';

    if (!isAuthenticated && !inAuthGroup) {
      // Not logged in → go to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated) {
      const needsOnboarding = !(user?.hasCompletedOnboarding ?? true);
      if (needsOnboarding && !inOnboarding) {
        router.replace('/(auth)/onboarding');
      } else if (!needsOnboarding && inOnboarding) {
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Slot />
    </GestureHandlerRootView>
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
