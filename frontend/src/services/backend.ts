/** 실제 백엔드 계약과 인증 요청을 모읍니다. 실패·깨진 응답을 빈 데이터로 바꾸지 않습니다. */
import { getAuthenticatedApiBaseUrl } from './apiConfig.ts';
import { assertAiRequestAllowed } from './aiRequestPolicy.ts';

export class BackendError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, status = 0, code = '') { super(message); this.name = 'BackendError'; this.status = status; this.code = code; }
}
type Obj = Record<string, unknown>;
export type Decoder<T> = (data: unknown) => T;
const bad = (): never => { throw new BackendError('서버 응답 형식이 예상과 다릅니다. 빈 데이터로 처리하지 않았습니다.', 0, 'INVALID_RESPONSE'); };
export const object = (v: unknown): Obj => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Obj : bad();
const str = (v: unknown): string => typeof v === 'string' ? v : bad();
const num = (v: unknown): number => typeof v === 'number' && Number.isFinite(v) ? v : bad();
const bool = (v: unknown): boolean => typeof v === 'boolean' ? v : bad();
const nullableNum = (v: unknown): number | null => v === null ? null : num(v);
const nullableStr = (v: unknown): string | null => v === null ? null : str(v);
const list = <T>(v: unknown, decode: Decoder<T>): T[] => Array.isArray(v) ? v.map(decode) : bad();
const titleRef = (v: unknown): (Obj & { title: string }) | null => v === null ? null : { ...object(v), title: str(object(v).title) };

/** 타임아웃·화면 이탈을 취소하며, 인증 요청을 다른 주소로 자동 재전송하지 않습니다. */
export async function backendRequest<T>(token: string, path: string, decode: Decoder<T>, options: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; signal?: AbortSignal; idempotencyKey?: string } = {}): Promise<T> {
  // 연결 확인 중에는 UI를 우회해도 유료 생성 요청을 네트워크 전송 전에 막습니다.
  assertAiRequestAllowed(path, options.method ?? 'GET');
  const origin = getAuthenticatedApiBaseUrl();
  if (!token) throw new BackendError('로그인이 필요합니다.', 401);
  if (!path.startsWith('/api/v1/') || path.includes('://')) throw new BackendError('허용되지 않은 API 경로입니다.');
  // 퀴즈의 동일 답안 재시도에만 쓰는 키이며 인증 토큰과 분리합니다.
  if (options.idempotencyKey !== undefined && (!options.idempotencyKey || options.idempotencyKey.length > 200 || /[\r\n]/.test(options.idempotencyKey))) throw new BackendError('답안 중복 방지 키가 올바르지 않습니다.');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  options.signal?.addEventListener('abort', cancel, { once: true });
  if (options.signal?.aborted) controller.abort();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
  try {
    const response = await fetch(`${origin}${path}`, { method: options.method ?? 'GET', redirect: 'error', signal: controller.signal,
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {}) },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}) });
    if (!response.headers.get('content-type')?.includes('application/json')) throw new BackendError(`JSON 응답이 아닙니다. 서버 주소를 확인해 주세요. (HTTP ${response.status})`, response.status);
    let payload: Obj;
    try { payload = object(await response.json()); } catch { throw new BackendError('서버 응답을 읽을 수 없습니다.', response.status); }
    if (response.ok && path === '/api/v1/health/dependencies') return decode(payload);
    if (!response.ok || payload.success !== true) {
      const code = typeof payload.code === 'string' ? payload.code : '';
      // 이 서비스가 정의한 정확한 404만 데이터 없음으로 판별합니다. 다른 404는 요청 실패입니다.
      if (response.status === 404 && code === 'NOT_FOUND' && payload.message === '승인된 문제가 없습니다.') throw new BackendError('승인된 문제가 없습니다.', 404, 'NO_APPROVED_QUESTION');
      // 데이터 자체가 없는 404와 배포 서버에 API 경로가 없는 응답을 구분합니다.
      if ((response.status === 404 && code === 'NOT_FOUND' && payload.message === '요청한 API를 찾을 수 없습니다.') || response.status === 501) {
        throw new BackendError(`배포된 서버에 이 API가 아직 연결되지 않았습니다. (HTTP ${response.status})`, response.status, 'API_NOT_CONNECTED');
      }
      const detail = response.status === 401 ? '로그인이 만료되었거나 유효하지 않습니다. 다시 로그인해 주세요.'
        : response.status === 403 ? '이 데이터에 접근할 권한이 없습니다.'
        : response.status === 429 ? '요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.'
        : response.status === 422 ? '입력값 또는 학습 대상이 서버의 조건과 맞지 않습니다.'
        : response.status === 409 ? '이미 처리 중이거나 변경 내용이 충돌합니다. 목록을 다시 확인해 주세요.'
        : response.status >= 500 ? '백엔드 또는 연결된 DB·AI 서비스를 사용할 수 없습니다.'
        : '요청한 데이터를 가져오지 못했습니다.';
      const learningPath = /^\/api\/v1\/(topics|stages|concepts|quizzes)(\/|$)/.test(path);
      const serverMessage = learningPath && [403, 404, 409, 422, 503].includes(response.status) && typeof payload.message === 'string' && payload.message.length <= 300 ? ` 서버 안내: ${payload.message}` : '';
      throw new BackendError(`${detail}${serverMessage} (HTTP ${response.status})`, response.status, code);
    }
    return decode(payload.data);
  } catch (error) {
    if (options.signal?.aborted) throw error;
    if (timedOut) throw new BackendError('서버 응답 시간이 초과되었습니다. 저장 요청이었다면 목록을 확인한 뒤 다시 시도해 주세요.', 0, 'TIMEOUT');
    if (error instanceof BackendError) throw error;
    throw new BackendError('서버에 연결하지 못했습니다. 백엔드 실행 상태와 주소·CORS를 확인해 주세요.', 0, 'NETWORK_ERROR');
  } finally { clearTimeout(timer); options.signal?.removeEventListener('abort', cancel); }
}

