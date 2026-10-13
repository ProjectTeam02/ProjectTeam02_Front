
import React from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
} from 'react-native';

import {
  COLORS,
  LAYOUT,
  TYPOGRAPHY,
} from '../../constants/theme';

export default function LerenLinkCard({
  title,
  subtitle,
  onPress,
  disabled = false,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.card,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          {title}
        </Text>

        {!!subtitle && (
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </View>

      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 69,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: LAYOUT.buttonRadius,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    ...TYPOGRAPHY.label,
    color: COLORS.ink,
  },
  subtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
  },
  arrow: {
    fontSize: 22,
    color: COLORS.muted,
  },
  disabled: {
    opacity: 0.5,
  },
});
