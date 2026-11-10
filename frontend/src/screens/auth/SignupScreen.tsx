/**
 * 앱 입력값을 실제 회원가입 API로 보내고 서버의 가입 성공 후에만 완료 화면을 엽니다.
 * 가입 뒤에는 로그인 화면으로 안내하며 비밀번호와 응답 토큰을 앱에 저장하지 않습니다.
 */
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import Screen from '../../components/ui/Screen';
import { Notice } from '../../components/ui/Primitives';
import LerenInput from '../../components/common/LerenInput';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import LerenLinkCard from '../../components/common/LerenLinkCard';
import { signup, type SignupValues, type SignupAccount } from '../../services/signup';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

export type { SignupValues } from '../../services/signup';
export type SignupResult = SignupAccount;
export interface SignupScreenProps {
  onSignup?: (values: SignupValues) => Promise<SignupAccount>;
  onBack?: () => void;
  onLogin?: () => void;
}
const EMAIL = /^\S+@\S+\.\S+$/;

export default function SignupScreen({ onSignup, onLogin }: SignupScreenProps = {}) {
  const pending = useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [nickname, changeNickname] = useState('');
  const [created, setCreated] = useState<SignupAccount | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const normalizedEmail = email.trim();
  const nicknameLength = [...nickname.trim()].length;
  const emailValid = EMAIL.test(normalizedEmail) && normalizedEmail.length <= 255;
  const passwordValid = password.trim().length >= 8 && password.length <= 128;
  const nicknameValid = nicknameLength >= 1 && nicknameLength <= 30;
  const mismatch = confirm.length > 0 && confirm !== password;
  const ready = emailValid && passwordValid && password === confirm && nicknameValid;
  const goToLogin = onLogin || (() => router.replace('/login'));

  /** 연속 탭으로 가입을 중복 요청하지 않고, 실제 서버가 만든 회원만 완료 상태에 반영합니다. */
  const submit = async () => {
    if (!ready || pending.current) return;
    pending.current = true;
    setBusy(true); setError('');
    try {
      const result = await (onSignup || signup)({ email: normalizedEmail, password,
        passwordConfirm: confirm, nickname: nickname.trim() });
      if (!result || !result.userId || !result.nickname) throw new Error('서버의 회원가입 결과를 확인하지 못했어요.');
      setPassword(''); setConfirm('');
      setCreated(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '계정을 만들지 못했어요. 다시 시도해 주세요.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  if (created) return (
    <Screen title="가입 완료">
      <LerenCard title={`${created.nickname}님, LEREN에 오신 걸 환영해요!`} description="서버에 회원가입이 완료됐어요. 가입한 이메일과 비밀번호로 로그인해 주세요." variant="success" />
      <LerenButton title="로그인하기" onPress={goToLogin} />
      <Text style={styles.hint}>입력한 비밀번호는 이 화면에 저장하지 않아요.</Text>
    </Screen>
  );

  return (
    <Screen title="회원가입">
      <LerenInput label="이메일" value={email} onChangeText={value => { setEmail(value); setError(''); }} placeholder="이메일을 입력해 주세요" keyboardType="email-address" autoComplete="email" error={email.length > 0 && !emailValid ? '255자 이내의 이메일을 입력해 주세요' : ''} editable={!busy} />
      <LerenInput label="비밀번호" value={password} onChangeText={value => { setPassword(value); setError(''); }} placeholder="비밀번호를 입력해 주세요" secure autoComplete="new-password" error={password.length > 0 && !passwordValid ? '비밀번호를 8~128자로 입력해 주세요' : ''} editable={!busy} />
      <LerenInput label="비밀번호 확인" value={confirm} onChangeText={value => { setConfirm(value); setError(''); }} placeholder="비밀번호를 다시 입력해 주세요" secure autoComplete="new-password" error={mismatch ? '비밀번호가 일치하지 않아요' : ''} editable={!busy} />
      <LerenInput label="닉네임" value={nickname} onChangeText={value => { changeNickname(value); setError(''); }} placeholder="닉네임을 입력해 주세요" hint="모험에서 사용할 이름이에요. 1~30자로 입력해 주세요." error={nickname.length > 0 && !nicknameValid ? '닉네임을 1~30자로 입력해 주세요' : ''} editable={!busy} />
      {!!error && <Notice tone="error">{error}</Notice>}
      <LerenButton title={busy ? '계정을 만드는 중...' : '계정 만들기'} disabled={!ready || busy} loading={busy} onPress={() => { void submit(); }} />
      <LerenLinkCard title="이미 계정이 있나요?" subtitle="로그인" onPress={goToLogin} />
      <Text style={styles.hint}>회원가입 정보는 설정된 백엔드로 전송되며, 서버 처리 후 가입 결과를 알려드려요.</Text>
    </Screen>
  );
}
const styles = StyleSheet.create({ hint: { ...TYPOGRAPHY.micro, color: COLORS.muted, marginTop: 8 } });
