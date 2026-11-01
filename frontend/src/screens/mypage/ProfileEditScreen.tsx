/** 프로필 수정·저장 완료 화면입니다. 이메일은 확인 전용이며 닉네임만 앱 메모리에 반영합니다. */
import { useState } from 'react';
import { router } from 'expo-router';
import LerenInput from '../../components/common/LerenInput';
import LerenCard from '../../components/common/LerenCard';
import LerenButton from '../../components/common/LerenButton';
import Screen from '../../components/ui/Screen';
import { Body, Notice } from '../../components/ui/Primitives';
import { useLearningProgress } from '../../context/LearningProgressContext';

export default function ProfileEditScreen() {
  const { profile, setNickname } = useLearningProgress();
  const [nickname, changeNickname] = useState(profile.nickname);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // 최소한의 화면 입력 검증입니다. 중복 닉네임 여부는 서버 연결 단계에서 처리합니다.
  const save = () => {
    if (nickname.trim().length < 2 || nickname.trim().length > 12) { setError('닉네임은 2~12자로 입력해 주세요.'); return; }
    setNickname(nickname.trim());
    setSaved(true);
    setError('');
  };

  return (
    <Screen title="프로필 수정" back tabs>
      {saved ? <>
        <Notice tone="success">프로필을 수정했어요.</Notice>
        <LerenCard title={profile.nickname} description="변경한 닉네임이 마이페이지에 반영되었어요." variant="info" />
        <LerenButton title="설정으로 돌아가기" onPress={() => router.replace('/settings')} />
        <LerenButton title="다시 수정하기" variant="secondary" onPress={() => setSaved(false)} />
      </> : <>
        <LerenInput label="닉네임" value={nickname} placeholder="닉네임을 입력해 주세요" onChangeText={value => { changeNickname(value); setError(''); }} hint="모험에서 사용할 이름이에요. 2~12자로 입력해 주세요." error={error} />
        <LerenCard title="이메일" description={profile.email} variant="info" />
        <Body muted>로그인에 사용하는 이메일을 확인할 수 있어요.</Body>
        <LerenButton title="변경 내용 저장" onPress={save} />
        <LerenButton title="취소" variant="secondary" onPress={() => router.back()} />
      </>}
    </Screen>
  );
}
