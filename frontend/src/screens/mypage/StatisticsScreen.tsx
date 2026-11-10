/** 통계의 임시 수치 대신 실제 회원 성장과 페이지별 학습 이력을 사용합니다. 개념 통계 API는 미구현입니다. */
import { useState } from 'react';
import Screen from '../../components/ui/Screen';
import { Body, Chip, Row } from '../../components/ui/Primitives';
import { ApiStatus, Unconnected } from '../../components/ui/ApiStatus';
import { HistoryRecords } from '../../components/ui/HistoryRecords';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import { useBackend } from '../../hooks/useBackend';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { historyDecoder, PATHS } from '../../services/backend';
export default function StatisticsScreen() {
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const profile = useBackendProfile();
  const history = useBackend(`${PATHS.history}?page=${page}&pageSize=10`, historyDecoder);
  const p = profile.data;
  return <Screen title="학습 통계·이력" back tabs>
    <Row>{['전체', '개념별', '학습 이력'].map((title, i) => <Chip key={title} label={title} active={i === tab} onPress={() => setTab(i)} />)}</Row>
    {tab === 0 ? <><ApiStatus resource={profile} label="성장 정보" />{p && <LerenCard title={`완료한 단계 ${p.completedStageCount}개`} description={`전체 레벨 ${p.level ?? '데이터 없음'} · EXP ${p.totalExp ?? '데이터 없음'}\n경제 레벨 ${p.economyLevel ?? '데이터 없음'} · EXP ${p.economyExp ?? '데이터 없음'}`} />}<Unconnected>전체 학습률·성장 구간 기준을 제공하는 통계 API가 없습니다. 임의의 분모나 경험치 기준을 표시하지 않습니다.</Unconnected><LerenButton title="실제 학습 이력 보기" onPress={() => setTab(2)} /></>
      : tab === 1 ? <Unconnected>개념별 정답률·강점·취약점 통계 API가 아직 없습니다.</Unconnected>
      : <><ApiStatus resource={history} label="학습 이력" empty={history.data?.total === 0} />{history.data && <><Body muted>총 {history.data.total}건 · {page} / {Math.max(1, history.data.totalPages)} 페이지</Body><HistoryRecords key={page} records={history.data.items} /><Row><LerenButton title="이전 기록" style={{ flex: 1, width: undefined }} variant="secondary" disabled={page <= 1} onPress={() => setPage(v => v - 1)} /><LerenButton title="다음 기록" style={{ flex: 1, width: undefined }} variant="secondary" disabled={page >= history.data.totalPages} onPress={() => setPage(v => v + 1)} /></Row></>}</>}
  </Screen>;
}
