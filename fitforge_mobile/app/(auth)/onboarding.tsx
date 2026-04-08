// app/(auth)/onboarding.tsx
// Unified onboarding — welcome slides + profile setup + training preferences + routine preview

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ActivityIndicator,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/theme/colors';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useWorkoutStore } from '../../src/stores/useWorkoutStore';
import {
  useOnboardingStore,
  type Gender,
  type TrainingLevel,
  type UserGoal,
} from '../../src/stores/useOnboardingStore';
import { GenderSelector } from '../../src/components/onboarding/GenderSelector';
import { LevelSelector } from '../../src/components/onboarding/LevelSelector';
import { GoalSelector } from '../../src/components/onboarding/GoalSelector';
import { RoutinePreview } from '../../src/components/onboarding/RoutinePreview';

// ─── Constants ──────────────────────────────────────────────────────────────

const { width } = Dimensions.get('window');

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Step index:
 *  0 → Welcome slides
 *  1 → Name
 *  2 → Gender
 *  3 → Training level
 *  4 → Goal
 *  5 → Measurements (optional)
 *  6 → Routine preview
 */
const CONTENT_STEPS = 5; // steps 1–5 shown in progress bar

const WELCOME_SLIDES: Array<{
  id: string;
  title: string;
  subtitle: string;
  icon: IoniconName;
  gradientColors: [string, string];
  accentColor: string;
}> = [
  {
    id: '1',
    title: 'TRACK EVERY REP',
    subtitle: 'Log your sets, reps, and RPE with precision. Let FitForge crunch the numbers.',
    icon: 'analytics-outline',
    gradientColors: [`${Colors.primary}30`, `${Colors.primary}08`],
    accentColor: Colors.primary,
  },
  {
    id: '2',
    title: 'AI COACHING',
    subtitle: 'Get real-time feedback on your performance and fatigue. Train smarter, not harder.',
    icon: 'sparkles-outline',
    gradientColors: [`${Colors.secondaryBright}30`, `${Colors.secondaryBright}08`],
    accentColor: Colors.secondaryBright,
  },
  {
    id: '3',
    title: 'SMASH YOUR PRS',
    subtitle: 'Track your body metrics and volume. Watch your strength skyrocket over time.',
    icon: 'trophy-outline',
    gradientColors: [`${Colors.pr}30`, `${Colors.pr}08`],
    accentColor: Colors.pr,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function UnifiedOnboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Step state
  const [step, setStep] = useState(0);

  // ── Welcome slides
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  // ── Profile fields
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'in'>('cm');
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isWeightFocused, setIsWeightFocused] = useState(false);
  const [isHeightFocused, setIsHeightFocused] = useState(false);

  // ── Progress animation
  const progressAnim = useRef(new Animated.Value(1)).current;

  // ── Stores
  const { user, updateProfile, isLoading: authLoading } = useAuthStore();
  const {
    gender, trainingLevel, mainGoal,
    generatedProgram, isLoading: routineLoading,
    setGender, setTrainingLevel, setMainGoal, generateRoutine,
  } = useOnboardingStore();

  // Seed name from already-registered user
  useEffect(() => {
    const dn = user?.displayName;
    if (dn && dn !== 'User') setName(dn);
  }, []);

  // Animate progress bar whenever step 1–5 changes
  useEffect(() => {
    if (step >= 1 && step <= CONTENT_STEPS) {
      Animated.timing(progressAnim, {
        toValue: step,
        duration: 350,
        useNativeDriver: false,
      }).start();
    }
  }, [step]);

  // ── Navigation helpers
  const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    setWelcomeIndex(viewableItems[0]?.index ?? 0);
  }).current;
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const currentSlide = WELCOME_SLIDES[welcomeIndex];

  const advanceWelcome = () => {
    if (welcomeIndex < WELCOME_SLIDES.length - 1) {
      slidesRef.current?.scrollToIndex({ index: welcomeIndex + 1 });
    } else {
      setStep(1);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      setStep(0);
    } else if (step >= 2 && step <= CONTENT_STEPS) {
      setStep(step - 1);
    } else if (step === 6) {
      // Clear generated program so user can re-generate after editing
      useOnboardingStore.setState({ generatedProgram: null });
      setStep(CONTENT_STEPS); // back to measurements
    }
  };

  // ── Step handlers
  const handleGenderSelect = (g: Gender) => {
    setGender(g);
    setStep(3);
  };

  const handleLevelSelect = (l: TrainingLevel) => {
    setTrainingLevel(l);
    setStep(4);
  };

  const handleGoalSelect = (g: UserGoal) => {
    setMainGoal(g);
    setStep(5); // advance to measurements
  };

  const handleGoalSkip = () => {
    setStep(5); // skip goal → measurements
  };

  const handleGenerateRoutine = async () => {
    try {
      await generateRoutine();
      setStep(6);
    } catch {
      // routineLoading state handles error display via store.error
    }
  };

  const handleConfirm = async () => {
    try {
      await updateProfile({
        display_name: name,
        gender,
        trainingLevel: trainingLevel ?? undefined,
        mainGoal: mainGoal ?? undefined,
        weightUnit,
        heightUnit,
        ...(weight ? { weightKg: parseFloat(weight) } : {}),
        ...(height ? { heightCm: parseFloat(height) } : {}),
        has_completed_onboarding: true,
      });
      // Refresh templates so the AI-generated program is visible immediately
      useWorkoutStore.getState().fetchTemplates();
      router.replace('/(tabs)');
    } catch {
      // error handled by auth store
    }
  };

  // ── Derived
  const isLoading = authLoading || routineLoading;
  const progressWidth = progressAnim.interpolate({
    inputRange: [1, CONTENT_STEPS],
    outputRange: ['20%', '100%'],
    extrapolate: 'clamp',
  });

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Welcome Slides (step 0)
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0A1F14', Colors.background]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.55 }}
        />

        <FlatList
          data={WELCOME_SLIDES}
          ref={slidesRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          renderItem={({ item, index }) => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: 'clamp',
            });
            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.88, 1, 0.88],
              extrapolate: 'clamp',
            });
            return (
              <View style={[styles.slide, { width }]}>
                <Animated.View style={[styles.slideInner, { opacity, transform: [{ scale }] }]}>
                  {/* Icon */}
                  <View style={styles.iconWrapper}>
                    <LinearGradient
                      colors={item.gradientColors}
                      style={StyleSheet.absoluteFill}
                      borderRadius={90}
                    />
                    <View style={[styles.iconRing, { borderColor: `${item.accentColor}30` }]}>
                      <View style={[styles.iconCore, { backgroundColor: `${item.accentColor}18` }]}>
                        <Ionicons name={item.icon} size={52} color={item.accentColor} />
                      </View>
                    </View>
                  </View>

                  {/* Text */}
                  <Text style={[styles.welcomeTitle, { color: item.accentColor }]}>
                    {item.title}
                  </Text>
                  <Text style={styles.welcomeSubtitle}>{item.subtitle}</Text>
                </Animated.View>
              </View>
            );
          }}
        />

        {/* Footer */}
        <View style={[styles.welcomeFooter, { paddingBottom: insets.bottom + 24 }]}>
          {/* Animated dots */}
          <View style={styles.paginator}>
            {WELCOME_SLIDES.map((slide, i) => {
              const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
              const dotWidth = scrollX.interpolate({
                inputRange, outputRange: [6, 28, 6], extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp',
              });
              const bgColor = scrollX.interpolate({
                inputRange,
                outputRange: [Colors.border, slide.accentColor, Colors.border],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  key={i}
                  style={[styles.dot, { width: dotWidth, opacity, backgroundColor: bgColor }]}
                />
              );
            })}
          </View>

          {/* CTA */}
          <Pressable
            onPress={advanceWelcome}
            accessibilityRole="button"
            accessibilityLabel={welcomeIndex === WELCOME_SLIDES.length - 1 ? "Comenzar" : "Siguiente"}
          >
            <LinearGradient
              colors={[currentSlide.accentColor, `${currentSlide.accentColor}BB`]}
              style={styles.ctaBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.ctaBtnText}>
                {welcomeIndex === WELCOME_SLIDES.length - 1 ? "GET STARTED" : 'NEXT'}
              </Text>
              <Ionicons
                name={welcomeIndex === WELCOME_SLIDES.length - 1 ? 'rocket-outline' : 'arrow-forward'}
                size={18}
                color="#FFF"
              />
            </LinearGradient>
          </Pressable>

          {welcomeIndex < WELCOME_SLIDES.length - 1 && (
            <Pressable
              onPress={() => setStep(1)}
              style={styles.skipBtn}
              accessibilityRole="button"
              accessibilityLabel="Saltar introducción"
            >
              <Text style={styles.skipText}>Skip intro</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Routine Preview (step 6)
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 6) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
        {/* Header */}
        <View style={styles.previewHeader}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
          </Pressable>
          <View style={styles.previewHeaderCenter}>
            <Text style={styles.previewHeaderTitle}>YOUR PROGRAM</Text>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles-outline" size={11} color={Colors.secondaryBright} />
              <Text style={styles.aiBadgeText}>AI GENERATED</Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {generatedProgram ? (
          <>
            <RoutinePreview
              program={generatedProgram}
              isLoading={isLoading}
              onConfirm={handleConfirm}
              onBack={handleBack}
            />
            <View style={[styles.previewFooter, { paddingHorizontal: 24, paddingBottom: insets.bottom + 12 }]}>
              <Pressable onPress={handleConfirm} disabled={isLoading}>
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryBright]}
                  style={styles.confirmBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.confirmBtnText}>START TRAINING</Text>
                      <Ionicons name="barbell-outline" size={18} color="#FFF" />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.generatingContainer}>
            <View style={styles.generatingIconWrap}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
            <Text style={styles.generatingTitle}>Building your program</Text>
            <Text style={styles.generatingText}>
              Your AI coach is designing your personalized routine...
            </Text>
          </View>
        )}
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Form Steps 1–5
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#0A1F14', Colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      {/* ── Header ── */}
      <View style={[styles.formHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
          </Pressable>

          {/* Segmented progress */}
          <View style={styles.segmentRow}>
            {Array.from({ length: CONTENT_STEPS }).map((_, i) => (
              <View key={i} style={styles.segmentTrack}>
                <Animated.View
                  style={[
                    styles.segmentFill,
                    { width: step > i ? '100%' : step === i + 1 ? '60%' : '0%' },
                  ]}
                />
              </View>
            ))}
          </View>

          <Text style={styles.stepBadge}>
            {step}
            <Text style={styles.stepBadgeOf}>/{CONTENT_STEPS}</Text>
          </Text>
        </View>
      </View>

      {/* ── Content ── */}
      <ScrollView
        contentContainerStyle={[
          styles.formContent,
          step === 1 && { paddingHorizontal: 24, paddingTop: 40 },
          step === 5 && { paddingHorizontal: 24, paddingTop: 40 },
        ]}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Name */}
        {step === 1 && (
          <View style={styles.centeredStep}>
            <View style={styles.stepIconCircle}>
              <LinearGradient
                colors={[`${Colors.primary}25`, 'transparent']}
                style={StyleSheet.absoluteFill}
                borderRadius={44}
              />
              <Ionicons name="person-outline" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepSubtitle}>
              We'll personalize your experience just for you.
            </Text>
            <TextInput
              style={[styles.nameInput, isNameFocused && styles.inputFocused]}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              onFocus={() => setIsNameFocused(true)}
              onBlur={() => setIsNameFocused(false)}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => { if (name.trim()) setStep(2); }}
              accessibilityLabel="Ingresa tu nombre"
            />
          </View>
        )}

        {/* Step 2: Gender */}
        {step === 2 && (
          <GenderSelector selected={gender} onSelect={handleGenderSelect} />
        )}

        {/* Step 3: Level */}
        {step === 3 && (
          <LevelSelector selected={trainingLevel} onSelect={handleLevelSelect} />
        )}

        {/* Step 4: Goal */}
        {step === 4 && (
          <GoalSelector
            selected={mainGoal}
            onSelect={handleGoalSelect}
            onSkip={handleGoalSkip}
          />
        )}

        {/* Step 5: Measurements */}
        {step === 5 && (
          <View style={styles.centeredStep}>
            <View style={[styles.stepIconCircle, styles.stepIconCyan]}>
              <LinearGradient
                colors={[`${Colors.accentCyan}25`, 'transparent']}
                style={StyleSheet.absoluteFill}
                borderRadius={44}
              />
              <Ionicons name="body-outline" size={36} color={Colors.accentCyan} />
            </View>
            <Text style={styles.stepTitle}>Your measurements</Text>
            <Text style={styles.stepSubtitle}>
              Optional — we'll use this to calculate volume and progress.
            </Text>

            {/* Unit toggle */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>UNIT SYSTEM</Text>
              <View style={styles.unitToggle}>
                <Pressable
                  style={[styles.unitBtn, weightUnit === 'kg' && styles.unitBtnActive]}
                  onPress={() => { setWeightUnit('kg'); setHeightUnit('cm'); }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: weightUnit === 'kg' }}
                >
                  <Ionicons
                    name="globe-outline" size={14}
                    color={weightUnit === 'kg' ? Colors.primary : Colors.textTertiary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.unitBtnText, weightUnit === 'kg' && styles.unitBtnTextActive]}>
                    METRIC
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.unitBtn, weightUnit === 'lbs' && styles.unitBtnActive]}
                  onPress={() => { setWeightUnit('lbs'); setHeightUnit('in'); }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: weightUnit === 'lbs' }}
                >
                  <Ionicons
                    name="flag-outline" size={14}
                    color={weightUnit === 'lbs' ? Colors.primary : Colors.textTertiary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.unitBtnText, weightUnit === 'lbs' && styles.unitBtnTextActive]}>
                    IMPERIAL
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Weight + Height */}
            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>WEIGHT ({weightUnit.toUpperCase()})</Text>
                <TextInput
                  style={[styles.measureInput, isWeightFocused && styles.inputFocused]}
                  placeholder="—"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={setWeight}
                  onFocus={() => setIsWeightFocused(true)}
                  onBlur={() => setIsWeightFocused(false)}
                  accessibilityLabel={`Peso en ${weightUnit}`}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>HEIGHT ({heightUnit.toUpperCase()})</Text>
                <TextInput
                  style={[styles.measureInput, isHeightFocused && styles.inputFocused]}
                  placeholder="—"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  value={height}
                  onChangeText={setHeight}
                  onFocus={() => setIsHeightFocused(true)}
                  onBlur={() => setIsHeightFocused(false)}
                  accessibilityLabel={`Altura en ${heightUnit}`}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Footer (steps 1 and 5 need explicit Continue) ── */}
      {(step === 1 || step === 5) && (
        <View style={[styles.formFooter, { paddingBottom: insets.bottom + 20 }]}>
          {step === 5 && (
            <Pressable
              onPress={handleGenerateRoutine}
              style={({ pressed }) => [styles.skipLink, pressed && { opacity: 0.5 }]}
              accessibilityRole="button"
              disabled={isLoading}
            >
              <Text style={styles.skipLinkText}>Skip measurements</Text>
            </Pressable>
          )}
          <Pressable
            onPress={step === 1 ? () => name.trim() && setStep(2) : handleGenerateRoutine}
            disabled={(step === 1 && !name.trim()) || isLoading}
          >
            <LinearGradient
              colors={
                (step === 1 && !name.trim()) || isLoading
                  ? [Colors.elevated, Colors.elevated]
                  : [Colors.primary, Colors.primaryBright]
              }
              style={styles.continueBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.textOnPrimary} />
              ) : (
                <>
                  <Text
                    style={[
                      styles.continueBtnText,
                      (step === 1 && !name.trim()) && styles.continueBtnTextDisabled,
                    ]}
                  >
                    {step === 5 ? 'GENERATE ROUTINE' : 'CONTINUE'}
                  </Text>
                  <Ionicons
                    name={step === 5 ? 'sparkles-outline' : 'arrow-forward'}
                    size={18}
                    color={(step === 1 && !name.trim()) || isLoading ? Colors.textTertiary : '#FFF'}
                  />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ─── Welcome ──────────────────────────────────────────────────────────────
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  slideInner: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconWrapper: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 44,
  },
  iconRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCore: {
    width: 124,
    height: 124,
    borderRadius: 62,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontFamily: 'BebasNeue',
    fontSize: 48,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
  },
  welcomeFooter: {
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  paginator: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    marginBottom: 16,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  ctaBtn: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  ctaBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    letterSpacing: 1.5,
    color: '#FFF',
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    color: Colors.textTertiary,
  },

  // ─── Form steps ───────────────────────────────────────────────────────────
  formHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },
  segmentTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.elevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  stepBadge: {
    fontFamily: 'BebasNeue',
    fontSize: 22,
    color: Colors.primary,
    letterSpacing: 1,
    minWidth: 40,
    textAlign: 'right',
  },
  stepBadgeOf: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: Colors.textTertiary,
  },
  formContent: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 16,
  },
  centeredStep: {
    alignItems: 'center',
  },
  stepIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${Colors.primary}12`,
    borderWidth: 1.5,
    borderColor: `${Colors.primary}25`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    overflow: 'hidden',
  },
  stepIconCyan: {
    backgroundColor: `${Colors.accentCyan}12`,
    borderColor: `${Colors.accentCyan}25`,
  },
  stepTitle: {
    fontFamily: 'BebasNeue',
    fontSize: 36,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  stepSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 36,
    maxWidth: 300,
  },
  nameInput: {
    width: '100%',
    height: 64,
    backgroundColor: Colors.elevated,
    borderRadius: 16,
    paddingHorizontal: 20,
    color: Colors.textPrimary,
    fontSize: 20,
    fontFamily: 'DMSans-Medium',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  inputFocused: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  fieldGroup: {
    width: '100%',
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.elevated,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  unitBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  unitBtnActive: {
    backgroundColor: `${Colors.primary}18`,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  unitBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    letterSpacing: 0.5,
    color: Colors.textTertiary,
  },
  unitBtnTextActive: {
    color: Colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 14,
    marginBottom: 8,
  },
  measureInput: {
    width: '100%',
    height: 60,
    backgroundColor: Colors.elevated,
    borderRadius: 14,
    paddingHorizontal: 16,
    color: Colors.textPrimary,
    fontSize: 22,
    fontFamily: 'BebasNeue',
    borderWidth: 1.5,
    borderColor: Colors.border,
    textAlign: 'center',
    letterSpacing: 1,
  },
  formFooter: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 8,
  },
  skipLink: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipLinkText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: Colors.textTertiary,
  },
  continueBtn: {
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  continueBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    letterSpacing: 1.5,
    color: '#FFF',
  },
  continueBtnTextDisabled: {
    color: Colors.textTertiary,
  },

  // ─── Routine preview ──────────────────────────────────────────────────────
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  previewHeaderCenter: {
    alignItems: 'center',
    gap: 4,
  },
  previewHeaderTitle: {
    fontFamily: 'BebasNeue',
    fontSize: 22,
    letterSpacing: 2,
    color: Colors.textPrimary,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.secondaryBright}15`,
    borderWidth: 1,
    borderColor: `${Colors.secondaryBright}30`,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aiBadgeText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 9,
    color: Colors.secondaryBright,
    letterSpacing: 1,
  },
  previewFooter: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  confirmBtn: {
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  confirmBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    letterSpacing: 1.5,
    color: '#FFF',
  },
  generatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  generatingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.primary}15`,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  generatingTitle: {
    fontFamily: 'BebasNeue',
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  generatingText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
