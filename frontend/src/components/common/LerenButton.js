
import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import {
  COLORS,
  LAYOUT,
  TYPOGRAPHY,
} from '../../constants/theme';

export default function LerenButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}) {
  const isDisabled = disabled || loading;
  const secondary = variant === 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        secondary && styles.secondary,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            secondary && !disabled
              ? COLORS.primary
              : COLORS.muted
          }
        />
      ) : (
        <Text
          style={[
            styles.text,
            secondary && styles.secondaryText,
            isDisabled && styles.disabledText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: LAYOUT.buttonHeight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: LAYOUT.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...TYPOGRAPHY.label,
    color: COLORS.surface,
    textAlign: 'center',
  },
  secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryText: {
    color: COLORS.primary,
  },
  disabled: {
    backgroundColor: COLORS.disabled,
    borderWidth: 0,
  },
  disabledText: {
    color: COLORS.muted,
  },
});
