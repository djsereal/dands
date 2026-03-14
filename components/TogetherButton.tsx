import React from 'react';
import { Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { COLORS } from '@/constants/Together';

interface TogetherButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  color?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function TogetherButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  color = COLORS.primary,
  style,
  textStyle,
  icon,
}: TogetherButtonProps) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';

  const bgColor = isPrimary ? color : isSecondary ? COLORS.accent : 'transparent';
  const borderColor = isOutline ? color : 'transparent';
  const textColor = isPrimary || isSecondary ? '#FFFFFF' : color;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: bgColor,
          borderWidth: isOutline ? 2 : 0,
          borderColor,
          borderRadius: 16,
          paddingVertical: 14,
          paddingHorizontal: 24,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          opacity: disabled ? 0.5 : 1,
          boxShadow: isPrimary ? `0 4px 16px ${color}40` : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[{ color: textColor, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}
