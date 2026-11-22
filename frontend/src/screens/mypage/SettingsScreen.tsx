
/** 피그마 26-01, 26-05: 설정 목록 및 로그아웃 확인 */
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Notice, Row, Body, Heading } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import LerenIcon from '../../components/common/LerenIcon';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { useAuth } from '../../context/AuthContext';
import LerenCharacter from '../../components/common/LerenCharacter';
import { heroImage } from '../../constants/heroImage';
import { getCostumeImage } from '../../constants/costumeImages';

function Menu({ icon, title, subtitle, onPress }: { icon: React.ComponentProps<typeof LerenIcon>['name']; title: string; subtitle: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, minHeight: 52 }}>
    <LerenIcon name={icon} size={19} />
    <View style={{ flex: 1, gap: 3 }}>
      <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink }}>{title}</Text>
      <Text style={{ ...TYPOGRAPHY.micro, color: COLORS.muted }}>{subtitle}</Text>
    </View>
    <LerenIcon name="ChevronRight" size={16} color={COLORS.muted} />
  </Pressable>;
}

export default function SettingsScreen() {
  const profile = useBackendProfile();
  const { signOut } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nickname = profile.data?.nickname ?? '';
  const outfit = profile.data?.equippedCostumes?.find(c => c.name);
  const portrait = getCostumeImage('', outfit?.name ?? undefined) ?? heroImage(profile.data?.characterClass);

  const submitLogout = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await signOut(); setConfirmLogout(false); router.replace('/login'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '로그아웃하지 못했어요. 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  };

  return <Screen title="설정" back tabs>
    {nickname.length > 0 ? <View style={{ backgroundColor: '#E9EFFF', borderRadius: 14, padding: 14 }}>
      <Row>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' }}>
          {portrait ? <LerenCharacter source={portrait} size={40} /> : null}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Heading>{nickname}님의 학습 환경</Heading>
          <Body muted>나에게 맞게 프로필과 알림을 설정해요.</Body>
        </View>
      </Row>
    </View> : null}
    {profile.status === 'loading' ? <Notice>프로필을 불러오는 중이에요.</Notice> : null}
    {profile.status === 'error' ? <Notice tone="error">{profile.error}</Notice> : null}
    <View style={{ borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, padding: 8, gap: 4 }}>
      <Menu icon="UserRound" title="프로필 수정" subtitle="닉네임 · 이메일" onPress={() => router.push('/profile')} />
      <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 12 }} />
      <Menu icon="Bell" title="학습 알림" subtitle="학습 알림 시간 설정" onPress={() => router.push('/notifications')} />
      <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 12 }} />
      <Menu icon="LockKeyhole" title="비밀번호 재설정" subtitle="등록한 이메일로 안내" onPress={() => router.push('/reset-password')} />
    </View>
    <View style={{ backgroundColor: '#F4F6FA', borderRadius: 12, padding: 14, gap: 5 }}>
      <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink }}>학습 기록은 계정에 저장돼요</Text>
      <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>같은 계정으로 로그인하면 완료한 학습과 성장 기록을 이어서 볼 수 있어요.</Text>
    </View>
    <LerenButton title="로그아웃" variant="secondary" onPress={() => { setError(''); setConfirmLogout(true); }} />
    <Modal visible={confirmLogout} transparent animationType="fade" onRequestClose={() => { if (!busy) setConfirmLogout(false); }}>
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(24,40,66,0.38)', padding: 24 }}>
        <View style={{ backgroundColor: COLORS.surface, borderRadius: 18, padding: 20, gap: 10 }}>
          <Text style={{ ...TYPOGRAPHY.heading, color: COLORS.ink }}>로그아웃할까요?</Text>
          <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>다시 로그인하면 학습 기록을 이어서 볼 수 있어요.</Text>
          {error.length > 0 ? <Notice tone="error">{error}</Notice> : null}
          <LerenButton title="로그아웃" loading={busy} onPress={() => { void submitLogout(); }} />
          <LerenButton title="취소" variant="secondary" disabled={busy} onPress={() => setConfirmLogout(false)} />
        </View>
      </View>
    </Modal>
  </Screen>;
}
