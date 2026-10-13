
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

export default function LerenCheck({
  checked = false,
  onChange,
  title = '헷갈리는 문항 체크',
  description,
  disabled = false,
}) {
  const subtitle = description || (
    checked
      ? '복습에 저장했어요'
      : '정답이어도 복습에 담을 수 있어요'
  );

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      onPress={() => onChange?.(!checked)}
      disabled={disabled}
      style={[
        styles.container,
        checked && styles.selected,
        disabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.checkbox,
          checked && styles.checkedBox,
        ]}
      >
        {checked && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </View>

      <View style={styles.textArea}>
        <Text style={styles.title}>
          {title}
        </Text>

        <Text style={styles.description}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: LAYOUT.buttonRadius,
    backgroundColor: COLORS.surface,
  },
  selected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.soft,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: COLORS.muted,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: COLORS.surface,
  },
  textArea: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...TYPOGRAPHY.label,
    color: COLORS.ink,
  },
  description: {
    ...TYPOGRAPHY.micro,
    color: COLORS.muted,
  },
  disabled: {
    opacity: 0.5,
  },
});
