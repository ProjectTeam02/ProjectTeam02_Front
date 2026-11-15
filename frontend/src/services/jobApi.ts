/** 직업 목록·변경 API 계약입니다. 직업 ID는 서버 응답만 사용합니다. */
import { BackendError, object } from './backend.ts';

const invalid = (): never => { throw new BackendError('직업 API 응답 형식이 예상과 다릅니다.', 0, 'INVALID_JOB_RESPONSE'); };
const str = (v: unknown): string => typeof v === 'string' ? v : invalid();
const array = <T>(v: unknown, decode: (item: unknown) => T): T[] => Array.isArray(v) ? v.map(decode) : invalid();

export interface CharacterJob { classId: string; classCode: string; name: string; imageKey: string | null }
export const jobDecoder = (value: unknown): CharacterJob => {
  const d = object(value);
  return { classId: str(d.classId), classCode: str(d.classCode), name: str(d.name),
    imageKey: d.imageKey == null ? null : str(d.imageKey) };
};
export interface JobList { items: CharacterJob[] }
export const jobsDecoder = (value: unknown): JobList => {
  const d = object(value);
  return { items: array(d.items, jobDecoder) };
};
export interface JobChange { userId: string; classId: string; classCode: string }
export const jobChangeDecoder = (value: unknown): JobChange => {
  const d = object(value);
  return { userId: str(d.userId), classId: str(d.classId), classCode: str(d.classCode) };
};

export const JOB_PATHS = {
  list: '/api/v1/character-classes',
  change: '/api/v1/users/me/character/class',
};