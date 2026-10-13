
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  COLORS,
  LAYOUT,
  TYPOGRAPHY,
} from '../../constants/theme';

import LerenInput from '../../components/common/LerenInput';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';

// 회원가입 화면 상태
const STATES = {
  EMPTY: 'empty',
  FILLED: 'filled',
  ERROR: 'error',
  PENDING: 'pending',
  SUCCESS: 'success',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupScreen({
  onSignup,
  onBack,
  onLogin,
  onChooseJob,
  previewState,
}) {
  // 개발 중 Figma 화면 상태 테스트
  const isPreview =
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    !!previewState;

  const initialState = isPreview
    ? previewState
    : STATES.EMPTY;

  const hasPreviewValues =
    isPreview && initialState !== STATES.EMPTY;

  // 입력값
  const [email, setEmail] = useState(
    hasPreviewValues ? 'pia-kr@example.com' : ''
  );

  const [password, setPassword] = useState(
    hasPreviewValues ? 'password123' : ''
  );

  const [confirmPassword, setConfirmPassword] = useState(
    hasPreviewValues
      ? initialState === STATES.ERROR
        ? 'different123'
        : 'password123'
      : ''
  );

  const [nickname, setNickname] = useState(
    hasPreviewValues ? 'pia' : ''
  );

  // 화면 및 요청 상태
  const [status, setStatus] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  // 오류 상태
  const [emailError, setEmailError] = useState(
    initialState === STATES.ERROR
      ? '이미 사용 중인 이메일이에요'
      : ''
  );

  const [nicknameError, setNicknameError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // 입력값 검증
  const emailValid = EMAIL_REGEX.test(email.trim());

  const emailFormatError =
    email.trim().length > 0 && !emailValid
      ? '이메일 형식을 확인해 주세요'
      : '';

  const passwordMismatch =
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  const isPending =
    submitting || status === STATES.PENDING;

  const isSuccess = status === STATES.SUCCESS;

  const canSubmit =
    emailValid &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    !passwordMismatch &&
    nickname.trim().length > 0 &&
    !emailError &&
    !nicknameError &&
    !isPending &&
    !isSuccess;

  // 오류 수정 시 기존 입력값 유지
  const clearSubmitError = () => {
    setSubmitError('');

    if (status === STATES.ERROR) {
      setStatus(STATES.EMPTY);
    }
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    setEmailError('');
    clearSubmitError();
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    clearSubmitError();
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    clearSubmitError();
  };

  const handleNicknameChange = (value) => {
    setNickname(value);
    setNicknameError('');
    clearSubmitError();
  };

  // 회원가입 API 요청
  const handleSignup = async () => {
    if (!canSubmit) return;

    if (typeof onSignup !== 'function') {
      setSubmitError(
        '회원가입 API가 아직 연결되지 않았습니다.'
      );
      return;
    }

    try {
      setSubmitting(true);
      setStatus(STATES.PENDING);
      setSubmitError('');

      const result = await onSignup({
        email: email.trim(),
        password,
        nickname: nickname.trim(),
      });

      // A resolved request is successful unless it explicitly reports failure.
      if (result === false || result?.success === false) {
        const error = new Error(
          result?.message || '계정을 만들지 못했어요.'
        );

        error.code = result?.code;
        throw error;
      }

      setStatus(STATES.SUCCESS);

    } catch (error) {
      setStatus(STATES.ERROR);

      const errorCode =
        error?.code ||
        error?.response?.data?.code;

      const httpStatus = error?.response?.status;

      if (
        errorCode === 'EMAIL_ALREADY_EXISTS' ||
        errorCode === 'DUPLICATE_EMAIL' ||
        httpStatus === 409
      ) {
        setEmailError('이미 사용 중인 이메일이에요');
      } else if (errorCode === 'DUPLICATE_NICKNAME') {
        setNicknameError('이미 사용 중인 닉네임이에요');
      } else {
        setSubmitError(
          error?.message ||
          '회원가입에 실패했어요. 다시 시도해 주세요.'
        );
      }

    } finally {
      setSubmitting(false);
    }
  };

  // 화면 이동
  const handleBack = () => {
    if (isPending) return;

    if (typeof onBack === 'function') {
      onBack();
    } else {
      Alert.alert('안내', '이전 화면 연결 예정입니다.');
    }
  };

  const handleLogin = () => {
    if (typeof onLogin === 'function') {
      onLogin();
    } else {
      Alert.alert('안내', '로그인 화면 연결 예정입니다.');
    }
  };

  const handleChooseJob = () => {
    if (typeof onChooseJob === 'function') {
      onChooseJob();
    } else {
      Alert.alert('안내', '직업 선택 화면 연결 예정입니다.');
    }
  };

  // 공통 헤더
  const renderHeader = (title) => (
    <View style={styles.header}>
      <Pressable
        onPress={handleBack}
        disabled={isPending}
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
        style={styles.backButton}
      >
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>

      <Text style={styles.headerTitle}>
        {title}
      </Text>
    </View>
  );

  // 11-05 회원가입 완료
  if (isSuccess) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom']}
      >
        {renderHeader('가입 완료')}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          <View style={styles.inner}>
            <LerenCard
              variant="success"
              title={`${nickname}님, 환영해요!`}
              description="LEREN에서 경제 모험을 시작해요."
            />

            <LerenCard
              variant="info"
              title="함께할 영웅을 선택해 주세요"
              description="검사·마법사·궁수 중 원하는 직업을 선택할 수 있어요."
            />

            <LerenButton
              title="직업 선택하기"
              onPress={handleChooseJob}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 11-04 회원가입 처리 중
  if (isPending) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom']}
      >
        {renderHeader('회원가입')}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          <View style={styles.inner}>
            <LerenCard
              variant="info"
              title="계정을 만들고 있어요"
              description="잠시만 기다려 주세요."
            />

            <LerenInput
              label="이메일"
              value={email}
              editable={false}
            />

            <LerenInput
              label="닉네임"
              value={nickname}
              editable={false}
            />

            <LerenButton
              title="계정 생성 중..."
              loading
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 11-01 입력 완료
  // 11-02 입력 전
  // 11-03 오류
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios' ? 'padding' : undefined
        }
      >
        {renderHeader('회원가입')}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>

            {/* 이메일 */}
            <LerenInput
              label="이메일"
              value={email}
              onChangeText={handleEmailChange}
              placeholder="이메일을 입력해 주세요"
              keyboardType="email-address"
              autoComplete="email"
              error={emailError || emailFormatError}
            />

            {/* 비밀번호 */}
            <LerenInput
              label="비밀번호"
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="비밀번호를 입력해 주세요"
              secure
              autoComplete="new-password"
            />

            {/* 비밀번호 확인 */}
            <LerenInput
              label="비밀번호 확인"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              placeholder="비밀번호를 다시 입력해 주세요"
              secure
              autoComplete="new-password"
              error={
                passwordMismatch
                  ? '비밀번호가 일치하지 않아요'
                  : ''
              }
            />

            {/* 닉네임 */}
            <LerenInput
              label="닉네임"
              value={nickname}
              onChangeText={handleNicknameChange}
              placeholder="닉네임을 입력해 주세요"
              error={nicknameError}
              hint={
                nicknameError
                  ? ''
                  : '모험에서 사용할 이름이에요'
              }
            />

            {/* 서버 오류 메시지 */}
            {!!submitError && (
              <Text
                style={styles.errorText}
                accessibilityLiveRegion="polite"
              >
                {submitError}
              </Text>
            )}

            {/* 회원가입 버튼 */}
            <LerenButton
              title="계정 만들기"
              onPress={handleSignup}
              disabled={!canSubmit}
            />

            {/* 로그인 이동 */}
            <LerenButton
              title="이미 가진 계정으로 로그인"
              variant="secondary"
              onPress={handleLogin}
            />

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  flex: {
    flex: 1,
  },

  header: {
    height: LAYOUT.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: COLORS.surface,
  },

  backButton: {
    width: 32,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  backIcon: {
    fontSize: 30,
    color: COLORS.ink,
  },

  headerTitle: {
    ...TYPOGRAPHY.heading,
    color: COLORS.ink,
  },

  scroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: 'center',
  },

  inner: {
    width: '100%',
    maxWidth: LAYOUT.contentMaxWidth,
    gap: 18,
  },

  errorText: {
    ...TYPOGRAPHY.small,
    color: COLORS.danger,
  },
});
