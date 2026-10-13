import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

const C = {
  primary: '#1D3F91',
  ink: '#182842',
  muted: '#68778E',
  line: '#DCE5F0',
  success: '#248565',
  successBg: '#E8F6EF',
};

export default function StageCard({
  number,
  title,
  status = 'locked',
  progress,
  requirement,
  onPress,
  style,
}) {
  const isComplete = status === 'complete';
  const isAvailable = status === 'available';
  const isActive = status === 'active';

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