/**
 * 탐험 지도에 표시할 지역 카드. 상태와 진행 문구를 표시하고 클릭을 전달합니다. 잠금 판정은 지도 화면에서 담당합니다.
 */
import React from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

const C = {
  primary: '#1D3F91',
  ink: '#182842',
  muted: '#68778E',
  line: '#DCE5F0',
  success: '#248565',
  successBg: '#E8F6EF',
};

// 지도 화면이 계산해 전달하는 UI 상태이며 서버 진행도 Enum과는 별도입니다.
export type StageStatus = 'locked' | 'complete' | 'available' | 'active';

export interface StageCardProps {
  number: number;
  title: string;
  status?: StageStatus;
  progress?: string | null;
  requirement?: string;
  onPress?: PressableProps['onPress'];
  style?: StyleProp<ViewStyle>;
}

export default function StageCard({
  number,
  title,
  status = 'locked',
  progress,
  requirement,
  onPress,
  style,
}: StageCardProps) {
  const isComplete = status === 'complete';
  const isAvailable = status === 'available';
  const isActive = status === 'active';

  // 잠금 사유 또는 완료/진행 문구를 하나의 카드 설명으로 정리합니다.
  let description = `잠김 · ${requirement || '이전 지역 완료 필요'}`;

  if (isComplete) {
    description = '✓ 완료';
  } else if (isAvailable) {
    description = '학습 가능';
  } else if (isActive) {
    description = progress || '시작하기';
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`STAGE ${number}, ${title.replace(/\n/g, ' ')}, ${description}`}
      style={[
        styles.card,
        (isAvailable || isActive) && styles.activeCard,
        isComplete && styles.completeCard,
        style,
      ]}
    >
      <Text
        style={[
          styles.stageNumber,
          (isActive || isAvailable) && styles.primaryText,
        ]}
      >
        STAGE {number}
      </Text>

      <Text style={styles.title}>{title}</Text>

      <Text
        style={[
          styles.description,
          (isActive || isAvailable) && styles.primaryText,
          isComplete && styles.completeText,
        ]}
      >
        {description}
      </Text>
    </Pressable>
  );
}

// 이 화면/컴포넌트의 배치·색상·크기 정의. 최종 UI는 디자인 기준과 기기에서 확인합니다.
const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 98,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    gap: 7,
  },
  activeCard: {
    borderColor: C.primary,
  },
  completeCard: {
    borderColor: C.primary,
    backgroundColor: C.successBg,
  },
  stageNumber: {
    fontSize: 10,
    fontWeight: '600',
    color: C.muted,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: C.ink,
  },
  description: {
    fontSize: 10,
    lineHeight: 15,
    color: C.muted,
  },
  primaryText: {
    color: C.primary,
  },
  completeText: {
    color: C.success,
  },
});
