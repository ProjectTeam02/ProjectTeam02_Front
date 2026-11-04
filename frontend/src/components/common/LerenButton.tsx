/**
 * 공통 실행 버튼. 기본/보조 스타일과 비활성·로딩 표시를 제공하고, 실제 작업은 onPress로 전달받습니다.
 */
import React from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
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

// 부모 화면에서 전달할 문구·클릭 처리·표시 상태의 타입입니다.
export interface LerenButtonProps {
  title: string;
  onPress?: PressableProps['onPress'];
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function LerenButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: LerenButtonProps) {
  // 요청 중에도 클릭을 막아 화면에서 중복 실행을 줄입니다. 서버 중복 방지는 별도 필요합니다.
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

// 이 화면/컴포넌트의 배치·색상·크기 정의. 최종 UI는 디자인 기준과 기기에서 확인합니다.
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
