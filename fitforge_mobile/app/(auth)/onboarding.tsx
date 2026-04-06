// app/(auth)/onboarding.tsx
import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, FlatList, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'TRACK EVERY REP',
    subtitle: 'Log your sets, reps, and RPE with precision. Let FitForge crunch the numbers.',
    icon: '📊',
  },
  {
    id: '2',
    title: 'AI COACHING',
    subtitle: 'Get real-time feedback on your performance and fatigue. Train smarter, not harder.',
    icon: '🤖',
  },
  {
    id: '3',
    title: 'SMASH YOUR PRS',
    subtitle: 'Track your body metrics and volume. Watch your strength skyrocket over time.',
    icon: '🚀',
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0]?.index ?? 0);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={SLIDES}
        ref={slidesRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>{item.icon}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.paginator}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 32, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View style={[styles.dot, { width: dotWidth, opacity }]} key={i.toString()} />
            );
          })}
        </View>

        <Pressable style={styles.btn} onPress={scrollToNext}>
          <Text style={styles.btnText}>
            {currentIndex === SLIDES.length - 1 ? "LET'S TRAIN" : 'NEXT'}
          </Text>
        </Pressable>

        <Pressable style={styles.skipBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.skipText}>SKIP</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: `${Colors.primary}1A`,
    borderWidth: 2,
    borderColor: `${Colors.primary}4D`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  iconText: {
    fontSize: 80,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'BebasNeue',
    fontSize: 48,
    color: Colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  paginator: {
    flexDirection: 'row',
    height: 20,
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginHorizontal: 4,
  },
  btn: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16,
  },
  btnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    letterSpacing: 2,
    color: '#FFF',
  },
  skipBtn: {
    padding: 10,
  },
  skipText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: Colors.textTertiary,
    letterSpacing: 1,
  }
});
