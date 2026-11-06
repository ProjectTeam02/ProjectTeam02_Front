/**
 * 이메일 로그인 화면의 입력·오류·재방문 상태를 표시합니다.
 * 기본 동작은 실제 이메일·카카오 인증이며, 성공한 뒤에만 홈으로 이동합니다.
 */
import { useState } from 'react';
import { router } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import Screen from '../../components/ui/Screen';
import { Notice } from '../../components/ui/Primitives';
import LerenInput from '../../components/common/LerenInput';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import LerenLinkCard from '../../components/common/LerenLinkCard';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

type LoginStatus = 'empty' | 'error' | 'returning' | 'kakaoError';
export interface LoginScreenProps {
  onLogin?: (email: string, password: string) => unknown;
  onKakaoLogin?: () => unknown;
  onSignup?: () => void;
  onResetPassword?: () => void;
  onBack?: () => void;
  returningUserName?: string;
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ onLogin, onKakaoLogin, onSignup, onResetPassword, returningUserName }: LoginScreenProps = {}) {
  const { signIn, startKakaoSignIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<LoginStatus>(returningUserName ? 'returning' : 'empty');
  const [busy, setBusy] = useState(false);
  const [socialBusy, setSocialBusy] = useState(false);
  const [error, setError] = useState('');
  const valid = EMAIL.test(email.trim()) && password.length > 0;

  // 형식 검증만으로 통과시키지 않고 서버 인증 결과를 기다립니다. 토큰은 공통 AuthContext에서 관리합니다.
  const submit = async () => {
    if (!valid || busy || socialBusy) return;
    setBusy(true);
    setError('');
    try {
      if (onLogin) await onLogin(email.trim(), password);
      else await signIn(email.trim(), password);
      setPassword('');
      router.replace('/home');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '로그인하지 못했어요. 다시 시도해 주세요.');
      setStatus('error');
    } finally {
      setBusy(false);
    }
  };
  const social = async () => {
    if (busy || socialBusy) return;
    setSocialBusy(true); setError('');
    try { await (onKakaoLogin || startKakaoSignIn)(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '카카오 로그인을 시작하지 못했어요.'); setStatus('kakaoError'); }
    finally { setSocialBusy(false); }
  };
  const title = status === 'error' ? '로그인하지 못했어요' : status === 'returning' ? `${returningUserName || '모험가'}님의 모험이 기다리고 있어요` : valid ? '경제를 배우는 작은 모험' : '다시 만나서 반가워요';
  const description = status === 'error' ? '이메일과 비밀번호를 다시 확인해 주세요.' : status === 'returning' ? '지난 학습부터 이어서 시작해 보세요.' : valid ? '짧게 배우고, 퀴즈로 도전하고, 함께 성장해요.' : '로그인하고 경제 모험을 이어가세요.';

  return (
    <Screen title="LEREN">
      <LerenCard title={title} description={description} variant={status === 'error' ? 'error' : 'info'} />
      <LerenInput label="이메일" value={email} onChangeText={(value) => { setEmail(value); setStatus('empty'); }} placeholder="이메일을 입력해 주세요" keyboardType="email-address" autoComplete="email" editable={!busy} error={email.length > 0 && !EMAIL.test(email.trim()) ? '이메일 형식을 확인해 주세요' : ''} />
      <LerenInput label="비밀번호" value={password} onChangeText={(value) => { setPassword(value); setStatus('empty'); }} placeholder="비밀번호를 입력해 주세요" secure autoComplete="current-password" editable={!busy} error={status === 'error' ? '입력한 계정 정보를 확인해 주세요' : ''} />
      <LerenButton title={status === 'error' ? '다시 로그인' : '로그인'} disabled={!valid || socialBusy} loading={busy} onPress={submit} />
      {!!error && <Notice tone="error">{error}</Notice>}
      <LerenLinkCard title="비밀번호를 잊으셨나요?" subtitle="재설정" onPress={onResetPassword || (() => router.push('/reset-password'))} />
      <LerenButton title="카카오로 시작하기" variant="secondary" onPress={social} loading={socialBusy} disabled={busy} />
      <LerenLinkCard title="처음 오셨나요?" subtitle="회원가입" onPress={onSignup || (() => router.push('/signup'))} />
      <Text style={styles.preview}>이메일 회원가입과 로그인은 실제 백엔드로 처리합니다.</Text>
    </Screen>
  );
}
const styles = StyleSheet.create({ preview: { ...TYPOGRAPHY.micro, color: COLORS.muted, marginTop: 8 } });
