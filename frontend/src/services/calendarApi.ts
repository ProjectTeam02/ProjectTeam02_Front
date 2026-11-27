/** 캘린더 전용 확장 디코더. 기존 공통 backend.ts 및 다른 화면의 응답 계약은 변경하지 않습니다. */
import { object, str, num, list, recordDecoder, planDecoder, type HistoryRecord, type Plan } from './backend.ts';
export interface CalendarRecord extends HistoryRecord { completedAt: string | null; startedAt: string | null; endedAt: string | null; elapsedSeconds: number | null }
export interface CalendarPlan extends Plan { stage: { stageId: string; title: string } | null; concept: { conceptId: string; title: string } | null }
const optionalString = (v: unknown) => v == null ? null : str(v);
export function calendarRecordDecoder(v: unknown): CalendarRecord {
  const d = object(v);
  return { ...recordDecoder(v), completedAt: optionalString(d.completedAt), startedAt: optionalString(d.startedAt), endedAt: optionalString(d.endedAt), elapsedSeconds: d.elapsedSeconds == null ? null : num(d.elapsedSeconds) };
}
export function calendarPlanDecoder(v: unknown): CalendarPlan {
  const d = object(v), stage = d.stage == null ? null : object(d.stage), concept = d.concept == null ? null : object(d.concept);
  return { ...planDecoder(v), stage: stage ? { stageId: str(stage.stageId), title: str(stage.title) } : null, concept: concept ? { conceptId: str(concept.conceptId), title: str(concept.title) } : null };
}
export function calendarDayDecoder(v: unknown) {
  const d = object(v);
  return { date: str(d.date), learningRecords: list(d.learningRecords, calendarRecordDecoder), schedules: list(d.schedules, calendarPlanDecoder) };
}
export type CalendarDay = ReturnType<typeof calendarDayDecoder>;
