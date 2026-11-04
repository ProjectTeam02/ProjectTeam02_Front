/**
 * 4번 페이지의 큰 Leren 로고 초기 화면입니다.
 * 이메일 로그인은 기존 백엔드로 실제 인증합니다. 카카오·아이디 찾기는 아직 미연결입니다.
 */
import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/ui/Screen';
import { Notice } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import LerenInput from '../../components/common/LerenInput';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function WelcomeScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [socialNotice, setSocialNotice] = useState(false);
  const [accountNotice, setAccountNotice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ready = EMAIL.test(email.trim()) && password.length > 0;

  // 성공한 서버 응답을 받은 뒤에만 홈을 엽니다. 실패한 입력은 화면에 남겨 다시 시도할 수 있게 합니다.
  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true); setError('');
    try {
      await signIn(email.trim(), password);
      setPassword('');
      router.replace('/home');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '로그인하지 못했어요. 다시 시도해 주세요.');
    } finally { setBusy(false); }
  };

  return (
    <Screen title="" back={false}>
      <View style={styles.brand}>
        <Text style={styles.spark}>✦</Text>
        <Text style={styles.logo} accessibilityLabel="Leren">Leren</Text>
        <Text style={styles.tagline}>짧게 배우고 바로 이해하는 경제 RPG</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.heading}>경제 모험을 이어가볼까요?</Text>
        <LerenInput label="" placeholder="이메일" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" error={email.length > 0 && !EMAIL.test(email.trim()) ? '이메일 형식을 확인해 주세요' : ''} />
        <LerenInput label="" placeholder="비밀번호" value={password} onChangeText={setPassword} secure autoComplete="current-password" />
        <LerenButton title="로그인" disabled={!ready || busy} loading={busy} onPress={submit} />
        {!!error && <Notice tone="error">{error}</Notice>}
        <View style={styles.recoveryLinks}>
          <Pressable accessibilityRole="button" onPress={() => setAccountNotice(true)} style={styles.textButton}><Text style={styles.mutedLink}>아이디 찾기</Text></Pressable>
          <Text style={styles.mutedLink}>·</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/reset-password')} style={styles.textButton}><Text style={styles.mutedLink}>비밀번호 재설정</Text></Pressable>
        </View>
        {accountNotice && <Notice>아이디는 가입한 이메일이에요. 계정 찾기 기능은 아직 연결하지 않았어요.</Notice>}
        <Pressable accessibilityRole="button" onPress={() => router.push('/signup')} style={styles.textButton}>
          <Text style={styles.link}>처음 오셨나요? 회원가입</Text>
        </Pressable>
        <Text style={styles.socialLabel}>간편 소셜 로그인</Text>
        <Pressable accessibilityRole="button" onPress={() => setSocialNotice(true)} style={styles.kakao}>
          <Text style={styles.kakaoLabel}>카카오로 시작하기</Text>
        </Pressable>
        {socialNotice && <Notice>카카오 인증은 아직 연결하지 않았어요. 가입된 이메일 계정으로 로그인해 주세요.</Notice>}
      </View>
      <Text style={styles.footer}>오늘의 경제 지식이 내일의 힘이 돼요.</Text>
      <Text style={styles.preview}>이메일 로그인은 실제 인증 · 학습 기록은 임시 저장입니다.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: 8, paddingTop: 56, paddingBottom: 10 },
  spark: { ...TYPOGRAPHY.title, color: COLORS.success, textAlign: 'center' },
  logo: { fontFamily: 'PixelifySans_700Bold', fontSize: 62, lineHeight: 68, color: COLORS.primary, textAlign: 'center' },
  tagline: { ...TYPOGRAPHY.small, color: COLORS.primary, textAlign: 'center' },
  form: { width: '100%', padding: 20, gap: 14, borderWidth: 1, borderColor: COLORS.line, borderRadius: 16, backgroundColor: COLORS.surface },
  heading: { ...TYPOGRAPHY.heading, color: COLORS.ink },
  textButton: { minHeight: 24, justifyContent: 'center' },
  recoveryLinks: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6 },
  mutedLink: { ...TYPOGRAPHY.small, color: COLORS.muted, textAlign: 'center' },
  link: { ...TYPOGRAPHY.small, color: COLORS.primary, textAlign: 'center' },
  socialLabel: { ...TYPOGRAPHY.micro, color: COLORS.muted, textAlign: 'center' },
  kakao: { minHeight: 48, borderRadius: 12, backgroundColor: '#FEE500', alignItems: 'center', justifyContent: 'center' },
  kakaoLabel: { ...TYPOGRAPHY.label, color: COLORS.primary, textAlign: 'center' },
  footer: { ...TYPOGRAPHY.small, color: COLORS.muted, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  preview: { ...TYPOGRAPHY.micro, color: COLORS.muted, textAlign: 'center' },
});
