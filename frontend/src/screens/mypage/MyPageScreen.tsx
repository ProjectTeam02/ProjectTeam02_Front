
/** 피그마 19-01, 19-02: 기본·학습 전 마이페이지 */
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Heading, Row } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenButton from '../../components/common/LerenButton';
import LerenCharacter from '../../components/common/LerenCharacter';
import LerenIcon from '../../components/common/LerenIcon';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { heroImage } from '../../constants/heroImage';
import { getCostumeImage } from '../../constants/costumeImages';

function Menu({ icon, title, subtitle, onPress }: { icon: React.ComponentProps<typeof LerenIcon>['name']; title: string; subtitle?: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, gap: 10 }}>
    <LerenIcon name={icon} size={19} />
    <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink, flex: 1 }}>{title}</Text>
    {!!subtitle && <Text style={{ ...TYPOGRAPHY.micro, color: COLORS.muted }}>{subtitle}</Text>}
    <LerenIcon name="ChevronRight" size={16} color={COLORS.muted} />
  </Pressable>;
}

function MenuBox({ children }: { children: React.ReactNode }) {
  return <View style={{ borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, overflow: 'hidden' }}>{children}</View>;
}

export default function MyPageScreen() {
  const profile = useBackendProfile();
  const p = profile.data;
  const outfit = p?.equippedCostumes.find(c => c.name);
  const portrait = getCostumeImage('', outfit?.name ?? undefined) ?? heroImage(p?.characterClass);
  const empty = p?.completedStageCount === 0;

  return <Screen title="마이페이지" tabs>
    <ApiStatus resource={profile} label="내 정보" />
    {!!p && <>
      <View style={{ borderWidth: 1, borderColor: COLORS.line, borderRadius: 14, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
          <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.soft, alignItems: 'center', justifyContent: 'center' }}>
            {!!portrait && <LerenCharacter source={portrait} size={48} />}
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ ...TYPOGRAPHY.heading, color: COLORS.ink }}>{p.nickname}</Text>
            <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>{[p.characterClass?.name, outfit?.name].filter(Boolean).join(' · ') || '나의 캐릭터'}</Text>
          </View>
          <Pressable onPress={() => router.push('/profile')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 }}>
            <LerenIcon name="Pencil" size={14} />
            <Text style={{ ...TYPOGRAPHY.micro, color: COLORS.primary }}>프로필 수정</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.push('/shop')} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F6FA', padding: 12, gap: 8 }}>
          <LerenIcon name="Coins" size={20} />
          <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted, flex: 1 }}>보유 코인</Text>
          <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink }}>{p.coinBalance === null ? '확인 불가' : `${p.coinBalance.toLocaleString()} 코인`}</Text>
          <Text style={{ ...TYPOGRAPHY.small, color: COLORS.primary, marginLeft: 8 }}>상점</Text>
          <LerenIcon name="ChevronRight" size={16} />
        </Pressable>
      </View>
      <Heading>내 학습</Heading>
      {empty ? <View style={{ backgroundColor: COLORS.soft, borderRadius: 12, padding: 14, gap: 10 }}>
        <Row>
          <LerenIcon name="Flag" size={19} />
          <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink }}>첫 탐험을 시작해 볼까요?</Text>
        </Row>
        <Body muted>단계를 마치면 이곳에 학습 기록이 쌓여요.</Body>
        <LerenButton title="첫 탐험 시작하기" onPress={() => router.push('/explore')} />
      </View> : <View style={{ flexDirection: 'row', backgroundColor: '#F4F6FA', borderRadius: 12, padding: 12 }}>
        <Pressable onPress={() => router.push('/growth')} style={{ flex: 1, gap: 5, borderRightWidth: 1, borderRightColor: COLORS.line, paddingRight: 12 }}>
          <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>나의 성장</Text>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={{ ...TYPOGRAPHY.heading, color: COLORS.ink }}>Lv.{p.level ?? '—'}</Text>
            <LerenIcon name="ChevronRight" size={16} color={COLORS.muted} />
          </Row>
        </Pressable>
        <Pressable onPress={() => router.push('/my-learning')} style={{ flex: 1, gap: 5, paddingLeft: 12 }}>
          <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>학습 기록</Text>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={{ ...TYPOGRAPHY.heading, color: COLORS.ink }}>{p.completedStageCount}단계</Text>
            <LerenIcon name="ChevronRight" size={16} color={COLORS.muted} />
          </Row>
        </Pressable>
      </View>}
      <MenuBox>
        <Menu icon="CalendarDays" title="학습 달력" subtitle="기록과 일정" onPress={() => router.push('/calendar')} />
        {!empty && <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 12 }} />}
        {!empty && <Menu icon="ChartNoAxesColumn" title="학습 통계" subtitle="개념별 성취도" onPress={() => router.push('/statistics')} />}
      </MenuBox>
      <Heading>캐릭터와 계정</Heading>
      <MenuBox>
        <Menu icon="Shirt" title="직업 · 보유 코스튬" subtitle="내 옷장" onPress={() => router.push('/wardrobe')} />
        <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 12 }} />
        <Menu icon="Settings" title="프로필 · 설정" subtitle="알림과 계정" onPress={() => router.push('/settings')} />
      </MenuBox>
    </>}
  </Screen>;
}
