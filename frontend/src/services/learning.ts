/**
 * 학습 화면에 데이터를 공급할 함수의 공통 접점입니다.
 * 이 접점은 개발용 시안 카탈로그에만 사용합니다. 정식 화면은 learningApi.ts의 서버 계약을 사용합니다.
 * 실제 응답을 LearningCatalog 화면 모델로 변환하는 공급 함수를 Provider에 전달합니다.
 */
import type { LearningCatalog } from '../types/learning';

export type LearningCatalogLoader = (signal: AbortSignal) => Promise<LearningCatalog>;
