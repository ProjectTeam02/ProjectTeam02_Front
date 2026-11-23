
/** 피그마 19-04: 나의 학습 */
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Heading, Row } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenButton from '../../components/common/LerenButton';
import LerenIcon from '../../components/common/LerenIcon';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { useBackend } from '../../hooks/useBackend';
import { historyDecoder, PATHS } from '../../services/backend';

function Menu({ icon, title, subtitle, onPress }: { icon: React.ComponentProps<typeof LerenIcon>['name']; title: string; subtitle: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
    <LerenIcon name={icon} size={19} />
    <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink, flex: 1 }}>{title}</Text>
    <Text style={{ ...TYPOGRAPHY.micro, color: COLORS.muted }}>{subtitle}</Text>
    <LerenIcon name="ChevronRight" size={16} color={COLORS.muted} />
  </Pressable>;
}

export default function MyLearningScreen() {
  const profile = useBackendProfile();
  const history = useBackend(`${PATHS.history}?page=1&pageSize=10`, historyDecoder);
  const p = profile.data;
  const records = history.data?.items ?? [];
  const correct = records.reduce((sum, item) => sum + item.correctCount, 0);
  const submitted = records.reduce((sum, item) => sum + item.submittedCount, 0);
  const accuracy = submitted > 0 ? `${Math.round(correct / submitted * 100)}%` : '—';

  return <Screen title="나의 학습" back tabs>
    <Heading>나의 학습 현황</Heading>
    <ApiStatus resource={profile} label="학습 정보" />
    <ApiStatus resource={history} label="학습 기록" />
    {!!p && <View style={{ backgroundColor: '#F4F6FA', borderRadius: 12, padding: 14, gap: 8 }}>
      <Row>
        <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <Text style={{ ...TYPOGRAPHY.heading, color: COLORS.ink }}>{p.completedStageCount}</Text>
          <Text style={{ ...TYPOGRAPHY.micro, color: COLORS.muted }}>완료 단계</Text>
        </View>
        <View style={{ width: 1, height: 38, backgroundColor: COLORS.line }} />
        <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <Text style={{ ...TYPOGRAPHY.heading, color: COLORS.ink }}>{history.data?.total ?? '—'}</Text>
          <Text style={{ ...TYPOGRAPHY.micro, color: COLORS.muted }}>전체 학습 기록</Text>
        </View>
        <View style={{ width: 1, height: 38, backgroundColor: COLORS.line }} />
        <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <Text style={{ ...TYPOGRAPHY.heading, color: COLORS.ink }}>{accuracy}</Text>
          <Text style={{ ...TYPOGRAPHY.micro, color: COLORS.muted }}>최근 조회 정답률</Text>
        </View>
      </Row>
    </View>}
    <Heading>다시 풀어보기</Heading>
    <View style={{ backgroundColor: COLORS.soft, borderRadius: 12, padding: 14, gap: 10 }}>
      <Row>
        <LerenIcon name="BookOpen" size={19} />
        <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink }}>선택과 기회비용</Text>
      </Row>
      <Body muted>틀렸거나 헷갈렸던 개념을 복습 노트에서 다시 확인해요.</Body>
      <LerenButton title="추천 문제 풀기" onPress={() => router.push('/review')} />
    </View>
    <Heading>나의 기록</Heading>
    <View style={{ borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, overflow: 'hidden' }}>
      <Menu icon="BookOpen" title="오답 노트" subtitle="틀린 문제" onPress={() => router.push({ pathname: '/review', params: { filter: 'WRONG' } })} />
      <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 12 }} />
      <Menu icon="History" title="학습 이력" subtitle="완료 · 응시 내역" onPress={() => router.push({ pathname: '/statistics', params: { tab: 'history' } })} />
      <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 12 }} />
      <Menu icon="CalendarDays" title="학습 달력" subtitle="날짜별 기록" onPress={() => router.push('/calendar')} />
      <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 12 }} />
      <Menu icon="ChartNoAxesColumn" title="학습 통계" subtitle="개념별 정답률" onPress={() => router.push('/statistics')} />
    </View>
  </Screen>;
}
