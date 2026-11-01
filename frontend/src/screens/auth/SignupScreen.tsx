/**
 * 회원가입 폼과 가입 완료 화면입니다.
 * 입력 검증 후 닉네임만 미리보기 상태에 반영하며 비밀번호·계정은 저장하지 않습니다.
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
import { useLearningProgress } from '../../context/LearningProgressContext';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

export interface SignupValues { email: string; password: string; nickname: string }
export interface SignupResult { success?: boolean; message?: string; code?: string }
export interface SignupScreenProps {
  onSignup?: (values: SignupValues) => SignupResult | false | void | Promise<SignupResult | false | void>;
  onBack?: () => void;
  onLogin?: () => void;
  onChooseJob?: () => void;
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupScreen({ onSignup, onLogin, onChooseJob }: SignupScreenProps = {}) {
  const { setNickname } = useLearningProgress();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [nickname, changeNickname] = useState('');
  const [status, setStatus] = useState('empty');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const emailError = email.length > 0 && !EMAIL.test(email.trim()) ? '이메일 형식을 확인해 주세요' : '';
  const passwordError = password.length > 0 && password.length < 8 ? '비밀번호를 8자 이상 입력해 주세요' : '';
  const mismatch = confirm.length > 0 && confirm !== password;
  const nicknameError = nickname.length > 0 && (nickname.trim().length < 2 || nickname.trim().length > 12) ? '닉네임은 2~12자로 입력해 주세요' : '';
  // UI 확인용 검증입니다. 실제 계정·중복·비밀번호 정책은 서버 연동 시 계약에 맞춥니다.
  const ready = EMAIL.test(email.trim()) && password.length >= 8 && password === confirm && nickname.trim().length >= 2 && nickname.trim().length <= 12;

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = onSignup ? await onSignup({ email: email.trim(), password, nickname: nickname.trim() }) : undefined;
      if (result === false || (result && result.success === false)) throw new Error('signup');
      setNickname(nickname.trim());
      setPassword('');
      setConfirm('');
      setStatus('success');
    } catch {
      setError('계정을 만들지 못했어요. 입력값을 확인하고 다시 시도해 주세요.');
    } finally { setBusy(false); }
  };

  if (status === 'success') return (
    <Screen title="가입 완료">
      <LerenCard title={`${nickname || '모험가'}님, LEREN에 오신 걸 환영해요!`} description="경제를 배우는 모험을 함께 시작해요." variant="success" />
      <LerenCard title="이제 영웅을 선택해 주세요" description="검사·마법사·궁수 중 함께할 직업을 고를 수 있어요." variant="info" />
      <LerenButton title="직업 선택하기" onPress={onChooseJob || (() => router.push('/jobs'))} />
      <Text style={styles.hint}>직업은 나중에 마이페이지에서도 바꿀 수 있어요.</Text>
      <Text style={styles.preview}>화면 미리보기 · 실제 계정은 생성되지 않아요.</Text>
    </Screen>
  );

  return (
    <Screen title="회원가입">
      <LerenInput label="이메일" value={email} onChangeText={(value) => { setEmail(value); setError(''); }} placeholder="이메일을 입력해 주세요" keyboardType="email-address" autoComplete="email" error={error || emailError} editable={!busy} />
      <LerenInput label="비밀번호" value={password} onChangeText={setPassword} placeholder="비밀번호를 입력해 주세요" secure autoComplete="new-password" error={passwordError} editable={!busy} />
      <LerenInput label="비밀번호 확인" value={confirm} onChangeText={setConfirm} placeholder="비밀번호를 다시 입력해 주세요" secure autoComplete="new-password" error={mismatch ? '비밀번호가 일치하지 않아요' : ''} editable={!busy} />
      <LerenInput label="닉네임" value={nickname} onChangeText={changeNickname} placeholder="닉네임을 입력해 주세요" hint="모험에서 사용할 이름이에요" error={nicknameError} editable={!busy} />
      {status === 'pending' && <Notice>계정을 만드는 중이에요. 이 화면은 처리 상태 미리보기입니다.</Notice>}
      <LerenButton title={busy ? '계정을 만드는 중...' : '계정 만들기'} disabled={!ready} loading={busy} onPress={submit} />
      <LerenLinkCard title="이미 계정이 있나요?" subtitle="로그인" onPress={onLogin || (() => router.replace('/login'))} />
      <Text style={styles.preview}>화면 미리보기 · 입력값은 서버로 전송하지 않아요.</Text>
    </Screen>
  );
}
const styles = StyleSheet.create({
  hint: { ...TYPOGRAPHY.small, color: COLORS.muted },
  preview: { ...TYPOGRAPHY.micro, color: COLORS.muted, marginTop: 8 },
});
