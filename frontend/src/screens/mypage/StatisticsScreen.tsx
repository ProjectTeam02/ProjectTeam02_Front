/** 피그마 23번: 전체·개념별·학습 이력 통계 */
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Heading, Progress, Row } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import { HistoryRecords } from '../../components/ui/HistoryRecords';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useBackend } from '../../hooks/useBackend';
import { historyDecoder, PATHS } from '../../services/backend';
import { STATISTICS_PATHS, overallDecoder, conceptsDecoder, type ConceptStatistic } from '../../services/statisticsApi';

const percent = (value: number) => `${Number((value * 100).toFixed(1))}%`;

function ConceptList({ records }: { records: ConceptStatistic[] }) {
  return <LerenCard>
    {records.map((item, i) => <View key={item.conceptId} style={{ gap: 5, paddingVertical: 6, borderBottomWidth: i === records.length - 1 ? 0 : 1, borderBottomColor: COLORS.line }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink, flex: 1 }}>{item.title}</Text>
        <Text style={{ ...TYPOGRAPHY.small, color: COLORS.primary }}>{percent(item.accuracy)}</Text>
      </Row>
      <Body muted>정답 {item.correct} / {item.attempts}문항</Body>
      <Progress value={item.accuracy} />
    </View>)}
  </LerenCard>;
}

