import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Shadows } from '../../src/theme/colors';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const { user, updateProfile } = useAuthStore();
  const insets = useSafeAreaInsets();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.displayName || '');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'in'>('cm');

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleFinish();
  };

  const handleFinish = async () => {
    await updateProfile({
      display_name: name,
      weightUnit,
      heightUnit,
      weightKg: weight ? parseFloat(weight) : undefined,
      heightCm: height ? parseFloat(height) : undefined,
      has_completed_onboarding: true,
    });
  };

  const progress = (step / 3) * 100;

  return (
    <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#0D2016', Colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.stepText}>STEP {step} OF 3</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        {step === 1 && (
            <View style={styles.stepContainer}>
                <View style={styles.iconCircle}>
                    <Ionicons name="person" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.title}>What's your name?</Text>
                <Text style={styles.subtitle}>We'll use this to personalize your experience.</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor={Colors.textTertiary}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                />
            </View>
        )}

        {step === 2 && (
            <View style={styles.stepContainer}>
                 <View style={styles.iconCircle}>
                    <Ionicons name="scale" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.title}>Your measurements</Text>
                <Text style={styles.subtitle}>This helps us calculate your volume and progress accurately.</Text>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>WHICH UNITS DO YOU PREFER?</Text>
                    <View style={styles.unitToggle}>
                        <Pressable 
                            style={[styles.unitBtn, weightUnit === 'kg' && styles.unitBtnActive]}
                            onPress={() => { setWeightUnit('kg'); setHeightUnit('cm'); }}
                        >
                            <Text style={[styles.unitBtnText, weightUnit === 'kg' && styles.unitBtnTextActive]}>METRIC (KG/CM)</Text>
                        </Pressable>
                        <Pressable 
                            style={[styles.unitBtn, weightUnit === 'lbs' && styles.unitBtnActive]}
                            onPress={() => { setWeightUnit('lbs'); setHeightUnit('in'); }}
                        >
                            <Text style={[styles.unitBtnText, weightUnit === 'lbs' && styles.unitBtnTextActive]}>IMPERIAL (LBS/IN)</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.inputRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>WEIGHT ({weightUnit.toUpperCase()})</Text>
                        <TextInput
                            style={styles.inputSmall}
                            placeholder="0.0"
                            placeholderTextColor={Colors.textTertiary}
                            keyboardType="decimal-pad"
                            value={weight}
                            onChangeText={setWeight}
                        />
                    </View>
                    <View style={{ width: 20 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>HEIGHT ({heightUnit.toUpperCase()})</Text>
                        <TextInput
                            style={styles.inputSmall}
                            placeholder="0.0"
                            placeholderTextColor={Colors.textTertiary}
                            keyboardType="decimal-pad"
                            value={height}
                            onChangeText={setHeight}
                        />
                    </View>
                </View>
            </View>
        )}

        {step === 3 && (
            <View style={styles.stepContainer}>
                <View style={styles.iconCircle}>
                    <Ionicons name="rocket" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.title}>All set!</Text>
                <Text style={styles.subtitle}>You're ready to forge your best self. Let's get started.</Text>
                
                <View style={styles.summaryBox}>
                    <View style={styles.summaryRow}>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                        <Text style={styles.summaryText}>Profile personalized</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                        <Text style={styles.summaryText}>Units configured</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                        <Text style={styles.summaryText}>Goal tracking enabled</Text>
                    </View>
                </View>
            </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {step > 1 && (
            <Pressable style={styles.backBtn} onPress={() => setStep(step - 1)}>
                <Text style={styles.backBtnText}>BACK</Text>
            </Pressable>
        )}
        <Pressable 
            style={styles.nextBtn} 
            onPress={handleNext}
            disabled={step === 1 && !name.trim()}
        >
            <LinearGradient
                colors={[Colors.primary, Colors.primaryBright]}
                style={[styles.nextBtnGradient, step === 1 && !name.trim() && { opacity: 0.5 }]}
            >
                <Text style={styles.nextBtnText}>{step === 3 ? 'FINISH' : 'CONTINUE'}</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.elevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  stepText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 1.5,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  stepContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${Colors.primary}33`,
  },
  title: {
    fontFamily: 'ArchivoBlack',
    fontSize: 28,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 64,
    backgroundColor: Colors.elevated,
    borderRadius: 16,
    paddingHorizontal: 20,
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'DMSans-Medium',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 12,
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
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  unitBtnActive: {
    backgroundColor: `${Colors.primary}20`,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  unitBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    color: Colors.textTertiary,
  },
  unitBtnTextActive: {
    color: Colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    width: '100%',
  },
  inputSmall: {
    width: '100%',
    height: 56,
    backgroundColor: Colors.elevated,
    borderRadius: 14,
    paddingHorizontal: 16,
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'BebasNeue',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: `${Colors.primary}05`,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  backBtn: {
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  nextBtn: {
    flex: 1,
    height: 58,
    borderRadius: 18,
    overflow: 'hidden',
    ...Shadows.primaryGlow,
  },
  nextBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: '#FFF',
    letterSpacing: 1,
  },
});
