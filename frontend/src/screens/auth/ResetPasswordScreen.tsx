/**
 * 비밀번호 재설정의 이메일 입력 → 안내 → 새 비밀번호 → 완료 화면을 표시합니다.
 * 이메일 전송·재설정 토큰·실제 비밀번호 변경은 연결하지 않은 화면 미리보기입니다.
 */
import { useState } from 'react';
import { router } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import Screen from '../../components/ui/Screen';
import LerenInput from '../../components/common/LerenInput';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import LerenLinkCard from '../../components/common/LerenLinkCard';
import { Notice } from '../../components/ui/Primitives';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type ResetStep = 'request' | 'sent' | 'new' | 'complete';
export default function ResetPasswordScreen() {
  const [step, setStep] = useState<ResetStep>('request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const emailError = email.length > 0 && !EMAIL.test(email.trim()) ? '이메일 형식을 확인해 주세요' : '';
  const mismatch = confirm.length > 0 && password !== confirm;
  const title = step === 'sent' ? '이메일을 확인해 주세요' : step === 'new' ? '새 비밀번호 설정' : step === 'complete' ? '비밀번호 변경 완료' : '비밀번호 재설정';

  // 이 전환은 화면 확인을 위한 것입니다. 실제 앱은 이메일 링크의 재설정 토큰 검증 후 새 비밀번호 화면을 엽니다.
  const finish = () => { setPassword(''); setConfirm(''); setStep('complete'); };
  return (
    <Screen title={title}>
      {step === 'request' && <>
        <LerenCard title="비밀번호를 잊으셨나요?" description="가입할 때 사용한 이메일을 입력해 주세요." variant="info" />
        <LerenInput label="이메일" value={email} onChangeText={setEmail} placeholder="이메일을 입력해 주세요" keyboardType="email-address" autoComplete="email" hint="가입할 때 사용한 이메일" error={emailError} />
        <LerenButton title="재설정 안내 받기" disabled={!EMAIL.test(email.trim())} onPress={() => setStep('sent')} />
      </>}
      {step === 'sent' && <>
        <LerenCard title="메일함을 확인해 주세요" description="입력한 이메일로 안내를 확인할 수 있어요." variant="info" />
        <LerenCard title="재설정 안내" description={email} />
        <LerenLinkCard title="LEREN 비밀번호 재설정 메일" subtitle="새 비밀번호 설정" onPress={() => setStep('new')} />
        <LerenCard title="메일이 보이지 않나요?" description="스팸 메일함을 확인하거나 이메일 주소를 다시 확인해 주세요." />
        <Notice>화면 미리보기로 실제 이메일은 보내지 않았어요.</Notice>
        <LerenButton title="이메일 다시 보내기" onPress={() => setStep('request')} />
      </>}
      {step === 'new' && <>
        <LerenCard title="새 비밀번호를 정해 주세요" description="자주 사용하는 다른 비밀번호와 다르게 설정해요." variant="info" />
        <LerenInput label="새 비밀번호" value={password} onChangeText={setPassword} placeholder="새 비밀번호를 입력해 주세요" secure autoComplete="new-password" hint="안전한 비밀번호를 입력해 주세요" error={password.length > 0 && password.length < 8 ? '비밀번호를 8자 이상 입력해 주세요' : ''} />
        <LerenInput label="새 비밀번호 확인" value={confirm} onChangeText={setConfirm} placeholder="새 비밀번호를 다시 입력해 주세요" secure autoComplete="new-password" hint="같은 비밀번호를 한 번 더 입력해 주세요" error={mismatch ? '비밀번호가 일치하지 않아요' : ''} />
        <LerenButton title="비밀번호 변경" disabled={password.length < 8 || password !== confirm} onPress={finish} />
      </>}
      {step === 'complete' && <>
        <LerenCard title="비밀번호를 변경했어요" description="새 비밀번호로 로그인해 모험을 이어가세요." variant="success" />
        <Notice tone="info">변경 완료 화면 미리보기입니다. 실제 계정의 비밀번호는 변경하지 않았어요.</Notice>
      </>}
      <LerenButton title="로그인으로 돌아가기" variant={step === 'complete' ? 'primary' : 'secondary'} onPress={() => router.replace('/login')} />
      {step === 'request' && <Text style={styles.preview}>화면 미리보기 · 실제 이메일 발송은 연결하지 않았어요.</Text>}
    </Screen>
  );
}
const styles = StyleSheet.create({ preview: { ...TYPOGRAPHY.micro, color: COLORS.muted, marginTop: 8 } });