export default function StatisticsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState(params.tab === 'concepts' ? 1 : params.tab === 'history' ? 2 : 0);
  const [page, setPage] = useState(1);
  const overall = useBackend(tab === 0 ? STATISTICS_PATHS.overall : null, overallDecoder);
  const concepts = useBackend(tab !== 2 ? STATISTICS_PATHS.concepts : null, conceptsDecoder);
  const history = useBackend(tab === 2 ? `${PATHS.history}?page=${page}&pageSize=10` : null, historyDecoder);
  const items = concepts.data?.items ?? [];
  const studied = items.filter(item => item.attempts > 0);
  const attempts = overall.data?.attempts ?? 0;
  const passed = overall.data?.passedAttempts ?? 0;
  const failed = overall.data?.failedAttempts ?? 0;
  const rate = attempts > 0 ? passed / attempts : 0;
  const startLearning = () => router.push('/explore');

  return <Screen title="학습 통계" back tabs>
    <View style={{ flexDirection: 'row', backgroundColor: '#F4F6FA', borderRadius: 10, padding: 4, gap: 4 }}>
      {['전체', '개념별', '학습 이력'].map((title, i) => <Pressable key={title} accessibilityRole="tab" accessibilityState={{ selected: tab === i }} onPress={() => { setTab(i); setPage(1); }}
        style={{ flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: tab === i ? COLORS.surface : 'transparent', borderWidth: tab === i ? 1 : 0, borderColor: COLORS.line }}>
        <Text style={{ ...TYPOGRAPHY.small, color: tab === i ? COLORS.primary : COLORS.muted, fontWeight: tab === i ? '700' : '400' }}>{title}</Text>
      </Pressable>)}
    </View>
    {tab === 0 && <>
      <ApiStatus resource={overall} label="전체 학습 통계" />
      {overall.data && (attempts > 0 ? <>
        <Heading>나의 학습 성과</Heading>
        <View style={{ backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, gap: 8 }}>
          <Text style={{ ...TYPOGRAPHY.small, color: COLORS.surface }}>응시 통과율</Text>
          <Text style={{ ...TYPOGRAPHY.title, fontSize: 32, lineHeight: 42, color: COLORS.surface }}>{percent(rate)}</Text>
          <Text style={{ ...TYPOGRAPHY.small, color: COLORS.surface }}>통과 {passed}회 · 미통과 {failed}회</Text>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: '#6985C0', overflow: 'hidden' }}>
            <View style={{ height: 6, width: `${rate * 100}%`, backgroundColor: COLORS.surface, borderRadius: 3 }} />
          </View>
        </View>
        <Row>
          <View style={{ flex: 1, backgroundColor: '#F4F6FA', borderRadius: 12, padding: 14, gap: 4 }}>
            <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>완료한 단계</Text>
            <Text style={{ ...TYPOGRAPHY.heading, color: COLORS.ink }}>{overall.data.completedStages}단계</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#F4F6FA', borderRadius: 12, padding: 14, gap: 4 }}>
            <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>총 응시</Text>
            <Text style={{ ...TYPOGRAPHY.heading, color: COLORS.ink }}>{attempts}회</Text>
          </View>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Heading>개념별 정답률</Heading>
          <Pressable onPress={() => setTab(1)}><Text style={{ ...TYPOGRAPHY.small, color: COLORS.primary }}>전체 보기 ›</Text></Pressable>
        </Row>
        <ApiStatus resource={concepts} label="개념별 성취도" />
        {studied.length > 0 ? <ConceptList records={studied.slice(0, 5)} /> : concepts.data && <Body muted>아직 개념별 학습 기록이 없어요.</Body>}
      </> : <View style={{ gap: 12, paddingTop: 30 }}>
        <LerenCard title="아직 응시한 기록이 없어요" description="첫 단계를 마치면 통계 결과를 학습 성과로 볼 수 있어요." variant="info">
          <LerenButton title="첫 탐험 시작하기" onPress={startLearning} />
        </LerenCard>
        <Row>
          <LerenCard title={`${overall.data.completedStages}단계`} description="완료 단계" style={{ flex: 1 }} />
          <LerenCard title={`${attempts}회`} description="총 응시" style={{ flex: 1 }} />
        </Row>
      </View>)}
    </>}
    {tab === 1 && <>
      <ApiStatus resource={concepts} label="개념별 학습 통계" />
      {concepts.data && (studied.length > 0 ? <>
        <Heading>개념별 성취도</Heading>
        <Body muted>학습한 개념 {studied.length}개</Body>
        <ConceptList records={studied} />
        <LerenButton title="학습 이력 보기" variant="secondary" onPress={() => { setTab(2); setPage(1); }} />
      </> : <View style={{ paddingTop: 30 }}>
        <LerenCard variant="info" title="개념별 기록을 기다리고 있어요" description="문제를 풀고 채점하면 정답률과 응시 횟수가 쌓여요.">
          <LerenButton title="첫 탐험 시작하기" onPress={startLearning} />
        </LerenCard>
      </View>)}
    </>}
    {tab === 2 && <>
      <ApiStatus resource={history} label="학습 이력" />
      {history.data && (history.data.total > 0 ? <>
        <Row style={{ justifyContent: 'space-between' }}>
          <Heading>학습 이력</Heading>
          <Body muted>총 {history.data.total}건</Body>
        </Row>
        <HistoryRecords records={history.data.items} />
        {history.data.totalPages > 1 && <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F4F6FA', borderRadius: 10, padding: 6 }}>
          <Pressable disabled={page <= 1} onPress={() => setPage(v => v - 1)} style={{ padding: 10 }}>
            <Text style={{ ...TYPOGRAPHY.small, color: page <= 1 ? COLORS.muted : COLORS.primary }}>‹ 이전</Text>
          </Pressable>
          <Text style={{ ...TYPOGRAPHY.small, color: COLORS.ink }}>{page} / {history.data.totalPages}</Text>
          <Pressable disabled={page >= history.data.totalPages} onPress={() => setPage(v => v + 1)} style={{ padding: 10 }}>
            <Text style={{ ...TYPOGRAPHY.small, color: page >= history.data.totalPages ? COLORS.muted : COLORS.primary }}>다음 ›</Text>
          </Pressable>
        </View>}
      </> : <View style={{ paddingTop: 30 }}>
        <LerenCard variant="info" title="아직 학습 이력이 없어요" description="학습을 마치면 날짜별 결과와 완료한 활동을 볼 수 있어요.">
          <LerenButton title="첫 탐험 시작하기" onPress={startLearning} />
        </LerenCard>
      </View>)}
    </>}
  </Screen>;
}