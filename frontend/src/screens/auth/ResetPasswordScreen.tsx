/** 피그마 27번: 이메일 요청 → 메일 확인 → 새 비밀번호 설정 → 완료 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import Screen from '../../components/ui/Screen';
import { Notice } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import LerenInput from '../../components/common/LerenInput';
import { requestPasswordReset, confirmPasswordReset } from '../../services/passwordResetApi';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Step = 'email' | 'sent' | 'password' | 'complete';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string; resetToken?: string }>();
  const token = typeof params.resetToken === 'string' ? params.resetToken : typeof params.token === 'string' ? params.token : '';
  const [step, setStep] = useState<Step>(token ? 'password' : 'email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const validEmail = EMAIL.test(email.trim());
  const validPassword = password.length >= 8 && password.length <= 128;
  const validConfirm = password === confirm && confirm.length > 0;
  const login = () => router.replace('/login');

  const send = async () => {
    if (!validEmail || busy) return;
    setBusy(true); setError('');
    try { await requestPasswordReset(email.trim()); setStep('sent'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '재설정 안내를 요청하지 못했어요.'); }
    finally { setBusy(false); }
  };

  const change = async () => {
    setSubmitted(true);
    if (!validPassword || !validConfirm || !token || busy) return;
    setBusy(true); setError('');
    try {
      await confirmPasswordReset(token, password);
      setPassword(''); setConfirm(''); setStep('complete');
    } catch (cause) { setError(cause instanceof Error ? cause.message : '비밀번호를 변경하지 못했어요.'); }
    finally { setBusy(false); }
  };

  return <Screen title={step === 'email' || step === 'sent' ? '비밀번호 재설정' : step === 'password' ? '새 비밀번호 설정' : '비밀번호 변경 완료'} back>
    {step === 'email' && <>
      <View style={s.info}>
        <View style={s.infoText}>
          <Text style={s.infoTitle}>비밀번호를 잊으셨나요?</Text>
          <Text style={s.infoDescription}>가입할 때 사용한 이메일을 입력해 주세요.</Text>
        </View>
        <View style={s.iconCircle}><Text style={s.infoIcon}>🔒</Text></View>
      </View>
      <LerenInput label="이메일" value={email} onChangeText={value => { setEmail(value); setError(''); }}
        placeholder="가입할 때 사용한 이메일" keyboardType="email-address" autoComplete="email"
        editable={!busy} hint="가입할 때 사용한 이메일"
        error={email.length > 0 && !validEmail ? '올바른 이메일 형식으로 입력해 주세요' : ''} />
      <LerenButton title="재설정 안내 받기" disabled={!validEmail} loading={busy} onPress={() => { void send(); }} />
      <LerenButton title="로그인으로 돌아가기" variant="secondary" onPress={login} />
    </>}

    {step === 'sent' && <>
      <View style={s.info}>
        <View style={s.infoText}>
          <Text style={s.infoTitle}>메일함을 확인해 주세요</Text>
          <Text style={s.infoDescription}>입력한 이메일로 안내를 확인할 수 있어요.</Text>
        </View>
        <View style={s.iconCircle}><Text style={s.infoIcon}>✉</Text></View>
      </View>
      <LerenCard title={email} description={'등록된 계정이라면 비밀번호 재설정 안내가 발송돼요.\n메일의 링크에서 새 비밀번호를 설정해 주세요.'} />
      <LerenCard title="LEREN 비밀번호 재설정 메일" description="새 비밀번호 설정" />
      <Text style={s.hint}>메일이 보이지 않으면 스팸함도 확인해 주세요.</Text>
      <LerenButton title="이메일 다시 보내기" variant="secondary" loading={busy} onPress={() => { void send(); }} />
      <LerenButton title="로그인으로 돌아가기" onPress={login} />
    </>}

    {step === 'password' && <>
      <View style={s.info}>
        <View style={s.infoText}>
          <Text style={s.infoTitle}>새 비밀번호를 정해 주세요</Text>
          <Text style={s.infoDescription}>자주 사용하는 다른 비밀번호와 다르게 설정해요.</Text>
        </View>
        <View style={s.iconCircle}><Text style={s.infoIcon}>♙</Text></View>
      </View>
      <LerenInput label="새 비밀번호" value={password} onChangeText={value => { setPassword(value); setError(''); }}
        placeholder="새 비밀번호" secure autoComplete="new-password" editable={!busy}
        hint="안전한 비밀번호를 입력해 주세요"
        error={submitted && !validPassword ? '비밀번호는 8~128자여야 합니다.' : ''} />
      <LerenInput label="새 비밀번호 확인" value={confirm} onChangeText={value => { setConfirm(value); setError(''); }}
        placeholder="새 비밀번호 확인" secure autoComplete="new-password" editable={!busy}
        hint="같은 비밀번호를 한 번 더 입력해 주세요"
        error={confirm.length > 0 && !validConfirm ? '비밀번호가 일치하지 않습니다.' : ''} />
      <LerenButton title="비밀번호 변경" disabled={!validPassword || !validConfirm || !token} loading={busy}
        onPress={() => { void change(); }} />
      <LerenButton title="로그인으로 돌아가기" variant="secondary" onPress={login} />
    </>}

    {step === 'complete' && <>
      <View style={s.info}>
        <View style={s.infoText}>
          <Text style={s.infoTitle}>비밀번호를 변경했어요</Text>
          <Text style={s.infoDescription}>새 비밀번호로 로그인해 모험을 이어가세요.</Text>
        </View>
        <View style={s.iconCircle}><Text style={s.infoIcon}>✓</Text></View>
      </View>
      <LerenCard title="학습 기록이 기다리고 있어요" description="완료한 학습과 캐릭터 성장은 계정에 그대로 남아 있어요." />
      <LerenButton title="로그인하기" onPress={login} />
    </>}

    {!!error && <Notice tone="error">{error}</Notice>}
  </Screen>;
}

const s = StyleSheet.create({
  info: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.soft, borderRadius: 12, padding: 14, gap: 12 },
  infoText: { flex: 1, gap: 4 },
  infoTitle: { ...TYPOGRAPHY.label, color: COLORS.ink },
  infoDescription: { ...TYPOGRAPHY.small, color: COLORS.muted },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  infoIcon: { fontSize: 20, color: COLORS.primary, textAlign: 'center' },
  hint: { ...TYPOGRAPHY.small, color: COLORS.muted },
});
