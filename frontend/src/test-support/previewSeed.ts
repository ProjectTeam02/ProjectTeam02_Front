/** test 브랜치의 화면 확인용 초기값입니다. 실제 사용자 성장·잔액·일정이 아니며 로그인마다 초기화됩니다. */
import type { LearningProgressSeed } from '../context/LearningProgressContext';
export const PREVIEW_SEED: LearningProgressSeed = {
  profile: { job: 'mage', coins: 840, xp: 120, economyXp: 80, level: 12, economyLevel: 8 },
  schedules: [],
};
