/** 서울 기준 월·일별 기록과 실제 학습 일정 CRUD를 연결합니다. 예시 단계 ID를 서버에 보내지 않습니다. */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/ui/Screen';
import { Body, Chip, Heading, Notice, Row } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import { HistoryRecords } from '../../components/ui/HistoryRecords';
import LerenButton from '../../components/common/LerenButton';
import LerenInput from '../../components/common/LerenInput';
import LerenCard from '../../components/common/LerenCard';
import { useBackend, useBackendAction } from '../../hooks/useBackend';
import { PATHS, monthDecoder, dayDecoder, historyDecoder, planDecoder, deletedDecoder, type Plan } from '../../services/backend';
import { COLORS } from '../../constants/theme';
const two = (v: number) => String(v).padStart(2, '0');
const seoulToday = () => { const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()); const get = (key: string) => parts.find(v => v.type === key)?.value; return `${get('year')}-${get('month')}-${get('day')}`; };
interface Target { topicId: string; stageId: string | null; conceptId: string | null; label: string }
interface Draft { id: string | null; date: string; goal: string; planType: 'NEW_LEARNING' | 'REVIEW'; target: Target | null }
export default function CalendarScreen() {
  const [date, setDate] = useState(seoulToday);
  const [month, setMonth] = useState(() => date.slice(0, 7));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [validation, setValidation] = useState('');
  const monthly = useBackend(`${PATHS.calendar}?month=${month}`, monthDecoder);
  const daily = useBackend(`${PATHS.calendar}/days/${date}`, dayDecoder);
  const history = useBackend(`${PATHS.history}?page=1&pageSize=100`, historyDecoder);
  const action = useBackendAction();
  const [year, monthNumber] = month.split('-').map(Number);
  const cells = useMemo(() => { const first = (new Date(year, monthNumber - 1, 1).getDay() + 6) % 7; const length = new Date(year, monthNumber, 0).getDate(); return Array.from({ length: Math.ceil((first + length) / 7) * 7 }, (_, i) => i >= first && i < first + length ? i - first + 1 : null); }, [year, monthNumber]);
  // 일정과 실제 학습 기록이 참조하는 서버 ID만 선택지로 사용합니다. 정식 목록 API 추가 전의 제한입니다.
  const targets: Target[] = [];
  const append = (t: Target) => { if (!targets.some(v => v.stageId === t.stageId && v.conceptId === t.conceptId)) targets.push(t); };
  for (const p of daily.data?.schedules ?? []) if (p.topic && (p.stageId || p.conceptId)) append({ topicId: p.topic.topicId, stageId: p.stageId, conceptId: p.conceptId, label: p.topic.title });
  for (const r of history.data?.items ?? []) if (r.topic && r.stage) append({ topicId: r.topic.topicId, stageId: r.stage.stageId, conceptId: null, label: r.stage.title });
  const refresh = () => { monthly.reload(); daily.reload(); history.reload(); };
  const move = (delta: number) => { const d = new Date(year, monthNumber - 1 + delta, 1); const m = `${d.getFullYear()}-${two(d.getMonth() + 1)}`; setMonth(m); setDate(`${m}-01`); setNotice(''); setConfirmDelete(null); };
  const edit = (p?: Plan) => { setNotice(''); setValidation(''); setDraft({ id: p?.planId ?? null, date: p?.scheduledDate ?? date, goal: p?.goal ?? '', planType: p?.planType === 'REVIEW' ? 'REVIEW' : 'NEW_LEARNING', target: p?.topic ? { topicId: p.topic.topicId, stageId: p.stageId, conceptId: p.conceptId, label: p.topic.title } : targets[0] ?? null }); };
  const save = async () => {
    if (!draft || action.busy) return;
    const goal = draft.goal.trim();
    if (!goal || [...goal].length > 30 || !/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) { setValidation('목표는 1~30자, 날짜는 YYYY-MM-DD로 입력해 주세요.'); return; }
    if (!draft.target) { setValidation('실제 학습 대상을 먼저 선택해 주세요.'); return; }
    const result = await action.run(draft.id ? `${PATHS.plans}/${draft.id}` : PATHS.plans, planDecoder, draft.id ? 'PATCH' : 'POST', { scheduledDate: draft.date, goal, planType: draft.planType, topicId: draft.target.topicId, stageId: draft.target.stageId, conceptId: draft.target.conceptId });
    if (result) { setDate(result.scheduledDate); setMonth(result.scheduledDate.slice(0, 7)); setDraft(null); refresh(); setNotice('일정 저장 API가 성공했습니다. 서버에서 다시 조회합니다.'); }
  };
  const remove = async (id: string) => { setNotice(''); const result = await action.run(`${PATHS.plans}/${id}`, deletedDecoder, 'DELETE'); if (result) { refresh(); setConfirmDelete(null); setNotice('서버에서 일정을 삭제했습니다.'); } };
  if (draft) return <Screen title={draft.id ? '학습 일정 수정' : '학습 일정 추가'} back tabs onBack={() => { if (!action.busy) setDraft(null); }}>
    <LerenInput label="학습 목표" value={draft.goal} onChangeText={goal => setDraft({ ...draft, goal })} hint="1~30자" />
    <LerenInput label="날짜" value={draft.date} onChangeText={value => setDraft({ ...draft, date: value })} placeholder="YYYY-MM-DD" />
    <Row><Chip label="새 학습" active={draft.planType === 'NEW_LEARNING'} onPress={() => setDraft({ ...draft, planType: 'NEW_LEARNING' })} /><Chip label="복습" active={draft.planType === 'REVIEW'} onPress={() => setDraft({ ...draft, planType: 'REVIEW' })} /></Row>
    <Heading>실제 학습 대상</Heading>{draft.target && <Body>선택: {draft.target.label}</Body>}{targets.map((t, i) => <LerenButton key={i} title={t.label} variant="secondary" onPress={() => setDraft({ ...draft, target: t })} />)}
    {!draft.target && <Notice>저장 API는 연결했으나 선택할 실제 학습 대상이 없습니다. 정식 학습 목록 API와 주제·단계 데이터가 준비되어야 새 일정을 저장할 수 있습니다.</Notice>}
    {!!validation && <Notice tone="error">{validation}</Notice>}{!!action.error && <Notice tone="error">저장 실패: {action.error}</Notice>}
    <LerenButton title="서버에 일정 저장" loading={action.busy} disabled={action.busy || !draft.target} onPress={save} /><LerenButton title="취소" variant="secondary" disabled={action.busy} onPress={() => setDraft(null)} />
    <Body muted>백엔드는 일정 시간을 받지 않습니다. 휴대폰 알림 발송은 별도 기능입니다.</Body>
  </Screen>;
  return <Screen title="학습 달력" back tabs>
    <ApiStatus resource={monthly} label="월별 달력" empty={monthly.data?.days.every(d => d.completedCount === 0 && d.scheduledCount === 0)} />
    {monthly.data && <Body>이번 달 학습 {monthly.data.completedDayCount}일 · 현재 연속 학습 {monthly.data.streakDays}일 (서울 기준)</Body>}
    <Heading>{year}년 {monthNumber}월</Heading><Row><LerenButton title="이전 달" style={{ flex: 1, width: undefined }} variant="secondary" onPress={() => move(-1)} /><LerenButton title="다음 달" style={{ flex: 1, width: undefined }} variant="secondary" onPress={() => move(1)} /></Row>
    <View style={s.grid}>{['월','화','수','목','금','토','일'].map(v => <Text key={v} style={s.day}>{v}</Text>)}{cells.map((d, i) => { const key = `${month}-${two(d ?? 1)}`; const summary = monthly.data?.days.find(v => v.date === key); return <View key={i} style={s.cell}>{d !== null && <Pressable accessibilityRole="button" accessibilityLabel={`${monthNumber}월 ${d}일`} accessibilityState={{ selected: date === key }} onPress={() => { setDate(key); setNotice(''); setConfirmDelete(null); }} style={[s.date, date === key && s.selected]}><Body>{d}</Body><Text>{summary?.hasCompletedLearning ? '●' : summary?.hasScheduledLearning ? '○' : ' '}</Text></Pressable>}</View>; })}</View>
    <Body muted>● 학습 완료 · ○ 예정 · 서울 기준 날짜</Body><Heading>{date}</Heading>
    <ApiStatus resource={daily} label="선택한 날짜" empty={daily.data?.learningRecords.length === 0 && daily.data?.schedules.length === 0} />
    {!!notice && <Notice tone="success">{notice}</Notice>}{!!action.error && <Notice tone="error">일정 변경 실패: {action.error}</Notice>}
    <HistoryRecords key={date} records={daily.data?.learningRecords ?? []} />
    {daily.data?.schedules.map(p => <LerenCard key={p.planId} title={p.goal} description={`${p.topic?.title ?? '학습 주제 없음'} · ${p.planType === 'REVIEW' ? '복습' : '새 학습'}`}><LerenButton title="일정 수정" variant="secondary" disabled={action.busy} onPress={() => edit(p)} />{confirmDelete === p.planId ? <><Notice>이 일정을 서버에서 삭제할까요?</Notice><LerenButton title="삭제 확인" loading={action.busy} disabled={action.busy} onPress={() => remove(p.planId)} /><LerenButton title="삭제 취소" variant="secondary" onPress={() => setConfirmDelete(null)} /></> : <LerenButton title="일정 삭제" variant="secondary" onPress={() => setConfirmDelete(p.planId)} />}</LerenCard>)}
    <LerenButton title="학습 일정 추가" onPress={() => edit()} />
    <ApiStatus resource={history} label="일정에 사용할 학습 대상" empty={targets.length === 0} />
    {targets.length === 0 && <Body muted>현재 조회한 기록·일정에는 선택 가능한 단계·개념이 없습니다. 학습 대상은 경제 탐험에서 확인할 수 있으며, 일정에서 전체 학습 대상을 선택하는 기능은 별도 연결이 필요합니다.</Body>}
  </Screen>;
}
const s = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap' }, day: { width: `${100 / 7}%`, textAlign: 'center', padding: 4 }, cell: { width: `${100 / 7}%`, minHeight: 54 }, date: { alignItems: 'center', paddingVertical: 5, borderRadius: 8 }, selected: { backgroundColor: COLORS.soft } });
