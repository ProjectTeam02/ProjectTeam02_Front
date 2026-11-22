/** 피그마 23-03, 23-05, 23-06: 학습 이력과 문항 상세 */
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Body, Heading, Row } from './Primitives';
import { ApiStatus } from './ApiStatus';
import LerenCard from '../common/LerenCard';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useBackend } from '../../hooks/useBackend';
import { PATHS, detailDecoder, type HistoryRecord } from '../../services/backend';

export function RecordDetail({ record }: { record: Pick<HistoryRecord, 'recordId' | 'recordType'> }) {
  const detail = useBackend(`${PATHS.history}/${encodeURIComponent(record.recordType)}/${encodeURIComponent(record.recordId)}`, detailDecoder);
  return <>
    <ApiStatus resource={detail} label="학습 상세" />
    {detail.data && <>
      <Heading>{detail.data.stage?.title ?? '학습 상세'}</Heading>
      <Body muted>{detail.data.learningDate ?? '날짜 없음'} · 정답 {detail.data.correctCount}/{detail.data.submittedCount}</Body>
      {detail.data.submissions.map((item, i) => <LerenCard key={item.submissionId}>
        <Text style={{ ...TYPOGRAPHY.small, color: COLORS.primary }}>문항 {i + 1}</Text>
        <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink }}>{item.questionText ?? '문제 본문 없음'}</Text>
        <View style={{ height: 1, backgroundColor: COLORS.line, marginVertical: 8 }} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Body muted>내가 선택한 답</Body>
          <Text style={{ ...TYPOGRAPHY.label, color: item.isCorrect ? COLORS.primary : COLORS.danger }}>{item.isCorrect ? '정답' : '오답'}</Text>
        </Row>
        <Body>{item.selectedAnswer ?? '선택한 답 없음'}</Body>
        <View style={{ backgroundColor: COLORS.soft, borderRadius: 10, padding: 12, gap: 5 }}>
          <Text style={{ ...TYPOGRAPHY.label, color: COLORS.primary }}>해설</Text>
          <Body>{item.explanation ?? '해설 데이터가 없습니다.'}</Body>
        </View>
      </LerenCard>)}
      {detail.data.submissions.length === 0 && <LerenCard title="문항 기록이 없어요" description="이 학습에 저장된 문항 상세가 없습니다." />}
    </>}
  </>;
}

export function HistoryRecords({ records }: { records: HistoryRecord[] }) {
  return <View style={{ borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, paddingHorizontal: 12 }}>
    {records.map((r, i) => <Pressable key={`${r.recordType}-${r.recordId}`} onPress={() => router.push({ pathname: '/learning-detail', params: { recordType: r.recordType, recordId: r.recordId } })}
      style={{ paddingVertical: 12, gap: 5, borderBottomWidth: i === records.length - 1 ? 0 : 1, borderBottomColor: COLORS.line }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>{r.learningDate ?? '날짜 없음'}</Text>
        <View style={{ backgroundColor: COLORS.soft, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 }}>
          <Text style={{ ...TYPOGRAPHY.micro, color: COLORS.primary }}>{r.status}</Text>
        </View>
      </Row>
      <Row>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink }}>{r.stage?.title ?? r.topic?.title ?? '학습 기록'}</Text>
          <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>정답 {r.correctCount}/{r.submittedCount}</Text>
        </View>
        <Text style={{ ...TYPOGRAPHY.heading, color: COLORS.muted }}>›</Text>
      </Row>
    </Pressable>)}
  </View>;
}