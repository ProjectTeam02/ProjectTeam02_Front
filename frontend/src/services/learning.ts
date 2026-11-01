/**
 * 학습 화면에 데이터를 공급할 함수의 공통 접점입니다.
 * 정식 API 계약은 미연결입니다. 테스트 전용 주소/정답 JSON을 호출하거나 대신 생성하지 않습니다.
 * 실제 응답을 LearningCatalog 화면 모델로 변환하는 공급 함수를 Provider에 전달합니다.
 */
import type { LearningCatalog } from '../types/learning';

export type LearningCatalogLoader = (signal: AbortSignal) => Promise<LearningCatalog>;
