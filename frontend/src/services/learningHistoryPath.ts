/** 달력·통계·결과 화면에서 동일한 서버 학습 기록 상세 경로를 사용합니다. */
import { PATHS } from './backend.ts';

export interface LearningRecordRef {
  recordType: string;
  recordId: string;
}

export function learningHistoryDetailPath({ recordType, recordId }: LearningRecordRef): string {
  return `${PATHS.history}/${encodeURIComponent(recordType)}/${encodeURIComponent(recordId)}`;
}
