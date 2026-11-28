/**
 * 로그인·회원가입에서 재사용하는 입력창. label, 안내/오류 문구, 입력 방식과 비활성 표시를 담당합니다.
 */
import React, { useState } from 'react';
import type { TextInputProps } from 'react-native';
import {
  View,
  Pressable,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';

import {
  COLORS,
  LAYOUT,
  TYPOGRAPHY,
} from '../../constants/theme';
import LerenIcon from './LerenIcon';

// 로그인·회원가입 공통 입력 컴포넌트
export interface LerenInputProps {
  label?: string;
  value?: string;
  onChangeText?: TextInputProps['onChangeText'];
  placeholder?: string;
  hint?: string;
  error?: string;
  state?: 'default' | 'error';
  secure?: boolean;
  revealPassword?: boolean;
  variant?: 'default' | 'auth';
  keyboardType?: TextInputProps['keyboardType'];
  editable?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
}

export default function LerenInput({
  label = '이메일',
  value = '',
  onChangeText,
  placeholder = '입력해 주세요',
  hint = '',
  error = '',
  state = 'default',
  secure = false,
  revealPassword = false,
  variant = 'default',
  keyboardType = 'default',
  editable = true,
  autoComplete,
}: LerenInputProps = {}) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isError = state === 'error' || !!error;
  const isAuth = variant === 'auth';
  const canReveal = secure && revealPassword && editable;
  const visiblePassword = canReveal && passwordVisible;
  const message = error || hint;

  return (
    <View style={[styles.container, isAuth && styles.authContainer]}>
      {!!label && <Text style={[styles.label, isAuth && styles.authLabel]}>{label}</Text>}

      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isAuth ? '#4C5F7D' : COLORS.muted}
          secureTextEntry={secure && !visiblePassword}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          editable={editable}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label || placeholder}
          accessibilityHint={isAuth && message ? message : undefined}
          accessibilityState={{ disabled: !editable }}
          style={[
            styles.input,
            isAuth && styles.authInput,
            canReveal && styles.inputWithToggle,
            isError && styles.errorInput,
            !editable && !isAuth && styles.disabledInput,
          ]}
        />
        {canReveal && (
          <Pressable accessibilityRole="button"
            accessibilityLabel={`${label || '비밀번호'} ${visiblePassword ? '숨기기' : '보기'}`}
            onPress={() => setPasswordVisible(visible => !visible)} style={styles.visibilityButton}>
            <LerenIcon name={visiblePassword ? 'EyeOff' : 'Eye'} size={22} color="#4C5F7D" />
          </Pressable>
        )}
      </View>

      {/* 필드 오류가 있을 때는 안내 문구 대신 해당 입력을 수정할 방법을 표시합니다. */}
      {!!message && (
        <Text style={[styles.hint, isAuth && styles.authHint, isError && styles.errorHint, isAuth && isError && styles.authErrorHint]}
          accessibilityLiveRegion={isError ? 'polite' : 'none'}>
          {message}
        </Text>
      )}
    </View>
  );
}

// 공통 입력창 스타일
// 이 화면/컴포넌트의 배치·색상·크기 정의. 최종 UI는 디자인 기준과 기기에서 확인합니다.
const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 6,
  },

  authContainer: { gap: 4 },
  inputRow: { width: '100%', justifyContent: 'center' },
  authLabel: { ...TYPOGRAPHY.label, fontSize: 14, lineHeight: 20, color: COLORS.ink },
  label: {
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
  },

  input: {
    width: '100%',
    minHeight: LAYOUT.inputHeight,
    paddingVertical: 12,
    textAlignVertical: 'center',
    paddingHorizontal: LAYOUT.pad,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: LAYOUT.buttonRadius,
    backgroundColor: COLORS.surface,
    ...TYPOGRAPHY.body,
    color: COLORS.ink,
  },

  authInput: {
    fontSize: 15, lineHeight: 22,
  },
  inputWithToggle: { paddingRight: 52 },
  // 입력창 안에서 44pt 영역으로 표시 상태만 바꾸고, 입력값은 그대로 둡니다.
  visibilityButton: {
    position: 'absolute', right: 4, width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center',
  },

  // 입력 오류 발생 시 테두리 변경
  errorInput: {
    borderColor: COLORS.danger,
  },

  // 처리 중 입력 비활성화
  disabledInput: {
    backgroundColor: COLORS.disabled,
  },

  hint: {
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
  },

  authHint: { ...TYPOGRAPHY.micro, color: '#4C5F7D', fontWeight: '400' },
  authErrorHint: { color: '#9C3047' },
  errorHint: {
    color: COLORS.danger,
  },
});
