/**
 * 화면 이동 등을 요청하는 카드형 버튼. 목적지와 실제 이동 처리는 부모의 onPress에서 결정합니다.
 */
import React from 'react';
import type { PressableProps } from 'react-native';
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

// 화면 경로를 직접 알지 않고 클릭 이벤트만 전달하는 재사용 UI입니다.
export interface LerenLinkCardProps {
  title: string;
  subtitle?: string;
  onPress?: PressableProps['onPress'];
  disabled?: boolean;
}

export default function LerenLinkCard({
  title,
  subtitle,
  onPress,
  disabled = false,
}: LerenLinkCardProps) {
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

// 이 화면/컴포넌트의 배치·색상·크기 정의. 최종 UI는 디자인 기준과 기기에서 확인합니다.
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
