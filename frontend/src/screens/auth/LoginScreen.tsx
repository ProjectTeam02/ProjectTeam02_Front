/** 10번 로그인 화면의 재방문·입력·실패 상태와 실제 이메일·카카오 인증을 연결합니다. */
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/ui/Screen';
import LerenInput from '../../components/common/LerenInput';
import LerenButton from '../../components/common/LerenButton';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { InvalidCredentialsError } from '../../services/auth';
import { AuthIntro, AuthTextLink, authButtonText } from './AuthFormUI';

export interface LoginScreenProps {
  onLogin?: (email: string, password: string) => unknown;
  onKakaoLogin?: () => unknown;
  onSignup?: () => void;
  onResetPassword?: () => void;
  onBack?: () => void;
  returningUserName?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({
  onLogin, onKakaoLogin, onSignup, onResetPassword, onBack, returningUserName: previewName,
}: LoginScreenProps = {}) {
  const { signIn, startKakaoSignIn, returningName } = useAuth();
  const username = previewName ?? returningName;
  const requestPending = useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingMethod, setPendingMethod] = useState<'email' | 'kakao' | null>(null);
  const [error, setError] = useState<{ method: 'email' | 'kakao'; message: string } | null>(null);
  const validEmail = EMAIL.test(email.trim());
  const valid = validEmail && password.length > 0;
  const pending = pendingMethod !== null;

  // 이메일과 카카오 요청 중 하나만 진행하며, 실패한 입력은 같은 화면에서 수정할 수 있습니다.
  const submit = async () => {
    if (!valid || requestPending.current) return;
    requestPending.current = true;
    setPendingMethod('email');
    setError(null);
    try {
      if (onLogin) await onLogin(email.trim(), password);
      else await signIn(email.trim(), password);
      setPassword('');
      router.replace('/home');
    } catch (cause) {
      setError({ method: 'email', message: cause instanceof InvalidCredentialsError
        ? '이메일과 비밀번호를 다시 확인해 주세요.'
        : cause instanceof Error ? cause.message : '잠시 후 다시 시도해 주세요.' });
    } finally {
      requestPending.current = false;
      setPendingMethod(null);
    }
  };

  const social = async () => {
    if (requestPending.current) return;
    requestPending.current = true;
    setPendingMethod('kakao');
    setError(null);
    try {
      await (onKakaoLogin ?? startKakaoSignIn)();
      if (!onKakaoLogin && Platform.OS !== 'web') router.replace('/home');
    } catch (cause) {
      setError({ method: 'kakao', message: cause instanceof Error ? cause.message : '잠시 후 다시 시도해 주세요.' });
    } finally {
      requestPending.current = false;
      setPendingMethod(null);
    }
  };

  const title = error?.method === 'kakao' ? '카카오 로그인에 실패했어요'
    : error ? '로그인하지 못했어요' : username ? `${username}님, 다시 만나서 반가워요` : '다시 만나서 반가워요';

  return (
    <Screen title="로그인" onBack={onBack}>
      <AuthIntro title={title} description={error?.message ?? '로그인하고 경제 모험을 이어가세요.'}
        tone={error ? 'error' : 'info'} icon={error ? 'CircleAlert' : 'LockKeyhole'} />

      <View style={styles.fields}>
        <LerenInput variant="auth" label="이메일" value={email}
          onChangeText={value => { setEmail(value); setError(null); }}
          placeholder="이메일 주소를 입력해 주세요" keyboardType="email-address" autoComplete="email"
          editable={!pending} error={email.trim() && !validEmail ? '이메일 형식을 확인해 주세요.' : undefined} />
        <LerenInput variant="auth" label="비밀번호" value={password}
          onChangeText={value => { setPassword(value); setError(null); }}
          placeholder="비밀번호를 입력해 주세요" secure revealPassword autoComplete="current-password" editable={!pending} />
      </View>

      <AuthTextLink label="비밀번호 찾기" style={styles.recovery} disabled={pending}
        onPress={onResetPassword ?? (() => router.push('/reset-password'))} />
      <LerenButton title={error?.method === 'email' ? '다시 로그인' : '로그인'} textStyle={authButtonText}
        style={styles.login} disabled={!valid || pending} loading={pendingMethod === 'email'}
        loadingLabel="로그인 중…" onPress={submit} />

      <View style={styles.divider}>
        <View style={styles.line} /><Text style={styles.or}>또는</Text><View style={styles.line} />
      </View>
      <LerenButton title="카카오로 로그인" variant="secondary" textStyle={authButtonText}
        style={[styles.kakao, pendingMethod === 'email' && styles.kakaoDisabled]}
        loading={pendingMethod === 'kakao'} loadingLabel="카카오 연결 중…" disabled={pending}
        onPress={social} />
      <AuthTextLink prefix="처음이신가요?" label="회원가입" disabled={pending} style={styles.account}
        onPress={onSignup ?? (() => router.push('/signup'))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fields: { marginTop: 20, gap: 14 },
  recovery: { marginTop: 1 },
  login: { marginTop: 4 },
  divider: { minHeight: 24, marginTop: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { height: StyleSheet.hairlineWidth, flex: 1, backgroundColor: COLORS.line },
  or: { ...TYPOGRAPHY.micro, paddingHorizontal: 6, color: '#4C5F7D' },
  kakao: { marginTop: 10, borderWidth: 0, backgroundColor: '#FEE500' },
  kakaoDisabled: { backgroundColor: COLORS.disabled },
  account: { marginTop: 16 },
});
