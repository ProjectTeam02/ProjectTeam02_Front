
/** 피그마 26-02, 26-03: 프로필 수정 및 저장 완료 */
import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { ApiStatus } from '../../components/ui/ApiStatus';
import { Notice } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import LerenInput from '../../components/common/LerenInput';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
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
        <View style={{ backgroundColor: '#F4F6FA', borderRadius: 12, padding: 14, gap: 5 }}>
          <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink }}>이메일</Text>
          <Text style={{ ...TYPOGRAPHY.body, color: COLORS.ink }}>{email ?? '등록된 이메일이 없습니다.'}</Text>
        </View>
        <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>로그인에 사용하는 이메일을 확인할 수 있어요.</Text>
        {!!action.error && <Notice tone="error">{action.error}</Notice>}
        <LerenButton title="변경 내용 저장" loading={action.busy} disabled={action.busy || !validNickname || !changed} onPress={() => { void save(); }} />
        <LerenButton title="취소" variant="secondary" onPress={() => router.back()} />
      </>}
    </> : <>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.soft, borderRadius: 12, padding: 14, gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 20, color: COLORS.primary }}>✓</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink }}>프로필을 저장했어요</Text>
          <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>{savedNickname}님, 오늘도 즐겁게 학습해요.</Text>
        </View>
      </View>
      <View style={{ backgroundColor: '#F4F6FA', borderRadius: 12, padding: 14, gap: 5 }}>
        <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink }}>현재 프로필</Text>
        <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>닉네임 · {savedNickname}</Text>
        <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>이메일 · {email ?? '등록된 이메일 없음'}</Text>
      </View>
      <LerenButton title="마이페이지로 돌아가기" onPress={() => router.replace('/mypage')} />
      <LerenButton title="설정 계속하기" variant="secondary" onPress={() => router.replace('/settings')} />
    </>}
  </Screen>;
}
