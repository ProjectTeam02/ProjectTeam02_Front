/**
 * 로그인 테스트 UI와 입력·요청 상태 처리. 실제 인증 및 성공 후 이동은 외부 콜백으로 연결해야 합니다.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
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
  import type { CardVariant } from '../../components/common/LerenCard';
  import LerenLinkCard from '../../components/common/LerenLinkCard';
  

// 로그인 화면 상태 정의
const STATES = {
  EMPTY: 'empty',
  FILLED: 'filled',
  ERROR: 'error',
  RETURNING: 'returning',
  KAKAO_ERROR: 'kakaoError',
} as const;

export type LoginPreviewState = (typeof STATES)[keyof typeof STATES];

// 현재는 화면 콜백 계약입니다. 공개 로그인 API의 최종 요청/응답 DTO는 별도 확정합니다.
export interface LoginScreenProps {
  onLogin?: (email: string, password: string) => unknown;
  onKakaoLogin?: () => unknown;
  onSignup?: () => void;
  onResetPassword?: () => void;
  onBack?: () => void;
  returningUserName?: string;
  previewState?: LoginPreviewState;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({
  onLogin,
  onKakaoLogin,
  onSignup,
  onResetPassword,
  onBack,
  returningUserName,
  previewState,
}: LoginScreenProps = {}) {
  // 개발 중 화면 상태 미리보기
  const isPreview = __DEV__ && !!previewState;

  const hasPreviewInputs =
    isPreview &&
    (previewState === STATES.FILLED ||
      previewState === STATES.ERROR ||
      previewState === STATES.RETURNING);

  // 이메일, 비밀번호 입력값 관리
  const [email, setEmail] = useState(
    hasPreviewInputs ? 'pia-kr@example.com' : ''
  );

  const [password, setPassword] = useState(
    hasPreviewInputs ? 'password123' : ''
  );
  
  // 로그인 상태 및 요청 중 여부 관리
  const [status, setStatus] = useState<LoginPreviewState>(
    isPreview && previewState
      ? previewState
      : returningUserName
      ? STATES.RETURNING
      : STATES.EMPTY
  );

  const [loading, setLoading] = useState(false);
  
  const emailValid = EMAIL_REGEX.test(email.trim());
  const emailFormatError =
    email.trim().length > 0 && !emailValid
      ? '이메일 형식을 확인해 주세요'
      : '';

  // 로그인 버튼 활성화 조건
  // 비밀번호 정책 전체가 아닌, 로그인 요청에 필요한 최소 입력 여부만 판단합니다.
  const hasInputs =
    emailValid &&
    password.length > 0;

  const isError = status === STATES.ERROR;
  const isKakaoError = status === STATES.KAKAO_ERROR;
  const isReturning = status === STATES.RETURNING;

  const displayStatus =
    status === STATES.EMPTY ||
    status === STATES.FILLED
      ? hasInputs
        ? STATES.FILLED
        : STATES.EMPTY
      : status;
  
  // 입력값 변경 시 기존 오류 상태 초기화
  const changeEmail = (value: string) => {
    setEmail(value);
    if (isError) setStatus(STATES.EMPTY);
  };

  const changePassword = (value: string) => {
    setPassword(value);
    if (isError) setStatus(STATES.EMPTY);
  };
  
  // 이메일 로그인 요청 처리
  const handleLogin = async () => {
    if (!hasInputs || loading) return;

    if (typeof onLogin !== 'function') {
      Alert.alert(
        '로그인 안내',
        '로그인 API가 아직 연결되지 않았습니다.'
      );
      return;
    }

    try {
      setLoading(true);
      // 부모에서 통신·인증 정보 반영·성공 이동을 처리합니다. 실패 시 예외를 전달해야 합니다.
      await onLogin(email.trim(), password);
    } catch {
      // TODO(로그인 연동): 계정 불일치와 네트워크/서버 장애를 구분해 안내합니다.
      setStatus(STATES.ERROR);
    } finally {
      setLoading(false);
    }
  };

   // 카카오 로그인 요청 및 오류 처리
  const handleKakaoLogin = async () => {
    if (loading) return;

    if (typeof onKakaoLogin !== 'function') {
      Alert.alert(
        '카카오 로그인 안내',
        '카카오 인증 기능이 아직 연결되지 않았습니다.'
      );
      return;
    }

    try {
      setLoading(true);
      await onKakaoLogin();
    } catch {
      setStatus(STATES.KAKAO_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    if (typeof onSignup === 'function') {
      onSignup();
    } else {
      Alert.alert('안내', '회원가입 화면 연결 예정입니다.');
    }
  };

  const handleResetPassword = () => {
    if (typeof onResetPassword === 'function') {
      onResetPassword();
    } else {
      Alert.alert('안내', '비밀번호 재설정 화면 연결 예정입니다.');
    }
  };

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else {
      Alert.alert('안내', '이전 화면 연결 예정입니다.');
    }
  };

  let heroTitle = '다시 만나서 반가워요';
  let heroDescription =
    '로그인하고 경제 모험을 이어가세요.';
  let heroVariant: CardVariant = 'info';

  if (displayStatus === STATES.FILLED) {
    heroTitle = '경제를 배우는 작은 모험';
    heroDescription =
      '짧게 배우고, 퀴즈로 도전하고, 함께 성장해요.';
  }

  if (isReturning) {
    heroTitle =
      `${returningUserName || 'pia'}님의 모험이 기다리고 있어요`;
    heroDescription =
      '지난 학습부터 이어서 시작해 보세요.';
  }

  if (isError) {
    heroTitle = '로그인하지 못했어요';
    heroDescription =
      '이메일과 비밀번호를 다시 확인해 주세요.';
    heroVariant = 'error';
  }

  if (isKakaoError) {
    heroTitle = '카카오 로그인을 마치지 못했어요';
    heroDescription =
      '취소했거나 연결이 원활하지 않았어요.';
    heroVariant = 'reward';
  }

  // 로그인 화면 UI
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios' ? 'padding' : undefined
        }
      >
        {/* 상단 고정 헤더 */}
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>로그인</Text>
        </View>

        {/* 본문 스크롤 영역 */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            {/* 로그인 상태별 안내 카드 */}
            <LerenCard
              title={heroTitle}
              description={heroDescription}
              variant={heroVariant}
            />

            {/* 이메일 로그인 입력 영역 */}
            {!isKakaoError && (
              <>
                <LerenInput
                  label="이메일"
                  value={email}
                  onChangeText={changeEmail}
                  placeholder="이메일을 입력해 주세요"
                  error={emailFormatError}
                  hint={
                    email.length === 0
                      ? '가입한 이메일을 입력해 주세요'
                      : ''
                  }
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!loading}
                />

                <LerenInput
                  label="비밀번호"
                  value={password}
                  onChangeText={changePassword}
                  placeholder="비밀번호를 입력해 주세요"
                  hint={
                    isError
                      ? '입력한 계정 정보를 확인해 주세요'
                      : password.length === 0
                      ? '비밀번호를 입력해 주세요'
                      : ''
                  }
                  state={isError ? 'error' : 'default'}
                  secure
                  autoComplete="current-password"
                  editable={!loading}
                />
                {/* 로그인 및 비밀번호 재설정 */}
                <LerenButton
                  title={isError ? '다시 로그인' : '로그인'}
                  onPress={handleLogin}
                  disabled={!hasInputs}
                  loading={loading}
                />

                <LerenLinkCard
                  title={
                    isReturning
                      ? '비밀번호 재설정'
                      : '비밀번호를 잊으셨나요?'
                  }
                  subtitle={
                    isReturning ? '도움 받기' : '재설정'
                  }
                  onPress={handleResetPassword}
                  disabled={loading}
                />
              </>
            )}
            {/* TODO(로그인 UI): 카카오 버튼이 이메일 입력 완료에 종속되지 않도록 표시 기준 협의 */}
            {(displayStatus === STATES.FILLED ||
              isKakaoError) && (
              <LerenButton
                title={
                  isKakaoError
                    ? '카카오로 다시 시작하기'
                    : '카카오로 시작하기'
                }
                variant={
                  isKakaoError ? 'primary' : 'secondary'
                }
                onPress={handleKakaoLogin}
                loading={loading}
              />
            )}
            {/* 카카오 로그인 실패 후 이메일 로그인 전환 */}
            {isKakaoError && (
              <LerenButton
                title="이메일로 로그인"
                variant="secondary"
                onPress={() => {
                  setStatus(STATES.EMPTY);
                  setEmail('');
                  setPassword('');
                }}
              />
            )}
            {/* 회원가입 화면 이동 */}
            {!isError && !isReturning && (
              <LerenLinkCard
                title={
                  isKakaoError
                    ? '아직 계정이 없나요?'
                    : '처음 오셨나요?'
                }
                subtitle="회원가입"
                onPress={handleSignup}
                disabled={loading}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 로그인 화면 공통 스타일
// 이 화면/컴포넌트의 배치·색상·크기 정의. 최종 UI는 디자인 기준과 기기에서 확인합니다.
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: LAYOUT.headerHeight,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    gap: LAYOUT.gap,
  },
});
