
/** 피그마 19-03: 나의 성장 상세 */
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Heading, Row } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenButton from '../../components/common/LerenButton';
import LerenCharacter from '../../components/common/LerenCharacter';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { heroImage } from '../../constants/heroImage';
import { getCostumeImage } from '../../constants/costumeImages';

function LevelCard({ title, level, exp }: { title: string; level: number | null; exp: number | null }) {
  return <View style={{ borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, padding: 14, gap: 10 }}>
    <Row style={{ justifyContent: 'space-between' }}>
      <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink }}>{title}</Text>
      <Text style={{ ...TYPOGRAPHY.label, color: COLORS.primary }}>Lv.{level ?? '—'}</Text>
    </Row>
    <View style={{ height: 7, borderRadius: 4, backgroundColor: COLORS.soft }} />
    <Row style={{ justifyContent: 'space-between' }}>
      <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>{exp === null ? '경험치 정보 없음' : `현재 경험치 ${exp.toLocaleString()} EXP`}</Text>
      <Text style={{ ...TYPOGRAPHY.micro, color: COLORS.muted }}>레벨 기준 미제공</Text>
    </Row>
  </View>;
}

export default function GrowthScreen() {
  const profile = useBackendProfile();
  const p = profile.data;
  const outfit = p?.equippedCostumes.find(c => c.name);
  const portrait = getCostumeImage('', outfit?.name ?? undefined) ?? heroImage(p?.characterClass);

  return <Screen title="나의 성장" back tabs>
    <ApiStatus resource={profile} label="성장 정보" />
    {!!p && <>
      <View style={{ backgroundColor: COLORS.soft, borderRadius: 12, padding: 14 }}>
        <Row>
          {!!portrait && <LerenCharacter source={portrait} size={48} />}
          <View style={{ flex: 1, gap: 3 }}>
            <Heading>{p.nickname}의 성장</Heading>
            <Body muted>{[p.characterClass?.name, outfit?.name].filter(Boolean).join(' · ') || '나의 캐릭터'}</Body>
          </View>
        </Row>
      </View>
      <Heading>레벨별 경험치</Heading>
      <LevelCard title="전체 레벨" level={p.level} exp={p.totalExp} />
      <LevelCard title="경제 레벨" level={p.economyLevel} exp={p.economyExp} />
      <Heading>학습 성과</Heading>
      <View style={{ borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, overflow: 'hidden' }}>
        <Pressable onPress={() => router.push('/statistics')} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 }}>
          <Text style={{ ...TYPOGRAPHY.label, color: COLORS.primary }}>▥</Text>
          <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink, flex: 1 }}>학습 통계</Text>
          <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>학습률 · 정답률 ›</Text>
        </Pressable>
        <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 12 }} />
        <Pressable onPress={() => router.push({ pathname: '/statistics', params: { tab: 'history' } })} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 }}>
          <Text style={{ ...TYPOGRAPHY.label, color: COLORS.primary }}>⚑</Text>
          <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink, flex: 1 }}>완료한 단계</Text>
          <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>{p.completedStageCount}단계 ›</Text>
        </Pressable>
      </View>
      <LerenButton title="탐험 이어가기" onPress={() => router.push('/explore')} />
    </>}
  </Screen>;
}
