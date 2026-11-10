/** 정식 콘텐츠·일반 Stage 응시 계약입니다. 정답·진행도·보상은 서버 응답만 사용합니다. */
import { BackendError, backendRequest, object } from './backend.ts';

const invalid = (): never => { throw new BackendError('학습 API 응답 형식이 예상과 다릅니다.', 0, 'INVALID_LEARNING_RESPONSE'); };
const str = (v: unknown): string => typeof v === 'string' ? v : invalid();
const integer = (v: unknown): number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : invalid();
const nullable = (v: unknown): string | null => v === null ? null : str(v);
const bool = (v: unknown): boolean => typeof v === 'boolean' ? v : invalid();
const array = <T>(v: unknown, decode: (item: unknown) => T): T[] => Array.isArray(v) ? v.map(decode) : invalid();
const enumValue = <T extends string>(v: unknown, allowed: readonly T[]): T => typeof v === 'string' && allowed.includes(v as T) ? v as T : invalid();
export const isLearningId = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const id = (v: unknown): string => isLearningId(v) ? v : invalid();
function routeId(value: string): string {
  if (!isLearningId(value)) throw new BackendError('학습 대상을 목록에서 다시 선택해 주세요.', 0, 'INVALID_LEARNING_ID');
  return value;
}

export interface Topic { topicId: string; topicCode: string; topicNo: number; title: string; description: string | null }
export const topicDecoder = (value: unknown): Topic => {
  const d = object(value);
  return { topicId: id(d.topicId), topicCode: str(d.topicCode), topicNo: integer(d.topicNo), title: str(d.title), description: nullable(d.description) };
};
export const topicsDecoder = (value: unknown) => ({ items: array(object(value).items, topicDecoder) });
export interface Stage {
  stageId: string; topicId: string; stageCode: string; stageNo: number; stageType: 'NORMAL' | 'BOSS';
  title: string; description: string | null; progressStatus: string; isUnlocked: boolean;
}
export const stageDecoder = (value: unknown): Stage => {
  const d = object(value);
  return { stageId: id(d.stageId), topicId: id(d.topicId), stageCode: str(d.stageCode), stageNo: integer(d.stageNo),
    stageType: enumValue(d.stageType, ['NORMAL', 'BOSS']), title: str(d.title), description: nullable(d.description),
    progressStatus: enumValue(d.progressStatus, ['NOT_STARTED', 'IN_PROGRESS', 'PASSED']), isUnlocked: bool(d.isUnlocked) };
};
export const stagesDecoder = (value: unknown) => { const d = object(value); return { topic: topicDecoder(d.topic), items: array(d.items, stageDecoder) }; };
interface ConceptLink { conceptId: string; title: string; shortDefinition: string | null; summary: string | null }
export interface StageDetail extends Stage { maxQuestionCount: number; initialMonsterHp: number; concepts: ConceptLink[] }
export const stageDetailDecoder = (value: unknown): StageDetail => {
  const d = object(value);
  return { ...stageDecoder(d), maxQuestionCount: integer(d.maxQuestionCount), initialMonsterHp: integer(d.initialMonsterHp),
    concepts: array(d.concepts, item => { const c = object(item); return { conceptId: id(c.conceptId), title: str(c.title), shortDefinition: nullable(c.shortDefinition), summary: nullable(c.summary) }; }) };
};
export interface Concept {
  conceptId: string; topicId: string; title: string; shortDefinition: string | null; summary: string | null;
  cards: { sectionId: string; pageNo: number; sortOrder: number; title: string | null; body: string; sectionType: string }[];
}
export const conceptDecoder = (value: unknown): Concept => {
  const d = object(value);
  const cards = array(d.cards, item => { const c = object(item); return { sectionId: id(c.sectionId), pageNo: integer(c.pageNo), sortOrder: integer(c.sortOrder), title: nullable(c.title), body: str(c.body), sectionType: str(c.sectionType) }; });
  return { conceptId: id(d.conceptId), topicId: id(d.topicId), title: str(d.title), shortDefinition: nullable(d.shortDefinition), summary: nullable(d.summary),
    cards: cards.sort((a, b) => a.pageNo - b.pageNo || a.sortOrder - b.sortOrder) };
};
export interface Question { id: string; title: string; conceptId: string | null; choices: { id: string; content: string }[] }
export const questionDecoder = (value: unknown): Question => {
  const d = object(value);
  const choices = array(d.choices, item => { const c = object(item); return { id: id(c.id), content: str(c.content) }; });
  if (choices.length !== 4 || new Set(choices.map(c => c.id)).size !== 4) invalid();
  // 응답에 해설이나 정답 필드가 섞여도 화면용 문제 모델에는 가져오지 않습니다.
  return { id: id(d.id), title: str(d.title), conceptId: d.conceptId === null ? null : id(d.conceptId), choices };
};
export type AttemptStatus = 'IN_PROGRESS' | 'PASSED' | 'FAILED';
export interface AttemptSummary {
  attemptId: string; stageId: string; status: AttemptStatus; attemptNo: number;
  maxQuestionCount: number; submittedCount: number; correctCount: number; hp: number; rewardGranted: boolean;
}
export const attemptSummaryDecoder = (value: unknown): AttemptSummary => {
  const d = object(value);
  const result = { attemptId: id(d.attemptId), stageId: id(d.stageId), status: enumValue(d.status, ['IN_PROGRESS', 'PASSED', 'FAILED']),
    attemptNo: integer(d.attemptNo), maxQuestionCount: integer(d.maxQuestionCount), submittedCount: integer(d.submittedCount),
    correctCount: integer(d.correctCount), hp: integer(d.hp), rewardGranted: bool(d.rewardGranted) };
  if (!result.maxQuestionCount || result.submittedCount > result.maxQuestionCount || result.correctCount > result.submittedCount) invalid();
  return result;
};
export interface Attempt extends AttemptSummary { currentQuestion: Question | null }
export const attemptDecoder = (value: unknown): Attempt => {
  const d = object(value), summary = attemptSummaryDecoder(d);
  const currentQuestion = d.currentQuestion === null ? null : questionDecoder(d.currentQuestion);
  if ((summary.status === 'IN_PROGRESS') !== (currentQuestion !== null)) invalid();
  return { ...summary, currentQuestion };
};
export const resultDecoder = (value: unknown): AttemptSummary => {
  const result = attemptSummaryDecoder(value);
  if (result.status === 'IN_PROGRESS') invalid();
  return result;
};
export interface Submission {
  attemptId: string; quizId: string; choiceId: string; isCorrect: boolean; explanation: string | null;
  hpBefore: number; hpAfter: number; submittedCount: number; correctCount: number; status: AttemptStatus; rewardGranted: boolean;
}
export const submissionDecoder = (value: unknown): Submission => {
  const d = object(value);
  return { attemptId: id(d.attemptId), quizId: id(d.quizId), choiceId: id(d.choiceId), isCorrect: bool(d.isCorrect), explanation: nullable(d.explanation),
    hpBefore: integer(d.hpBefore), hpAfter: integer(d.hpAfter), submittedCount: integer(d.submittedCount), correctCount: integer(d.correctCount),
    status: enumValue(d.status, ['IN_PROGRESS', 'PASSED', 'FAILED']), rewardGranted: bool(d.rewardGranted) };
};

