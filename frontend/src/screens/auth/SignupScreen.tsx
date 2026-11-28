/** 11번 회원가입 화면의 입력과 요청, 가입 완료 후 첫 직업 선택을 실제 서버 응답에 연결합니다. */
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/ui/Screen';
import LerenInput from '../../components/common/LerenInput';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import { Notice } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import type { LoginResult } from '../../services/auth';
import { SignupEmailConflictError, signupWithSession, type SignupValues, type SignupAccount } from '../../services/signup';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { AuthIntro, AuthTextLink, authButtonText } from './AuthFormUI';

export type { SignupValues } from '../../services/signup';
export type SignupResult = SignupAccount;
export interface SignupScreenProps {
  onSignup?: (values: SignupValues) => Promise<SignupAccount>;
  onBack?: () => void;
  onLogin?: () => void;
}

const EMAIL = /^\S+@\S+\.\S+$/;

export default function SignupScreen({ onSignup, onLogin, onBack }: SignupScreenProps = {}) {
  const { completeSignup } = useAuth();
  const pending = useRef(false);
  const signupSession = useRef<LoginResult | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [created, setCreated] = useState<{ account: SignupAccount; sessionReady: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<{ kind: 'email' | 'form'; message: string } | null>(null);
  const normalizedEmail = email.trim();
  const nicknameLength = [...nickname.trim()].length;
  const emailValid = EMAIL.test(normalizedEmail) && normalizedEmail.length <= 255;
  const passwordValid = password.trim().length >= 8 && password.length <= 128;
  const nicknameValid = nicknameLength >= 1 && nicknameLength <= 30;
  const mismatch = confirm.length > 0 && confirm !== password;
  const ready = emailValid && passwordValid && password === confirm && nicknameValid && failure?.kind !== 'email';
  const goToLogin = onLogin ?? (() => router.replace('/login'));

  // 연결 오류는 폼을 수정할 때 지우고, 이메일 충돌은 실제 이메일을 바꿀 때만 해제합니다.
  const clearFormError = () => setFailure(current => current?.kind === 'form' ? null : current);

  const submit = async () => {
    if (!ready || pending.current) return;
    pending.current = true;
    setBusy(true);
    setFailure(null);
    try {
      const values = { email: normalizedEmail, password, passwordConfirm: confirm, nickname: nickname.trim() };
      const session = onSignup ? null : await signupWithSession(values);
      const account = session?.user ?? await onSignup?.(values);
      if (!account?.userId || !account.nickname) throw new Error('서버의 회원가입 결과를 확인하지 못했어요.');
      // 비밀번호는 성공 직후 지우고, 서버가 발급한 세션만 화면의 메모리에 둡니다.
      signupSession.current = session;
      setPassword('');
      setConfirm('');
      setCreated({ account, sessionReady: !!session });
    } catch (cause) {
      setFailure(cause instanceof SignupEmailConflictError
        ? { kind: 'email', message: '이미 사용 중인 이메일이에요. 다른 이메일을 사용해 주세요.' }
        : { kind: 'form', message: cause instanceof Error ? cause.message : '계정을 만들지 못했어요. 다시 시도해 주세요.' });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const continueAfterSignup = () => {
    if (!created?.sessionReady || onLogin) { goToLogin(); return; }
    // 같은 버튼을 다시 탭해도 이미 넘긴 세션으로 로그인 화면을 열지 않습니다.
    const session = signupSession.current;
    if (!session) return;
    try {
      completeSignup(session);
      signupSession.current = null;
      router.replace('/jobs');
    } catch (cause) {
      setFailure({ kind: 'form', message: cause instanceof Error ? cause.message : '잠시 후 다시 시도해 주세요.' });
    }
  };

  if (created) {
    const canChooseJob = created.sessionReady && !onLogin;
    return (
      <Screen title="가입 완료" onBack={onBack}>
        <AuthIntro title="가입이 완료됐어요" description={`${created.account.nickname}님, LEREN에 오신 걸 환영해요.`}
          icon="CheckCheck" tone="success" />
        <LerenCard style={styles.nextCard} variant="info" title="다음은 직업 선택이에요"
          description={canChooseJob ? '검사·마법사·궁수 중 함께할 직업을 골라 주세요.' : '로그인하면 함께할 직업을 선택할 수 있어요.'} />
        {failure?.kind === 'form' && <Notice tone="error">{failure.message}</Notice>}
        <LerenButton title={canChooseJob ? '직업 선택하기' : '로그인하기'} textStyle={authButtonText}
          style={styles.nextButton} onPress={continueAfterSignup} />
        <Text style={styles.tip}>직업은 나중에 마이페이지에서도 바꿀 수 있어요.</Text>
      </Screen>
    );
  }

  return (
    <Screen title="회원가입" onBack={onBack}>
      <AuthIntro title={busy ? '계정을 만들고 있어요' : '모험가 계정 만들기'}
        description={busy ? '완료되면 직업을 선택할 수 있어요.' : '이메일로 가입하고 첫 모험을 시작해요.'}
        icon="UserRound" busy={busy} />
      <View style={styles.fields}>
        <LerenInput variant="auth" label="이메일" value={email}
          onChangeText={value => {
            setEmail(value);
            if (value.trim() !== normalizedEmail) setFailure(null);
            else clearFormError();
          }}
          placeholder="이메일 주소를 입력해 주세요" keyboardType="email-address" autoComplete="email" editable={!busy}
          error={failure?.kind === 'email' ? failure.message
            : normalizedEmail && !emailValid ? '255자 이내의 올바른 이메일 주소를 입력해 주세요.' : undefined} />
        <LerenInput variant="auth" label="비밀번호" value={password}
          onChangeText={value => { setPassword(value); clearFormError(); }}
          placeholder="비밀번호를 입력해 주세요" secure revealPassword autoComplete="new-password" editable={!busy}
          error={password && !passwordValid ? '비밀번호를 8~128자로 입력해 주세요.' : undefined} />
        <LerenInput variant="auth" label="비밀번호 확인" value={confirm}
          onChangeText={value => { setConfirm(value); clearFormError(); }}
          placeholder="비밀번호를 다시 입력해 주세요" secure revealPassword autoComplete="new-password" editable={!busy}
          error={mismatch ? '비밀번호가 일치하지 않아요. 다시 입력해 주세요.' : undefined} />
        <LerenInput variant="auth" label="닉네임" value={nickname}
          onChangeText={value => { setNickname(value); clearFormError(); }}
          placeholder="모험에서 사용할 이름을 입력해 주세요" editable={!busy}
          hint={nickname.trim() ? '모험에서 사용할 이름이에요.' : undefined}
          error={nickname && !nicknameValid ? '닉네임을 1~30자로 입력해 주세요.' : undefined} />
      </View>
      {failure?.kind === 'form' && <View style={styles.formError}><Notice tone="error">{failure.message}</Notice></View>}
      <LerenButton title="계정 만들기" textStyle={authButtonText} style={styles.submit}
        disabled={!ready || busy} loading={busy} loadingLabel="계정 생성 중…" onPress={submit} />
      {!busy && <AuthTextLink prefix="이미 계정이 있나요?" label="로그인" onPress={goToLogin} style={styles.account} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fields: { marginTop: 14, gap: 10 },
  formError: { marginTop: 12 },
  submit: { marginTop: 18 },
  account: { marginTop: 14 },
  nextCard: { minHeight: 86, marginTop: 16 },
  nextButton: { marginTop: 11 },
  tip: { ...TYPOGRAPHY.micro, color: COLORS.muted, textAlign: 'center', marginTop: 12 },
});
