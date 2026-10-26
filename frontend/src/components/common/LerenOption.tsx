/**
 * 퀴즈 선택지의 표시 컴포넌트. 선택/정답/오답 상태를 받아 그리며, 채점과 선택 상태 관리는 부모가 담당합니다.
 */
import React from 'react';
import type { PressableProps } from 'react-native';
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

// 각 상태의 [배경색, 테두리색]. 정답 여부는 이 컴포넌트에서 계산하지 않습니다.
const STATES = {
  default: [COLORS.surface, COLORS.line],
  selected: [COLORS.soft, COLORS.primary],
  correct: [COLORS.successBg, COLORS.success],
  wrong: [COLORS.dangerBg, COLORS.danger],
};

export interface LerenOptionProps {
  number?: number;
  title?: string;
  state?: keyof typeof STATES;
  onPress?: PressableProps['onPress'];
  disabled?: boolean;
}

export default function LerenOption({
  number = 1,
  title = '선택지',
  state = 'default',
  onPress,
  disabled = false,
}: LerenOptionProps = {}) {
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

// 이 화면/컴포넌트의 배치·색상·크기 정의. 최종 UI는 디자인 기준과 기기에서 확인합니다.
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
