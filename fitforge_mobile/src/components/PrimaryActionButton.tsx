// src/components/PrimaryActionButton.tsx
// Port of primary_action_button.dart — Design System "Carbon Forge"
// Reference: lib/core/widgets/primary_action_button.dart

import { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows } from '../theme/colors';
import { Typography } from '../theme/typography';

interface PrimaryActionButtonProps {
  label: string;
  onPress?: () => void;
  icon?: ReactNode;
  isLoading?: boolean;
  minHeight?: number;
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function PrimaryActionButton({
  label,
  onPress,
  icon,
  isLoading = false,
  minHeight = 52,
  variant = 'primary',
}: PrimaryActionButtonProps) {
  return (
    <Pressable
      style={[styles.pressable, { minHeight }, isLoading && styles.buttonDisabled]}
      onPress={isLoading ? undefined : onPress}
      disabled={isLoading}
    >
      {({ pressed }) => {
        if (variant === 'primary') {
          return (
            <LinearGradient
              colors={pressed ? [Colors.primaryDark, Colors.primary] : [Colors.primary, Colors.primaryBright]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gradient, { minHeight }]}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.textOnPrimary} size="small" />
              ) : (
                <View style={styles.content}>
                  {icon && <View style={styles.iconWrap}>{icon}</View>}
                  <Text style={styles.label}>{label}</Text>
                </View>
              )}
            </LinearGradient>
          );
        }
        return (
          <View
            style={[
              styles.button,
              { minHeight },
              variant === 'secondary' && styles.buttonSecondary,
              variant === 'outline' && styles.buttonOutline,
              pressed && styles.buttonPressed,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color={variant === 'outline' ? Colors.textPrimary : Colors.textOnPrimary} size="small" />
            ) : (
              <View style={styles.content}>
                {icon && <View style={styles.iconWrap}>{icon}</View>}
                <Text style={[styles.label, variant === 'outline' && styles.labelOutline]}>{label}</Text>
              </View>
            )}
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadows.primaryGlow,
  },
  gradient: {
    width: '100%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: Colors.secondary,
    ...Shadows.violetGlow,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginRight: 8,
  },
  label: {
    ...Typography.button,
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    letterSpacing: 1.5,
  },
  labelOutline: {
    color: Colors.textPrimary,
  },
});
