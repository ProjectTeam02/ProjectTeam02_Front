
import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
} from 'react-native';

import {
  COLORS,
  LAYOUT,
  TYPOGRAPHY,
} from '../../constants/theme';

const STATES = {
  default: [COLORS.surface, COLORS.line],
  selected: [COLORS.soft, COLORS.primary],
  correct: [COLORS.successBg, COLORS.success],
  wrong: [COLORS.dangerBg, COLORS.danger],
};

export default function LerenOption({
  number = 1,
  title = '선택지',
  state = 'default',
  onPress,
  disabled = false,
}) {
  const [backgroundColor, borderColor] =
    STATES[state] || STATES.default;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        selected: state === 'selected',
        disabled,
      }}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.option,
        { backgroundColor, borderColor },
      ]}
    >
      <Text style={styles.text}>
        {number}   {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    width: '100%',
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: LAYOUT.buttonRadius,
    justifyContent: 'center',
  },
  text: {
    ...TYPOGRAPHY.body,
    color: COLORS.ink,
    flexShrink: 1,
  },
});
