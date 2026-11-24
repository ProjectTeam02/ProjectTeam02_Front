/** 복습 노트/임무 API: 서버 응답만으로 정답·오답을 판정합니다. */
import { backendRequest, BackendError, object, str, num, bool, nullableStr, list } from './backend.ts';
import { isLearningId } from './learningApi.ts';

function id(v: unknown): string {
  if (!isLearningId(v)) throw new BackendError('복습 식별자를 확인할 수 없습니다.');
  return v;
}
const optionalId = (v: unknown): string | null => v == null ? null : id(v);

export type ReviewFilter = 'ALL' | 'WRONG' | 'BOOKMARK';
export const REVIEW = {
  items: (source: ReviewFilter, page = 1, size = 10) =>
    `/api/v1/reviews/items?page=${page}&size=${size}${source === 'ALL' ? '' : '&source=' + source}`,
  due: '/api/v1/reviews/due',
  /** 복습 노트의 오답/헷갈림 문제 중 최대 5문항을 서버가 선정합니다. */
  recommendedStart: '/api/v1/reviews/attempts',
  start: (missionId: string) => `/api/v1/reviews/missions/${id(missionId)}/attempts`,
  attempt: (attemptId: string) => `/api/v1/review-attempts/${id(attemptId)}`,
  answers: (attemptId: string) => `/api/v1/review-attempts/${id(attemptId)}/answers`,
  bookmark: (questionId: string) => `/api/v1/questions/${id(questionId)}/bookmark`,
};

function reviewItem(value: unknown) {
  const d = object(value), q = object(d.question);
  return {
    questionId: id(q.questionId),
    title: str(q.question),
    conceptId: optionalId(q.conceptId),
    conceptCode: str(d.conceptCode),
    sourceStageId: optionalId(d.sourceStageId),
    firstReason: str(d.firstReason),
    bookmarked: bool(d.isBookmarked),
    wrongCount: num(d.wrongCount),
    choices: list(q.choices, v => {
      const c = object(v);
      return { id: id(c.choiceId), content: str(c.content) };
    }),
  };
}
export type ReviewItem = ReturnType<typeof reviewItem>;

export function reviewPage(value: unknown) {
  const d = object(value);
  return { items: list(d.items, reviewItem), total: num(d.total), size: num(d.size), page: num(d.page) };
}

export function dueMissions(value: unknown) {
  return list(object(value).items, v => {
    const m = object(v);
    return {
      missionId: id(m.missionId),
      concept: nullableStr(m.conceptCode),
      dueDate: str(m.dueDate),
      status: str(m.status),
      count: num(m.targetQuestionCount),
    };
  });
}

export function reviewAttempt(value: unknown) {
  const d = object(value);
  return {
    attemptId: id(d.reviewAttemptId),
    status: str(d.status),
    count: num(d.questionCount),
    submitted: num(d.submittedCount),
    correct: num(d.correctCount),
    answers: list(d.answers, v => {
      const a = object(v);
      return {
        submissionId: id(a.submissionId),
        questionId: id(a.questionId),
        order: num(a.sequenceNo),
        choiceId: optionalId(a.choiceId),
        isCorrect: a.isCorrect === null ? null : bool(a.isCorrect),
        explanation: nullableStr(a.explanation),
      };
    }).sort((a, b) => a.order - b.order),
  };
}
export type ReviewAttempt = ReturnType<typeof reviewAttempt>;
export const bookmarkResult = (v: unknown) => ({ bookmarked: bool(object(v).bookmarked) });

/** 서버 전체 복습 아이템을 읽어서 오답/헷갈림 합집합과 중복 개수를 정확히 계산합니다.
 * API는 최대 size=100이며, 다음 페이지가 있으면 이어서 조회합니다.
 * 오답도 아니고 북마크도 아닌 이력은 복습 노트에서 제외합니다.
 */
export async function loadNotebookItems(token: string, signal: AbortSignal): Promise<ReviewItem[]> {
  const collected: ReviewItem[] = [];
  let page = 1;
  while (true) {
    const batch = await backendRequest(token, REVIEW.items('ALL', page, 100), reviewPage, { signal });
    collected.push(...batch.items);
    if (batch.items.length === 0 || page * batch.size >= batch.total) break;
    page += 1;
  }
  return collected.filter(item => item.wrongCount > 0 || item.bookmarked);
}

/** 응시 API는 문항 ID만 포함하므로, 해당 ID의 복습 문제를 서버 목록에서 찾아옵니다. */
export async function loadAttemptItems(token: string, questionIds: string[], signal: AbortSignal) {
  const missing = new Set(questionIds);
  const found: Record<string, ReviewItem> = {};
  for (let page = 1; missing.size; page++) {
    const batch = await backendRequest(token, REVIEW.items('ALL', page, 100), reviewPage, { signal });
    for (const item of batch.items) {
      if (missing.delete(item.questionId)) found[item.questionId] = item;
    }
    if (!batch.items.length || page * batch.size >= batch.total) break;
  }
  return found;
}
