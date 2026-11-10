/** 실제 응시 기록과 문항 상세를 조회합니다. 목록이 없어도 성공/빈 상태를 별도로 안내합니다. */
import { useState } from 'react';
import { Body, LinkRow } from './Primitives';
import { ApiStatus } from './ApiStatus';
import LerenCard from '../common/LerenCard';
import LerenButton from '../common/LerenButton';
import { useBackend } from '../../hooks/useBackend';
import { PATHS, detailDecoder, type HistoryRecord } from '../../services/backend';
export function RecordDetail({ record }: { record: HistoryRecord }) {
  const detail = useBackend(`${PATHS.history}/${encodeURIComponent(record.recordType)}/${encodeURIComponent(record.recordId)}`, detailDecoder);
  return <><ApiStatus resource={detail} label="학습 상세" empty={detail.data?.submissions.length === 0} />{detail.data?.submissions.map(s => <LerenCard key={s.submissionId} title={s.questionText ?? '문제 본문 없음'} description={`선택한 답: ${s.selectedAnswer ?? '없음'} · ${s.isCorrect ? '정답' : '오답'}\n${s.explanation ?? '해설 데이터 없음'}`} />)}</>;
}
export function HistoryRecords({ records }: { records: HistoryRecord[] }) {
  const [selected, setSelected] = useState<HistoryRecord | null>(null);
  return <>{records.map(r => <LinkRow key={r.recordId} title={r.stage?.title ?? '학습 단계 정보 없음'} subtitle={`${r.learningDate ?? '날짜 없음'} · ${r.status} · 정답 ${r.correctCount}/${r.submittedCount}`} onPress={() => setSelected(selected?.recordId === r.recordId ? null : r)} />)}
    {selected && <LerenCard title="선택한 학습 이력"><Body>{selected.stage?.title ?? '단계 정보 없음'}</Body><RecordDetail key={selected.recordId} record={selected} /><LerenButton title="상세 닫기" variant="secondary" onPress={() => setSelected(null)} /></LerenCard>}
  </>;
}
