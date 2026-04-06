// src/components/PrimaryActionButton.tsx
// Port of primary_action_button.dart — Design System "Carbon Forge"
// Reference: lib/core/widgets/primary_action_button.dart

import { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
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
      style={[styles.button, { minHeight }, variant === 'secondary' && styles.buttonSecondary, variant === 'outline' && styles.buttonOutline, isLoading && styles.buttonDisabled]}
      onPress={isLoading ? undefined : onPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.textPrimary : Colors.textOnPrimary} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.label, variant === 'outline' && styles.labelOutline]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.primaryGlow,
  },
  buttonSecondary: {
    backgroundColor: Colors.secondary,
    ...Shadows.violetGlow,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
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
