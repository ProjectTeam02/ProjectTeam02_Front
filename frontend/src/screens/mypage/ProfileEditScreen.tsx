/** 조회 가능한 프로필만 표시합니다. 닉네임 수정 API가 없어 로컬 변경을 서버 저장으로 안내하지 않습니다. */
import { useState } from 'react';
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { ApiStatus } from '../../components/ui/ApiStatus';
import { Notice } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import LerenInput from '../../components/common/LerenInput';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { useLearningProgress } from '../../context/LearningProgressContext';
import { useBackendAction } from '../../hooks/useBackend';
import { object, BackendError } from '../../services/backend';

const nicknameDecoder = (value: unknown) => {
  const data = object(value);
  if (typeof data.userId !== 'string' || typeof data.nickname !== 'string') throw new BackendError('프로필 수정 응답이 올바르지 않습니다.');
  return { userId: data.userId, nickname: data.nickname };
};

export default function ProfileEditScreen() {
  const profile = useBackendProfile();
  const { setNickname } = useLearningProgress();
  const action = useBackendAction();
  const [nicknameInput, setNicknameInput] = useState<string | null>(null);
  const [savedNickname, setSavedNickname] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const originalNickname = profile.data?.nickname ?? '';
  const nickname = nicknameInput ?? originalNickname;
  const email = profile.data?.email;
  const validNickname = nickname.trim().length >= 1 && nickname.trim().length <= 30;
  const changed = nickname.trim() !== originalNickname;

  /** 서버에 닉네임을 저장하고 실제 저장된 값을 화면에 반영합니다. */
  const save = async () => {
    setSubmitted(true);
    if (!validNickname || !changed || action.busy) return;
    const result = await action.run('/api/v1/users/me', nicknameDecoder, 'PATCH', { nickname: nickname.trim() });
    if (!result) return;
    setNickname(result.nickname);
    setSavedNickname(result.nickname);
    profile.reload();
  };

  return <Screen title="프로필 수정" back tabs onBack={() => savedNickname !== null ? router.replace('/settings') : router.back()}>
    {savedNickname === null ? <>
      <ApiStatus resource={profile} label="프로필 조회" />
      {profile.data && <>
        <LerenInput label="닉네임" value={nickname} onChangeText={value => { setNicknameInput(value); setSubmitted(false); }}
          placeholder="닉네임을 입력해 주세요" editable={!action.busy}
          hint="학습 화면에서 사용할 이름이에요."
          error={(nicknameInput !== null || submitted) && !validNickname ? '닉네임은 1~30자로 입력해 주세요.' : ''} />
        <LerenCard title="이메일" description={email ?? '등록된 이메일이 없습니다.'} variant="info" />
        <Notice>로그인에 사용하는 이메일은 확인만 할 수 있어요.</Notice>
        {!!action.error && <Notice tone="error">{action.error}</Notice>}
        <LerenButton title="변경 내용 저장" loading={action.busy} disabled={action.busy || !validNickname || !changed} onPress={() => { void save(); }} />
        <LerenButton title="취소" variant="secondary" onPress={() => router.back()} />
      </>}
    </> : <>
      <LerenCard title="프로필을 저장했어요" description={`${savedNickname}님, 오늘도 즐겁게 학습해요.`} variant="success" />
      <LerenCard title="현재 프로필" description={`닉네임 · ${savedNickname}\n이메일 · ${email ?? '등록된 이메일 없음'}`} variant="info" />
      <LerenButton title="마이페이지로 돌아가기" onPress={() => router.replace('/mypage')} />
      <LerenButton title="설정 계속하기" variant="secondary" onPress={() => router.replace('/settings')} />
    </>}
  </Screen>;
}