/** 실제 응시 기록과 문항 상세를 조회합니다. 목록이 없어도 성공/빈 상태를 별도로 안내합니다. */
import { router } from 'expo-router';
import { Heading, LinkRow } from './Primitives';
import { ApiStatus } from './ApiStatus';
import LerenCard from '../common/LerenCard';

import { useBackend } from '../../hooks/useBackend';
import { PATHS, detailDecoder, type HistoryRecord } from '../../services/backend';
export function RecordDetail({ record }: { record: Pick<HistoryRecord, 'recordId' | 'recordType'> }) {
  const detail = useBackend(`${PATHS.history}/${encodeURIComponent(record.recordType)}/${encodeURIComponent(record.recordId)}`, detailDecoder);
  return <><ApiStatus resource={detail} label="학습 상세" empty={detail.data?.submissions.length === 0} />{detail.data && <Heading>{detail.data.stage?.title ?? '학습 상세'} · 정답 {detail.data.correctCount}/{detail.data.submittedCount}</Heading>}{detail.data?.submissions.map(s => <LerenCard key={s.submissionId} title={s.questionText ?? '문제 본문 없음'} description={`선택한 답: ${s.selectedAnswer ?? '없음'} · ${s.isCorrect ? '정답' : '오답'}\n${s.explanation ?? '해설 데이터 없음'}`} />)}</>;
}
export function HistoryRecords({ records }: { records: HistoryRecord[] }) {

  return <>{records.map(r => <LinkRow key={r.recordId} title={r.stage?.title ?? '학습 단계 정보 없음'} subtitle={`${r.learningDate ?? '날짜 없음'} · ${r.status} · 정답 ${r.correctCount}/${r.submittedCount}`} onPress={() => router.push({ pathname: '/learning-detail', params: { recordType: r.recordType, recordId: r.recordId } })} />)}</>;
}
