import 'react-native-gesture-handler';
import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../src/theme/colors';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useWorkoutStore } from '../src/stores/useWorkoutStore';

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
  const { checkForActiveSession } = useWorkoutStore();
  const segments = useSegments();
  const router = useRouter();
  const hasCheckedSession = useRef(false);

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

  // Check for active session once on app start (after auth is ready)
  useEffect(() => {
    if (!fontsLoaded || !isAuthenticated || hasCheckedSession.current) return;

    hasCheckedSession.current = true;
    checkForActiveSession();
  }, [fontsLoaded, isAuthenticated, checkForActiveSession]);

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
      // Note: active session redirect is handled by the home page "Reanudar" card,
      // not by forcing navigation here — avoids interfering with cancel/finish flows
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[Colors.background, `${Colors.primary}08`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
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
