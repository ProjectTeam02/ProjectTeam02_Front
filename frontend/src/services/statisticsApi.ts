/** 전체·개념별 학습 통계 계약입니다. 응시 횟수와 정답률은 서버 응답만 사용합니다. */
import { BackendError, object } from './backend.ts';

const invalid = (): never => { throw new BackendError('학습 통계 API 응답 형식이 예상과 다릅니다.', 0, 'INVALID_STATISTICS_RESPONSE'); };
const str = (v: unknown): string => typeof v === 'string' ? v : invalid();
const integer = (v: unknown): number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : invalid();
const accuracy = (v: unknown): number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1 ? v : invalid();
const array = <T>(v: unknown, decode: (item: unknown) => T): T[] => Array.isArray(v) ? v.map(decode) : invalid();

export interface OverallStatistics { attempts: number; passedAttempts: number; failedAttempts: number; completedStages: number }
export const overallDecoder = (value: unknown): OverallStatistics => {
  const d = object(value);
  const result = { attempts: integer(d.attempts), passedAttempts: integer(d.passedAttempts),
    failedAttempts: integer(d.failedAttempts), completedStages: integer(d.completedStages) };
  if (result.passedAttempts + result.failedAttempts > result.attempts || result.completedStages > result.passedAttempts) invalid();
  return result;
};

export interface ConceptStatistic { conceptId: string; title: string; attempts: number; correct: number; accuracy: number }
export const conceptStatisticDecoder = (value: unknown): ConceptStatistic => {
  const d = object(value);
  const result = { conceptId: str(d.conceptId), title: str(d.title), attempts: integer(d.attempts),
    correct: integer(d.correct), accuracy: accuracy(d.accuracy) };
  if (result.correct > result.attempts) invalid();
  return result;
};
export interface ConceptStatistics { items: ConceptStatistic[]; sort: string }
export const conceptsDecoder = (value: unknown): ConceptStatistics => {
  const d = object(value);
  return { items: array(d.items, conceptStatisticDecoder), sort: str(d.sort) };
};

export const STATISTICS_PATHS = {
  overall: '/api/v1/statistics/overall',
  concepts: '/api/v1/statistics/concepts',
};
