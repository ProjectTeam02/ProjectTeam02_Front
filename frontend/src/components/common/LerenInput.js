
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';

import {
  COLORS,
  LAYOUT,
  TYPOGRAPHY,
} from '../../constants/theme';

// 로그인·회원가입 공통 입력 컴포넌트
export default function LerenInput({
  label = '이메일',
  value = '',
  onChangeText,
  placeholder = '입력해 주세요',
  hint = '',
  error = '',
  state = 'default',
  secure = false,
  keyboardType = 'default',
  editable = true,
  autoComplete,
}) {
  // 오류 상태 판단
  const isError = state === 'error' || !!error;

  // 오류 메시지가 있으면 안내 문구보다 우선 표시
  const message = error || hint;

  return (
    <View style={styles.container}>

      {/* 입력 항목 제목 */}
      <Text style={styles.label}>
        {label}
      </Text>

      {/* 텍스트 입력창 */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        editable={editable}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={label}
        accessibilityState={{
          disabled: !editable,
        }}
        style={[
          styles.input,
          isError && styles.errorInput,
          !editable && styles.disabledInput,
        ]}
      />

      {/* 안내 문구 또는 오류 메시지 */}
      {!!message && (
        <Text
          style={[
            styles.hint,
            isError && styles.errorHint,
          ]}
          accessibilityLiveRegion={
            isError ? 'polite' : 'none'
          }
        >
          {message}
        </Text>
      )}
    </View>
  );
}

// 공통 입력창 스타일
const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 6,
  },

  label: {
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
  },

  input: {
    width: '100%',
    height: LAYOUT.inputHeight,
    paddingHorizontal: LAYOUT.pad,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: LAYOUT.buttonRadius,
    backgroundColor: COLORS.surface,
    ...TYPOGRAPHY.body,
    color: COLORS.ink,
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

  errorHint: {
    color: COLORS.danger,
  },
});
