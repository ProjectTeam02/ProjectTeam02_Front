/** 서버 직업 코드 또는 표시 이름에 해당하는 기존 캐릭터 이미지를 찾습니다. */
import { HEROES } from '../screens/mypage/heroCatalog';
export function heroImage(job?: { classCode: string; name: string } | null) {
  if (!job) return undefined;
  return Object.entries(HEROES).find(([key, hero]) => key === job.classCode.toLowerCase() || hero.name === job.name)?.[1].image;
}
