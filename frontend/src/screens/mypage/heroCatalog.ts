/** 직업·코스튬 화면에서 함께 쓰는 디자인 확인용 카탈로그입니다. 서버 상품/직업 DTO와는 별개입니다. */
export type HeroJob = 'warrior' | 'mage' | 'archer';
export const HEROES = {
  warrior: { name: '검사', image: require('../../../assets/characters/leren_warrior.png') },
  mage: { name: '마법사', image: require('../../../assets/characters/leren_mage.png') },
  archer: { name: '궁수', image: require('../../../assets/characters/leren_archer.png') },
};
// 피그마에서도 코스튬 미리보기는 해당 직업의 동일 캐릭터 에셋으로 표현되어 있습니다.
export const COSTUMES: { id: string; title: string; job: HeroJob; price: number; description: string }[] = [
  { id: 'dawn', title: '푸른 새벽 로브', job: 'mage', price: 300, description: '새로운 모험에 어울리는 맑은 파란빛' },
  { id: 'guardian', title: '황금 수호자', job: 'warrior', price: 1200, description: '반짝이는 갑옷으로 영웅을 꾸며 보세요.' },
  { id: 'basic', title: '별빛 로브', job: 'mage', price: 0, description: '모험을 함께하는 첫 번째 코스튬' },
];
// 기본 의상은 모든 직업이 사용합니다. 직업이 바뀌어도 마법사의 로브 이름이 남지 않게 조정합니다.
export function costumesForJob(job: HeroJob) {
  return COSTUMES.map(item => item.id === 'basic' ? {
    ...item,
    job,
    title: job === 'mage' ? '별빛 로브' : job === 'warrior' ? '기본 검사 의상' : '기본 궁수 의상',
  } : item);
}
export function costumeTitle(id: string, job: HeroJob = 'mage') { return costumesForJob(job).find(item => item.id === id)?.title ?? '기본 코스튬'; }
