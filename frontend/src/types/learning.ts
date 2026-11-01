/**
 * 학습 화면에서 사용할 모델입니다. 서버의 공개 DTO나 백엔드 DB 엔티티를 확정하는 타입이 아닙니다.
 * 지도 한 칸은 region(지역), 그 안의 학습은 lesson으로 구분합니다. 정식 API 도입 시 services에서 변환합니다.
 */
export interface LearningQuestion {
  id: string; concept: string; question: string; choices: string[]; answer: number; explanation: string;
}
export interface LearningLesson {
  id: string; title: string; introTitle: string; intro: string; conceptTitle: string;
  concept: string; example: string; summary: string[]; questionIds: string[];
}
export interface LearningRegion {
  id: number; title: string; description: string; prerequisite: number | null;
  boss: { id: string; questionIds: string[] }; lessons: LearningLesson[];
}
export interface BattleRule { hp: number; maxQuestions: number }
export interface LearningCatalog {
  regions: LearningRegion[]; questions: LearningQuestion[];
  battleRules: { normal: BattleRule; boss: BattleRule };
  rewards: { coins: number; xp: number; economyXp: number };
}