export const LEARNING_PATHS = {
  topics: '/api/v1/topics',
  stages: (topicId: string) => `/api/v1/topics/${routeId(topicId)}/stages`,
  stage: (stageId: string) => `/api/v1/stages/${routeId(stageId)}`,
  concept: (conceptId: string) => `/api/v1/concepts/${routeId(conceptId)}`,
  start: (stageId: string) => `/api/v1/quizzes/stages/${routeId(stageId)}/attempts`,
  attempt: (attemptId: string) => `/api/v1/quizzes/attempts/${routeId(attemptId)}`,
  result: (attemptId: string) => `/api/v1/quizzes/attempts/${routeId(attemptId)}/result`,
  submit: (questionId: string) => `/api/v1/quizzes/${routeId(questionId)}/submit`,
};

/** 같은 응시·문항에는 항상 같은 키를 사용해 응답 유실 후 재시도도 한 번만 저장되게 합니다. */
export function submissionKey(attemptId: string, questionId: string): string {
  return `learning:${routeId(attemptId)}:${routeId(questionId)}`;
}
export const fetchTopics = (token: string, signal?: AbortSignal) => backendRequest(token, LEARNING_PATHS.topics, topicsDecoder, { signal });
export const startAttempt = (token: string, stageId: string) => backendRequest(token, LEARNING_PATHS.start(stageId), attemptDecoder, { method: 'POST' });
export const fetchAttempt = (token: string, attemptId: string) => backendRequest(token, LEARNING_PATHS.attempt(attemptId), attemptDecoder);
export const fetchResult = (token: string, attemptId: string) => backendRequest(token, LEARNING_PATHS.result(attemptId), resultDecoder);
export const submitLearningAnswer = (token: string, attemptId: string, questionId: string, choiceId: string) => backendRequest(token,
  LEARNING_PATHS.submit(questionId), submissionDecoder, { method: 'POST', body: { attemptId: routeId(attemptId), choiceId: routeId(choiceId) }, idempotencyKey: submissionKey(attemptId, questionId) });
