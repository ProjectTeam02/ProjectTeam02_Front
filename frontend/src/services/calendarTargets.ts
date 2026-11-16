/** 달력에서 선택한 공개 단계와 주제를 같은 서버 응답의 일정 대상으로 변환합니다. */
import type { Stage, Topic } from './learningApi.ts';

export interface CalendarTarget {
  topicId: string;
  stageId: string | null;
  conceptId: string | null;
  label: string;
}

/** 늦게 도착한 다른 주제의 응답이나 목록에 없는 단계는 일정에 넣지 않습니다. */
export function selectCalendarStage(topicId: string, stageId: string, catalog: { topic: Topic; items: Stage[] } | null): CalendarTarget | null {
  if (!catalog || catalog.topic.topicId !== topicId) return null;
  const stage = catalog.items.find(item => item.stageId === stageId && item.topicId === topicId);
  return stage ? { topicId, stageId, conceptId: null, label: stage.title } : null;
}
