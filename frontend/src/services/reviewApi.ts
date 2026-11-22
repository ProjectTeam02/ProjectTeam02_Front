/** 복습 목록과 임무는 서버가 정합니다. 채점 전에는 정답이나 해설을 추론하지 않습니다. */
import { backendRequest, BackendError, object, str, num, bool, nullableStr, list } from './backend.ts';
import { isLearningId } from './learningApi.ts';

function id(v: unknown): string {
  if (!isLearningId(v)) throw new BackendError('복습 식별자를 확인할 수 없습니다.');
  return v;
}

export type ReviewFilter = 'ALL' | 'WRONG' | 'BOOKMARK';
export const REVIEW = {
  items: (source: ReviewFilter, page = 1, size = 10) =>
    `/api/v1/reviews/items?page=${page}&size=${size}${source === 'ALL' ? '' : '&source=' + source}`,
  due: '/api/v1/reviews/due',
  start: (missionId: string) => `/api/v1/reviews/missions/${id(missionId)}/attempts`,
  attempt: (attemptId: string) => `/api/v1/review-attempts/${id(attemptId)}`,
  answers: (attemptId: string) => `/api/v1/review-attempts/${id(attemptId)}/answers`,
  bookmark: (questionId: string) => `/api/v1/questions/${id(questionId)}/bookmark`,
};

function reviewItem(value: unknown) {
  const d = object(value), q = object(d.question);
  return {
    questionId: id(q.questionId), title: str(q.question), conceptCode: str(d.conceptCode),
    bookmarked: bool(d.isBookmarked), wrongCount: num(d.wrongCount),
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
    return { missionId: id(m.missionId), concept: nullableStr(m.conceptCode), dueDate: str(m.dueDate),
      status: str(m.status), count: num(m.targetQuestionCount) };
  });
}
export function reviewAttempt(value: unknown) {
  const d = object(value);
  return { attemptId: id(d.reviewAttemptId), status: str(d.status), count: num(d.questionCount),
    submitted: num(d.submittedCount), correct: num(d.correctCount),
    answers: list(d.answers, v => {
      const a = object(v);
      return { submissionId: id(a.submissionId), questionId: id(a.questionId), order: num(a.sequenceNo),
        choiceId: a.choiceId === null ? null : id(a.choiceId), isCorrect: a.isCorrect === null ? null : bool(a.isCorrect),
        explanation: nullableStr(a.explanation) };
    }).sort((a, b) => a.order - b.order),
  };
}
export type ReviewAttempt = ReturnType<typeof reviewAttempt>;
export const bookmarkResult = (v: unknown) => ({ bookmarked: bool(object(v).bookmarked) });

/** 응시 조회에는 식별자만 들어 있습니다. 모든 배정 문항을 찾거나 목록이 끝날 때까지 조회합니다. */
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
