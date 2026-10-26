/**
 * 복습 체크 UI. 선택값은 부모가 관리하고, 이 컴포넌트는 변경할 값을 onChange로 알립니다. 실제 복습 저장은 하지 않습니다.
 */
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

// checked가 실제 표시 기준이며, onChange는 다음 선택값을 부모에 전달합니다.
export interface LerenCheckProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  title?: string;
  description?: string;
  disabled?: boolean;
}

export default function LerenCheck({
  checked = false,
  onChange,
  title = '헷갈리는 문항 체크',
  description,
  disabled = false,
}: LerenCheckProps = {}) {
  // 호출한 화면의 설명이 없으면 체크 상태에 맞는 기본 문구를 사용합니다.
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

// 이 화면/컴포넌트의 배치·색상·크기 정의. 최종 UI는 디자인 기준과 기기에서 확인합니다.
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
