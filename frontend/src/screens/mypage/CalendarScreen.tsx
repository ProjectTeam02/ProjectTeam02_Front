/**
 * 피그마 21번 학습 달력입니다. 월 이동, 날짜 선택, 일정 추가·수정·삭제를 처리합니다.
 * 기록 조회 API는 미연결이며, 일정 변경은 공통 메모리 상태에만 반영합니다.
 */
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LerenButton from '../../components/common/LerenButton';
import LerenInput from '../../components/common/LerenInput';
import LerenCard from '../../components/common/LerenCard';
import Screen from '../../components/ui/Screen';
import { Body, Heading, LinkRow, Row, Notice } from '../../components/ui/Primitives';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useLearningProgress } from '../../context/LearningProgressContext';

interface ScheduleDraft { id: string; date: string; title: string; time: string }
const two = (value: number) => String(value).padStart(2, '0');

// 잘못된 날짜(예: 2월 31일)가 자동 보정되어 저장되는 것을 막습니다.
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

export default function CalendarScreen() {
  const { schedules, upsertSchedule, deleteSchedule } = useLearningProgress();
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => `${today.getFullYear()}-${two(today.getMonth() + 1)}-${two(today.getDate())}`);
  const [draft, setDraft] = useState<ScheduleDraft | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const nextScheduleNumber = useRef(1);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const monthKey = `${year}-${two(monthIndex + 1)}`;
  const selectedSchedules = schedules.filter(item => item.date === selectedDate);
  const monthSchedules = schedules.filter(item => item.date.startsWith(monthKey));
  const [selectedYear, selectedMonth, selectedDay] = selectedDate.split('-').map(Number);
  const cells = useMemo(() => {
    const leading = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    const count = new Date(year, monthIndex + 1, 0).getDate();
    const total = Math.ceil((leading + count) / 7) * 7;
    return Array.from({ length: total }, (_, index) => index >= leading && index < leading + count ? index - leading + 1 : null);
  }, [year, monthIndex]);

  // 월 이동 시 이전 달의 선택을 유지하지 않고 새 달의 첫날로 이동합니다.
  const moveMonth = (delta: number) => {
    const next = new Date(year, monthIndex + delta, 1);
    setMonth(next);
    setSelectedDate(`${next.getFullYear()}-${two(next.getMonth() + 1)}-01`);
    setMessage('');
  };
  const openDraft = (value?: ScheduleDraft) => {
    // 화면을 다시 열어도 기존 메모리 일정과 식별자가 겹치지 않도록 빈 번호를 찾습니다.
    while (schedules.some(item => item.id === `local-schedule-${nextScheduleNumber.current}`)) nextScheduleNumber.current += 1;
    const id = `local-schedule-${nextScheduleNumber.current}`;
    nextScheduleNumber.current += 1;
    setDraft(value ? { ...value } : { id, date: selectedDate, title: '', time: '20:00' });
    setError('');
    setDeleteConfirm(false);
  };
  const save = () => {
    if (!draft) return;
    if (!draft.title.trim() || !validDate(draft.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) {
      setError('제목, 날짜(YYYY-MM-DD), 시간(HH:mm)을 확인해 주세요.');
      return;
    }
    upsertSchedule({ ...draft, title: draft.title.trim() });
    const [newYear, newMonth] = draft.date.split('-').map(Number);
    setMonth(new Date(newYear, newMonth - 1, 1));
    setSelectedDate(draft.date);
    setDraft(null);
    setMessage('학습 일정을 저장했어요.');
  };

  if (draft) {
    const editing = schedules.some(item => item.id === draft.id);
    return (
      <Screen title={editing ? '학습 일정 수정' : '학습 일정 추가'} back tabs onBack={() => setDraft(null)}>
        <LerenCard title="작은 학습 계획을 세워요" description="꾸준히 이어갈 수 있는 나만의 일정을 정해 보세요." variant="info" />
        <LerenInput label="학습 제목" value={draft.title} placeholder="예: 오늘의 학습 복습" onChangeText={title => setDraft({ ...draft, title })} />
        <LerenInput label="날짜" value={draft.date} placeholder="YYYY-MM-DD" onChangeText={date => setDraft({ ...draft, date })} />
        <LerenInput label="시간" value={draft.time} placeholder="20:00" onChangeText={time => setDraft({ ...draft, time })} />
        {!!error && <Notice tone="error">{error}</Notice>}
        <LerenButton title="일정 저장" onPress={save} />
        <LerenButton title="취소" variant="secondary" onPress={() => setDraft(null)} />
        {editing && (deleteConfirm ? (
          <LerenCard title="학습 일정을 삭제할까요?" description="선택한 일정이 달력에서 사라져요.">
            <LerenButton title="일정 삭제" onPress={() => { deleteSchedule(draft.id); setDraft(null); setMessage('일정을 삭제했어요.'); }} />
            <LerenButton title="유지하기" variant="secondary" onPress={() => setDeleteConfirm(false)} />
          </LerenCard>
        ) : <LerenButton title="일정 삭제" variant="secondary" onPress={() => setDeleteConfirm(true)} />)}
        <Body muted>일정은 화면 미리보기용으로 저장되며, 휴대폰 알림은 발송되지 않아요.</Body>
      </Screen>
    );
  }

  return (
    <Screen title="학습 달력" back tabs>
      <Row>
        <View style={styles.summary}><Text style={styles.value}>{'—'}일</Text><Text style={styles.micro}>이번 달 학습</Text></View>
        <View style={styles.summary}><Text style={styles.value}>{'—'}일</Text><Text style={styles.micro}>연속 학습</Text></View>
      </Row>
      <LerenCard style={styles.calendar}>
        <View style={styles.monthHeader}>
          <Heading>{year}년 {monthIndex + 1}월</Heading>
          <View style={styles.monthActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="이전 달" onPress={() => moveMonth(-1)} style={styles.monthArrow}><Text style={styles.arrow}>‹</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="다음 달" onPress={() => moveMonth(1)} style={styles.monthArrow}><Text style={styles.arrow}>›</Text></Pressable>
          </View>
        </View>
        <View style={styles.grid}>{['월', '화', '수', '목', '금', '토', '일'].map(day => <Text key={day} style={styles.weekday}>{day}</Text>)}</View>
        <View style={styles.grid}>
          {cells.map((day, index) => {
            const date = `${monthKey}-${two(day ?? 1)}`;
            // 학습 이력 API가 연결되기 전에는 완료 표시를 임의로 만들지 않습니다.
            const complete = false;
            const scheduled = monthSchedules.some(item => item.date === date);
            return <View key={index} style={styles.cellSlot}>{day !== null && <Pressable accessibilityRole="button" accessibilityLabel={`${monthIndex + 1}월 ${day}일${complete ? ', 학습 완료' : ''}${scheduled ? ', 학습 예정' : ''}`} accessibilityState={{ selected: selectedDate === date }} onPress={() => { setSelectedDate(date); setMessage(''); }} style={[styles.cell, selectedDate === date && styles.selected]}><Text style={[styles.day, selectedDate === date && styles.primary]}>{day}</Text><Text style={[styles.dot, complete && styles.complete]}>{complete ? '●' : scheduled ? '○' : ' '}</Text></Pressable>}</View>;
          })}
        </View>
        <Text style={styles.legend}>● 학습 완료     ○ 학습 예정</Text>
      </LerenCard>
      {!!message && <Notice tone="success">{message}</Notice>}
      <Body muted>학습 이력 연결을 준비하고 있어요.</Body>
      {selectedSchedules.map(item => <LinkRow key={item.id} title={`${selectedMonth}월 ${selectedDay}일 · 예정 학습`} subtitle={`${item.title} · ${item.time}`} onPress={() => openDraft(item)} />)}
      {selectedSchedules.length === 0 && <LerenCard title={`${selectedYear}년 ${selectedMonth}월 ${selectedDay}일`} description="아직 학습 기록이나 예정된 일정이 없어요." />}
      <LerenButton title="학습 일정 추가" onPress={() => openDraft()} />
      <Body muted>완료한 날과 예정된 날을 함께 확인할 수 있어요.</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flex: 1, backgroundColor: COLORS.soft, padding: 12, borderRadius: 12, gap: 6 },
  value: { ...TYPOGRAPHY.heading, color: COLORS.primary },
  micro: { ...TYPOGRAPHY.micro, color: COLORS.muted },
  calendar: { padding: 12, gap: 8 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthActions: { flexDirection: 'row' },
  monthArrow: { minWidth: 34, minHeight: 36, justifyContent: 'center', alignItems: 'center' },
  arrow: { ...TYPOGRAPHY.heading, color: COLORS.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', ...TYPOGRAPHY.small, color: COLORS.muted, paddingVertical: 6 },
  cellSlot: { width: `${100 / 7}%`, minHeight: 52, padding: 1 },
  cell: { paddingVertical: 4, alignItems: 'center', borderRadius: 12, gap: 2, minHeight: 44 },
  selected: { backgroundColor: COLORS.soft },
  day: { ...TYPOGRAPHY.small, color: COLORS.ink },
  primary: { color: COLORS.primary },
  dot: { ...TYPOGRAPHY.micro, color: COLORS.primary },
  complete: { color: COLORS.success },
  legend: { ...TYPOGRAPHY.micro, color: COLORS.muted, paddingTop: 4 },
});
