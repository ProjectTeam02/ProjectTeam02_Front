/**
 * 배포된 백엔드의 공개 상태와 로그인한 사용자의 학습 이력을 읽기 전용으로 확인합니다.
 * 실제 JSON 계약을 검사하며 오류를 예시 데이터로 바꾸지 않습니다. 토큰과 응답은 로그에 남기지 않습니다.
 * 기존 인증 서비스도 같은 origin 검증을 사용해 원격 HTTP로 비밀번호·토큰을 보내지 않게 합니다.
 */
import { getApiBaseUrl, getAuthenticatedApiBaseUrl } from './apiConfig.ts';
export { getApiBaseUrl, getAuthenticatedApiBaseUrl } from './apiConfig.ts';

export interface BackendHealth {
  service: 'leren-backend';
  status: 'UP';
  timestamp: string;
}

export interface LearningHistoryItem {
  recordType: 'LEARNING';
  recordId: string;
  status: 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'ABANDONED';
  learningDate: string | null;
  stageTitle: string | null;
  submittedCount: number;
  correctCount: number;
}

export interface LearningHistoryPage {
  items: LearningHistoryItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const integer = (value: unknown, minimum = 0): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum;

/** 화면 종료와 10초 타임아웃을 모두 반영합니다. 서버에는 GET만 전송합니다. */
async function readJson(path: string, signal?: AbortSignal, accessToken?: string): Promise<unknown> {
  const baseUrl = accessToken ? getAuthenticatedApiBaseUrl() : getApiBaseUrl();
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, 10000);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: { Accept: 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      signal: controller.signal,
    });
    // TLS·프록시·인증 실패를 정상적인 빈 목록으로 표시하지 않습니다.
    if (!response.ok) {
      if (response.status === 401) throw new Error('HTTP 401: 로그인이 필요하거나 세션이 만료됐어요. 다시 로그인해 주세요.');
      if (response.status === 404) throw new Error('HTTP 404: 배포된 서버에서 이 API 경로를 찾지 못했어요.');
      throw new Error(`HTTP ${response.status}: 서버가 요청을 처리하지 못했어요.`);
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) throw new Error('JSON 대신 다른 응답이 도착했어요. 서버 주소와 프록시 경로를 확인해 주세요.');
    try { return await response.json(); } catch { throw new Error('서버가 유효한 JSON을 반환하지 않았어요.'); }
  } catch (error) {
    if (controller.signal.aborted) throw new Error(signal?.aborted ? '요청을 취소했어요.' : '서버 응답이 10초를 넘었어요.');
    if (error instanceof TypeError) throw new Error('서버에 연결하지 못했어요. HTTPS 인증서·도메인·네트워크를 확인해 주세요. 웹에서는 CORS 설정도 확인해 주세요.');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

/** /health는 프로세스 생존 확인이며 데이터베이스 준비 완료나 배포 SHA를 증명하지 않습니다. */
export async function getBackendHealth(signal?: AbortSignal): Promise<BackendHealth> {
  const data = await readJson('/health', signal);
  if (!object(data) || data.service !== 'leren-backend' || data.status !== 'UP' || typeof data.timestamp !== 'string' || !Number.isFinite(Date.parse(data.timestamp))) {
    throw new Error('/health 응답이 확인한 백엔드 계약과 달라요.');
  }
  return { service: data.service, status: data.status, timestamp: data.timestamp };
}

/** 현재 세션의 첫 페이지 10건만 읽으며 생성·채점·학습 기록 저장 API는 호출하지 않습니다. */
export async function getLearningHistory(accessToken: string, signal?: AbortSignal): Promise<LearningHistoryPage> {
  if (!accessToken.trim()) throw new Error('학습 이력은 기존 계정으로 로그인한 뒤 확인해 주세요.');
  const response = await readJson('/api/v1/learning/history?page=1&pageSize=10', signal, accessToken);
  if (!object(response) || response.success !== true || !object(response.data)) throw new Error('학습 이력 응답 형식이 올바르지 않아요.');
  const data = response.data;
  if (!Array.isArray(data.items) || !integer(data.page, 1) || !integer(data.pageSize, 1) || !integer(data.total) || !integer(data.totalPages)
    || data.page !== 1 || data.pageSize !== 10 || data.items.length > data.pageSize || data.total < data.items.length
    || data.totalPages !== Math.ceil(data.total / data.pageSize)) throw new Error('학습 이력 페이지 정보가 올바르지 않아요.');
  const items = data.items.map((item: unknown): LearningHistoryItem => {
    if (!object(item) || item.recordType !== 'LEARNING' || typeof item.recordId !== 'string' || !item.recordId
      || typeof item.status !== 'string' || !['IN_PROGRESS', 'PASSED', 'FAILED', 'ABANDONED'].includes(item.status)
      || !(item.learningDate === null || (typeof item.learningDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.learningDate)))
      || !(item.stage === null || (object(item.stage) && typeof item.stage.title === 'string'))
      || !integer(item.submittedCount) || !integer(item.correctCount) || item.correctCount > item.submittedCount) {
      throw new Error('학습 이력 항목이 확인한 백엔드 계약과 달라요.');
    }
    return { recordType: 'LEARNING', recordId: item.recordId, status: item.status as LearningHistoryItem['status'],
      learningDate: item.learningDate, stageTitle: object(item.stage) ? item.stage.title as string : null,
      submittedCount: item.submittedCount, correctCount: item.correctCount };
  });
  return { items, page: data.page, pageSize: data.pageSize, total: data.total, totalPages: data.totalPages };
}
