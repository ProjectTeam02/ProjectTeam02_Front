/**
 * 피그마 26번 설정 화면입니다. 각 설정으로 이동하고 로그아웃 확인 UI를 표시합니다.
 * 로그아웃은 기존 서버 세션을 폐기합니다. 학습 알림 저장과 프로필 조회는 실제 API를 사용합니다.
 */
import { useState } from 'react';
import { router } from 'expo-router';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import Screen from '../../components/ui/Screen';
import { LinkRow, Notice } from '../../components/ui/Primitives';
import { useLearningProgress } from '../../context/LearningProgressContext';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const { profile } = useLearningProgress();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // 통신 실패 시 인증 상태를 유지하고 재시도를 안내합니다. 성공하면 화면 보호가 초기 화면으로 이동시킵니다.
  const submitLogout = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await signOut(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '로그아웃하지 못했어요. 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  };

  return (
    <Screen title="설정" back tabs onBack={confirmLogout ? () => setConfirmLogout(false) : undefined}>
      <LerenCard title={`${profile.nickname}님의 학습 환경`} description="나에게 맞게 프로필과 알림을 설정해요." variant="info" />
      <LinkRow title="프로필 수정" subtitle="닉네임 · 이메일" onPress={() => router.push('/profile')} />
      <LinkRow title="학습 알림" subtitle="켜기·끄기 서버 저장 · 현재값 조회는 준비 중" onPress={() => router.push('/notifications')} />
      <LinkRow title="비밀번호 재설정" subtitle="본인 확인·재설정 API 준비 중" onPress={() => router.push('/reset-password')} />
      <LerenCard title="나의 학습 기록" description="학습 이력과 달력은 서버 기록을 조회합니다. 개발용 학습 미리보기의 로컬 진행도는 정식 기록에 저장되지 않습니다." variant="info" />
      {confirmLogout ? (
        <LerenCard title="로그아웃할까요?" description="서버의 로그인 세션을 종료하고 임시 학습 기록을 초기화합니다.">
          <LerenButton title="로그아웃" loading={busy} disabled={busy} onPress={submitLogout} />
          {!!error && <Notice tone="error">{error}</Notice>}
          <LerenButton title="계속 둘러보기" variant="secondary" onPress={() => setConfirmLogout(false)} />
        </LerenCard>
      ) : <LerenButton title="로그아웃" variant="secondary" onPress={() => setConfirmLogout(true)} />}
    </Screen>
  );
}