export interface Member { userId: string; nickname: string; email: string | null; level: number | null; totalExp: number | null; economyLevel: number | null; economyExp: number | null; coinBalance: number | null; completedStageCount: number; characterClass: { name: string; classCode: string } | null; equippedCostumes: { itemId: string; name: string | null }[] }
export const memberDecoder: Decoder<Member> = data => {
  const d = object(data);
  return { userId: str(d.userId), nickname: str(d.nickname), email: d.email == null ? null : str(d.email), level: nullableNum(d.level), totalExp: nullableNum(d.totalExp), economyLevel: nullableNum(d.economyLevel), economyExp: nullableNum(d.economyExp), coinBalance: nullableNum(d.coinBalance), completedStageCount: num(d.completedStageCount),
    characterClass: d.characterClass === null ? null : { name: str(object(d.characterClass).name), classCode: str(object(d.characterClass).classCode) },
    equippedCostumes: list(d.equippedCostumes, v => ({ itemId: str(object(v).itemId), name: nullableStr(object(v).name) })) };
};
export interface HistoryRecord { recordType: string; recordId: string; status: string; learningDate: string | null; stage: { title: string; stageId: string } | null; topic: { title: string; topicId: string } | null; submittedCount: number; correctCount: number; accuracyPercentage: number | null }
export const recordDecoder: Decoder<HistoryRecord> = v => { const d = object(v); const stage = titleRef(d.stage); const topic = titleRef(d.topic); return { recordType: str(d.recordType), recordId: str(d.recordId), status: str(d.status), learningDate: nullableStr(d.learningDate), stage: stage ? { title: stage.title, stageId: str(stage.stageId) } : null, topic: topic ? { title: topic.title, topicId: str(topic.topicId) } : null, submittedCount: num(d.submittedCount), correctCount: num(d.correctCount), accuracyPercentage: nullableNum(d.accuracyPercentage) }; };
export const historyDecoder = (v: unknown) => { const d = object(v); return { items: list(d.items, recordDecoder), page: num(d.page), total: num(d.total), totalPages: num(d.totalPages) }; };
export const detailDecoder = (v: unknown) => { const d = object(v); return { ...recordDecoder(v), submissions: list(d.submissions, value => { const s = object(value); return { submissionId: str(s.submissionId), questionText: s.question === null ? null : nullableStr(object(s.question).questionText), selectedAnswer: nullableStr(object(s.selectedAnswer).choiceText), isCorrect: bool(s.isCorrect), explanation: nullableStr(s.explanation) }; }) }; };
export interface Plan { planId: string; scheduledDate: string; goal: string; planType: string; topic: { topicId: string; title: string } | null; stageId: string | null; conceptId: string | null }
export const planDecoder: Decoder<Plan> = v => { const d = object(v); const topic = titleRef(d.topic); return { planId: str(d.planId), scheduledDate: str(d.scheduledDate), goal: str(d.goal), planType: str(d.planType), topic: topic ? { topicId: str(topic.topicId), title: topic.title } : null, stageId: nullableStr(d.stageId), conceptId: nullableStr(d.conceptId) }; };
export const dayDecoder = (v: unknown) => { const d = object(v); return { date: str(d.date), learningRecords: list(d.learningRecords, recordDecoder), schedules: list(d.schedules, planDecoder) }; };
export const monthDecoder = (v: unknown) => { const d = object(v); return { completedDayCount: num(d.completedDayCount), streakDays: num(d.streakDays), days: list(d.days, value => { const x = object(value); return { date: str(x.date), completedCount: num(x.completedCount), scheduledCount: num(x.scheduledCount), hasCompletedLearning: bool(x.hasCompletedLearning), hasScheduledLearning: bool(x.hasScheduledLearning) }; }) }; };
export const deletedDecoder = (v: unknown) => { const d = object(v); if (d.deleted !== true) return bad(); return { planId: str(d.planId), deleted: true }; };
export const notificationDecoder = (v: unknown) => { const d = object(v); return { learningOn: bool(d.learningOn) }; };
export const conversationsDecoder = (v: unknown) => { const d = object(v); return { total: num(d.total), items: list(d.items, value => { const x = object(value); return { conversationId: str(x.conversationId), createdAt: str(x.createdAt) }; }) }; };
export const conversationDecoder = (v: unknown) => ({ conversationId: str(object(v).conversationId) });
export const messageDecoder = (v: unknown) => { const d = object(v); return { messageId: str(d.messageId), role: str(d.role), content: str(d.content), status: str(d.status), sources: list(d.sources ?? [], value => { const x = object(value); return { title: typeof x.titleSnapshot === 'string' ? x.titleSnapshot : typeof x.title === 'string' ? x.title : '출처', documentId: str(x.documentId) }; }) }; };
export const messagesDecoder = (v: unknown) => { const d = object(v); return { total: num(d.total), items: list(d.items, messageDecoder) }; };
export const answerDecoder = (v: unknown) => { const d = object(v); return { userMessage: messageDecoder(d.userMessage), assistantMessage: messageDecoder(d.assistantMessage), duplicate: d.duplicate === true }; };
export const usageDecoder = (v: unknown) => { const d = object(v); return { dailyLimit: num(d.dailyLimit), used: num(d.used), remaining: num(d.remaining) }; };
export const dependenciesDecoder = (v: unknown) => { const d = object(v); return { database: str(d.database), fastapi: str(d.fastapi), status: str(d.status) }; };
export const quizDecoder = (v: unknown) => { const d = object(v); return { id: str(d.id), title: str(d.title), choices: list(d.choices, value => { const c = object(value); return { id: str(c.id), content: str(c.content) }; }) }; };
export const PATHS = { me: '/api/v1/users/me', history: '/api/v1/learning/history', calendar: '/api/v1/calendar', plans: '/api/v1/calendar/plans', conversations: '/api/v1/tutor/conversations', usage: '/api/v1/tutor/usage', quiz: '/api/v1/quizzes/generate' } as const;
