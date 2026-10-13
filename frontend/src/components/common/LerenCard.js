
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import {
  COLORS,
  LAYOUT,
  TYPOGRAPHY,
} from '../../constants/theme';

const VARIANTS = {
  default: COLORS.surface,
  info: COLORS.soft,
  success: COLORS.successBg,
  error: COLORS.dangerBg,
  reward: COLORS.goldBg,
};

export default function LerenCard({
  title,
  description,
  variant = 'default',
  children,
  style,
}) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor:
            VARIANTS[variant] || COLORS.surface,
        },
        style,
      ]}
    >
      {!!title && (
        <Text style={styles.title}>
          {title}
        </Text>
      )}

      {!!description && (
        <Text style={styles.description}>
          {description}
        </Text>
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: LAYOUT.pad,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: LAYOUT.radius,
    gap: 8,
  },
  title: {
    ...TYPOGRAPHY.label,
    color: COLORS.ink,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.muted,
  },
});
