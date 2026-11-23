/** Figma 13-01 경제 탐험 지도 원본 좌표 (362 × 1480).
 * 9개의 섬은 고정 아트에 그려져 있으며, 이 좌표는 터치/상태 배지 위치에만 사용한다.
 */
export const MAP_BASE_WIDTH = 362;
export const MAP_BASE_HEIGHT = 1480;
export const REGION_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type RegionNumber = (typeof REGION_NUMBERS)[number];

export const MAP_LAYOUT: Record<RegionNumber, { x: number; y: number; width: number; height: number }> = {
  1: { x: 87, y: 1234, width: 189, height: 180 },
  2: { x: 6, y: 1022, width: 156, height: 170 },
  3: { x: 42, y: 785, width: 168, height: 180 },
  4: { x: 16, y: 553, width: 166, height: 148 },
  5: { x: 19, y: 320, width: 171, height: 130 },
  6: { x: 43, y: 62, width: 175, height: 132 },
  7: { x: 195, y: 950, width: 167, height: 175 },
  8: { x: 187, y: 656, width: 165, height: 148 },
  9: { x: 180, y: 394, width: 182, height: 155 },
};

/** Figma 라벨 텍스트. API의 topic.title과 다를 수 있으며, 학습 화면은 서버 title을 따른다. */
export const MAP_TITLES: Record<RegionNumber, string> = {
  1: '성장의 동굴',
  2: '활기찬 시장',
  3: '자금의 정원',
  4: '시간의 탑',
  5: '약속의 성소',
  6: '가치의 저울',
  7: '황금의 금고',
  8: '교환의 관문',
  9: '유동성의 수로',
};

/** 섬의 테마명(MAP_TITLES)과 구별되는 실제 학습 주제명. */
export const MAP_SUBJECTS: Record<RegionNumber, string> = {
  1: '경제 기초',
  2: '물가와 인플레이션',
  3: '금리와 대출',
  4: '복리와 시간가치',
  5: '채권과 채권가격',
  6: '듀레이션',
  7: '은행과 예금',
  8: '지급결제',
  9: '신용창출과 유동성',
};

/** 지도상의 연결 구조(시각화용). 실제 해금은 API isUnlocked 응답이 결정한다. */
export const MAP_PREREQUISITES: Record<RegionNumber, readonly RegionNumber[]> = {
  1: [], 2: [1], 3: [1], 4: [3], 5: [4], 6: [5], 7: [1], 8: [7], 9: [8],
};

/** 새 지도 이미지(배지 없음)의 명칭 패널 아래에 별도 배지를 올리는 좌표.
 * 362×1480 기준이며, 렌더링 시 scale을 적용합니다.
 */
export const MAP_BADGES: Record<RegionNumber, { cx: number; y: number }> = {
  1: { cx: 182, y: 1378},
  2: { cx: 89, y: 1157 },
  3: { cx: 128, y: 930 },
  4: { cx: 100, y: 664 },
  5: { cx: 104, y: 416 },
  6: { cx: 130, y: 162 },
  7: { cx: 274, y: 1093 },
  8: { cx: 271, y: 771 },
  9: { cx: 270, y: 517 },
};
