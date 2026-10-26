/**
 * 공통 안내 카드. 제목·설명·하위 UI를 표시하며 variant에 따라 안내/성공/실패 등의 배경색을 선택합니다.
 */
import React from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
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

// 카드 의미에 따른 색상 매핑. 동일 UI를 여러 상태에서 재사용합니다.
const VARIANTS = {
  default: COLORS.surface,
  info: COLORS.soft,
  success: COLORS.successBg,
  error: COLORS.dangerBg,
  reward: COLORS.goldBg,
};

export type CardVariant = keyof typeof VARIANTS;

// children에는 제목·설명 아래에 배치할 추가 UI를 전달합니다.
export interface LerenCardProps {
  title?: string;
  description?: string;
  variant?: CardVariant;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function LerenCard({
  title,
  description,
  variant = 'default',
  children,
  style,
}: LerenCardProps) {
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

// 이 화면/컴포넌트의 배치·색상·크기 정의. 최종 UI는 디자인 기준과 기기에서 확인합니다.
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
