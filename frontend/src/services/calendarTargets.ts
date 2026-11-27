/** 공개 목록에서 실제 주제와 단계가 일치하는 일정 대상만 선택합니다. */
import type { Stage, Topic } from './learningApi.ts';
export interface CalendarTarget { topicId: string; stageId: string | null; conceptId: string | null; label: string }
export function selectCalendarStage(topicId: string, stageId: string, catalog: { topic: Topic; items: Stage[] } | null): CalendarTarget | null {
  if (!catalog || catalog.topic.topicId !== topicId) return null;
  const stage = catalog.items.find(item => item.stageId === stageId && item.topicId === topicId);
  return stage ? { topicId, stageId, conceptId: null, label: stage.title } : null;
}
