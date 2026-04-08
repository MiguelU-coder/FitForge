// app/(auth)/onboarding.tsx
import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  Animated,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore, type Gender, type TrainingLevel, type UserGoal } from '../../src/stores/useOnboardingStore';
import { GenderSelector } from '../../src/components/onboarding/GenderSelector';
import { LevelSelector } from '../../src/components/onboarding/LevelSelector';
import { GoalSelector } from '../../src/components/onboarding/GoalSelector';
import { RoutinePreview } from '../../src/components/onboarding/RoutinePreview';

const { width } = Dimensions.get('window');

const WELCOME_SLIDES = [
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
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const {
    currentStep,
    gender,
    trainingLevel,
    mainGoal,
    generatedProgram,
    isLoading,
    setStep,
    nextStep,
    prevStep,
    setGender,
    setTrainingLevel,
    setMainGoal,
    savePreferences,
    generateRoutine,
  } = useOnboardingStore();

  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setWelcomeIndex(viewableItems[0]?.index ?? 0);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollToNext = () => {
    if (welcomeIndex < WELCOME_SLIDES.length - 1) {
      slidesRef.current?.scrollToIndex({ index: welcomeIndex + 1 });
    } else {
      nextStep();
    }
  };

  const handleGenderSelect = (g: Gender) => {
    setGender(g);
    nextStep();
  };

  const handleLevelSelect = (l: TrainingLevel) => {
    setTrainingLevel(l);
    nextStep();
  };

  const handleGoalSelect = async (g: UserGoal) => {
    setMainGoal(g);
    try {
      await savePreferences();
      await generateRoutine();
      nextStep();
    } catch (e) {
      console.error('Onboarding error:', e);
    }
  };

  const handleGoalSkip = async () => {
    try {
      await savePreferences();
      await generateRoutine();
      nextStep();
    } catch (e) {
      console.error('Onboarding error:', e);
    }
  };

  const handleGenerateAndFinish = async () => {
    try {
      await savePreferences();
      await generateRoutine();
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Onboarding error:', e);
    }
  };

  const renderWelcomeStep = () => (
    <>
      <FlatList
        data={WELCOME_SLIDES}
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
          {WELCOME_SLIDES.map((_, i) => {
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
            {welcomeIndex === WELCOME_SLIDES.length - 1 ? "LET'S GO" : 'NEXT'}
          </Text>
        </Pressable>
      </View>
    </>
  );

  const renderOnboardingStep = () => (
    <View style={[styles.onboardingContainer, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.stepIndicator}>
        <Pressable onPress={prevStep} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.stepDots}>
          {[1, 2, 3, 4].map((step) => (
            <View
              key={step}
              style={[
                styles.stepDot,
                currentStep >= step && styles.stepDotActive,
              ]}
            />
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.stepContent}>
        {currentStep === 1 && (
          <GenderSelector selected={gender} onSelect={handleGenderSelect} />
        )}
        {currentStep === 2 && (
          <LevelSelector selected={trainingLevel} onSelect={handleLevelSelect} />
        )}
        {currentStep === 3 && (
          <GoalSelector selected={mainGoal} onSelect={handleGoalSelect} onSkip={handleGoalSkip} />
        )}
        {currentStep === 4 && generatedProgram && (
          <RoutinePreview
            program={generatedProgram}
            isLoading={isLoading}
            onConfirm={handleGenerateAndFinish}
            onBack={prevStep}
          />
        )}
        {currentStep === 4 && !generatedProgram && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Generando tu programa...</Text>
          </View>
        )}
      </View>

      {currentStep < 4 && currentStep > 0 && (
        <View style={styles.footerOnboarding}>
          <Pressable
            style={[styles.btn, (!gender || !trainingLevel) && styles.btnDisabled]}
            onPress={() => {
              if (currentStep === 1 && gender) nextStep();
              if (currentStep === 2 && trainingLevel) nextStep();
              if (currentStep === 3) nextStep();
            }}
            disabled={currentStep === 1 && !gender || currentStep === 2 && !trainingLevel}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.textOnPrimary} />
            ) : (
              <Text style={styles.btnText}>CONTINUAR</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {currentStep === 0 ? renderWelcomeStep() : renderOnboardingStep()}
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
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
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
  },
  btnDisabled: {
    backgroundColor: Colors.textTertiary,
    shadowOpacity: 0,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.textOnPrimary,
  },
  skipBtn: {
    padding: 10,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  onboardingContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: Colors.primary,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepContent: {
    flex: 1,
  },
  footerOnboarding: {
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
