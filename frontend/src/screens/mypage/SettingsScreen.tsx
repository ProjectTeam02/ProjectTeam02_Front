/** 피그마 26-01, 26-05: 설정 목록 및 로그아웃 확인 */
import { useState } from 'react';
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { LinkRow, Notice } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const profile = useBackendProfile();
  const { signOut } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nickname = profile.data?.nickname;

  /** 실제 서버 세션 폐기에 성공하면 인증 상태가 초기화됩니다. */
  const submitLogout = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await signOut(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '로그아웃하지 못했어요. 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  };

  return <Screen title="설정" back tabs>
    {nickname && <LerenCard title={`${nickname}님의 학습 환경`} description="나에게 맞게 프로필과 알림을 설정해요." variant="info" />}
    {profile.status === 'loading' && <Notice>프로필을 불러오는 중이에요.</Notice>}
    {profile.status === 'error' && <Notice tone="error">{profile.error}</Notice>}
    <LinkRow title="프로필 수정" subtitle="닉네임 · 이메일" onPress={() => router.push('/profile')} />
    <LinkRow title="학습 알림" subtitle="학습 알림 시간 설정" onPress={() => router.push('/notifications')} />
    <LinkRow title="비밀번호 재설정" subtitle="등록한 이메일로 안내" onPress={() => router.push('/reset-password')} />
    <LerenCard title="학습 기록은 계정에 저장돼요" description="같은 계정으로 로그인하면 완료한 학습과 성장 기록을 이어서 볼 수 있어요." variant="info" />
    {confirmLogout ? <>
      <LerenCard title="로그아웃할까요?" description="다시 로그인하면 학습 기록을 이어서 볼 수 있어요.">
        <LerenButton title="로그아웃" loading={busy} disabled={busy} onPress={() => { void submitLogout(); }} />
        <LerenButton title="취소" variant="secondary" disabled={busy} onPress={() => setConfirmLogout(false)} />
      </LerenCard>
      {!!error && <Notice tone="error">{error}</Notice>}
    </> : <LerenButton title="로그아웃" variant="secondary" onPress={() => setConfirmLogout(true)} />}
  </Screen>;
}