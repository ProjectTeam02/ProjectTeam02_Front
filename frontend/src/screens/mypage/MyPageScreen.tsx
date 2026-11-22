/** 계정의 실제 직업·성장·보유 코인과 자주 쓰는 메뉴를 표시합니다. */
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Heading, LinkRow, Row } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import { useBackendProfile } from '../../context/BackendProfileContext';
import LerenCard from '../../components/common/LerenCard';
import LerenCharacter from '../../components/common/LerenCharacter';
import LerenButton from '../../components/common/LerenButton';
import { heroImage } from '../../constants/heroImage';
import { getCostumeImage } from '../../constants/costumeImages';

export default function MyPageScreen() {
  const profile = useBackendProfile();
  const p = profile.data;
  const outfit = p?.equippedCostumes.find(c => c.name);
  const portrait = getCostumeImage('', outfit?.name ?? undefined) ?? heroImage(p?.characterClass);
  return <Screen title="마이페이지" tabs>
    {p && <LerenCard variant="info">
      <Row>{portrait && <LerenCharacter source={portrait} size={64} />}<Heading>{p.nickname}</Heading></Row>
      <Body>{[p.characterClass?.name, outfit?.name].filter(Boolean).join(' · ')}</Body>
      {!!p.email && <Body muted>{p.email}</Body>}
      <LerenButton title="프로필 수정" variant="secondary" onPress={() => router.push('/profile')} />
    </LerenCard>}
    <LinkRow title={p?.coinBalance != null ? '보유 코인 · ' + p.coinBalance.toLocaleString() : '보유 코인'} subtitle="코스튬 상점" onPress={() => router.push('/shop')} />
    <Heading>내 학습</Heading>
    {p && <LerenCard title={'나의 성장 · Lv.' + (p.level ?? '—')} description={`경제 Lv.${p.economyLevel ?? '—'} · 완료한 단계 ${p.completedStageCount}개`} />}
    <LinkRow title="학습 기록" subtitle={p ? '완료한 단계 ' + p.completedStageCount + '개' : undefined} onPress={() => router.push({ pathname: '/statistics', params: { tab: 'history' } })} />
    <LinkRow title="학습 달력" subtitle="기록과 일정" onPress={() => router.push('/calendar')} />
    <LinkRow title="학습 통계" subtitle="개념별 정답률과 학습 이력" onPress={() => router.push('/statistics')} />
    <Heading>캐릭터와 계정</Heading>
    <LinkRow title="직업·보유 코스튬" subtitle="내 옷장" onPress={() => router.push('/wardrobe')} />
    <LinkRow title="프로필·설정" subtitle="알림과 계정" onPress={() => router.push('/settings')} />
    <ApiStatus resource={profile} label="내 정보" />
    <LinkRow title="연결 상태 확인" onPress={() => router.push('/connections')} />
  </Screen>;
}
