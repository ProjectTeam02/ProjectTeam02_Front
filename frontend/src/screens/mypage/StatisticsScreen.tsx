/** 실제 전체·개념별 학습 통계와 페이지별 학습 이력을 표시합니다. */
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Heading, Chip, Row, Progress, Empty, LinkRow } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import { HistoryRecords } from '../../components/ui/HistoryRecords';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import { useBackend } from '../../hooks/useBackend';
import { historyDecoder, PATHS } from '../../services/backend';
import { STATISTICS_PATHS, overallDecoder, conceptsDecoder } from '../../services/statisticsApi';

export default function StatisticsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState(params.tab === 'concepts' ? 1 : params.tab === 'history' ? 2 : 0);
  const [page, setPage] = useState(1);
  const overall = useBackend(tab === 0 ? STATISTICS_PATHS.overall : null, overallDecoder);
  const concepts = useBackend(tab !== 2 ? STATISTICS_PATHS.concepts : null, conceptsDecoder);
  const history = useBackend(tab === 2 ? `${PATHS.history}?page=${page}&pageSize=10` : null, historyDecoder);
  const items = concepts.data?.items ?? [];
  const studied = items.filter(item => item.attempts > 0);
  const weak = [...studied].sort((a, b) => a.accuracy - b.accuracy)[0];

  return <Screen title="학습 통계" back tabs>
    <Row>{['전체', '개념별', '학습 이력'].map((title, i) => <Chip key={title} label={title} active={i === tab} onPress={() => setTab(i)} />)}</Row>
    {tab === 0 ? <><ApiStatus resource={overall} label="전체 학습 통계" />
      {overall.data && <>
        <LerenCard variant="info" title="나의 학습 성과" description="응시 통과율">
          <Heading>{overall.data.attempts ? `${Math.round(overall.data.passedAttempts / overall.data.attempts * 100)}%` : '—'}</Heading>
          <Progress value={overall.data.attempts ? overall.data.passedAttempts / overall.data.attempts : 0} />
          <Body muted>통과 {overall.data.passedAttempts}회 · 미통과 {overall.data.failedAttempts}회</Body>
        </LerenCard>
        <Row>
          <LerenCard title={`${overall.data.completedStages}개`} description="완료한 단계" style={{ flex: 1 }} />
          <LerenCard title={`${overall.data.attempts}회`} description="총 응시" style={{ flex: 1 }} />
        </Row>
      </>}
      <ApiStatus resource={concepts} label="개념별 성취도" empty={items.length === 0} />
      {studied.length > 0 && <LerenCard title="개념별 성취도">
        {studied.slice(0, 5).map(item => <LerenCard key={item.conceptId} title={item.title}
          description={`정답률 ${(item.accuracy * 100).toFixed(1)}% · 정답 ${item.correct}/${item.attempts}`}>
          <Progress value={item.accuracy} />
        </LerenCard>)}
      </LerenCard>}
      <LinkRow title="개념별 강점과 취약점" subtitle="자세히 보기" onPress={() => setTab(1)} />
      <LinkRow title="날짜별 학습 이력" subtitle="기록 보기" onPress={() => setTab(2)} />
    </>
      : tab === 1 ? <><ApiStatus resource={concepts} label="개념별 학습 통계" empty={items.length === 0} />
        {studied.map(item => <LerenCard key={item.conceptId} title={item.title}
          description={`정답률 ${(item.accuracy * 100).toFixed(1)}% · 정답 ${item.correct}/${item.attempts}`}>
          <Progress value={item.accuracy} />
        </LerenCard>)}
        {weak && <LerenCard variant="reward" title={`${weak.title}을 다시 살펴볼까요?`}
          description={`학습한 개념 중 정답률이 가장 낮아요. 현재 정답률은 ${(weak.accuracy * 100).toFixed(1)}%예요.`} />}
        {concepts.data && studied.length === 0 && <Empty title="아직 개념별 성취 기록이 없어요"
          description="학습을 완료하면 개념별 정답률을 확인할 수 있어요." />}
        {concepts.data && <LerenButton title="학습 이력 보기" onPress={() => setTab(2)} />}
      </>
      : <><ApiStatus resource={history} label="학습 이력" empty={history.data?.total === 0} />
        {history.data && (history.data.total > 0 ? <>
          <LerenCard title={`학습 기록 · 총 ${history.data.total}건`}
            description="지금까지 저장된 학습 내역을 확인할 수 있어요." />
          <HistoryRecords key={page} records={history.data.items} />
          {history.data.totalPages > 1 && <Row>
            <LerenButton title="이전" style={{ flex: 1, width: undefined }} variant="secondary"
              disabled={page <= 1} onPress={() => setPage(v => v - 1)} />
            <LerenButton title={`다음 (${page}/${history.data.totalPages})`} style={{ flex: 1, width: undefined }} variant="secondary"
              disabled={page >= history.data.totalPages} onPress={() => setPage(v => v + 1)} />
          </Row>}
        </> : <Empty title="학습을 시작하면 성장 기록이 보여요"
          description="아직 저장된 학습 이력이 없습니다." />)}
      </>}
  </Screen>;
}
