
/** 서버 코스튬 코드와 이름을 로컬 이미지에 연결합니다. */
import type { ImageSourcePropType } from 'react-native';

export type BasicCostumeJob = 'warrior' | 'mage' | 'archer';

export const COSTUME_IMAGES = {
  blueDawn: require('../../assets/costumes/blue_dawn_robe.png'),
  starlight: require('../../assets/costumes/starlight_robe.png'),
  guardian: require('../../assets/costumes/golden_guardian.png'),

  // 기본 의상 이미지: 현재는 직업별 캐릭터 이미지 사용
  basicWarrior: require('../../assets/characters/leren_warrior.png'),
  basicMage: require('../../assets/characters/leren_mage.png'),
  basicArcher: require('../../assets/characters/leren_archer.png'),
};

const BASIC_NAMES: Record<BasicCostumeJob, string> = {
  warrior: '검사',
  mage: '마법사',
  archer: '궁수',
};

const BASIC_IMAGES: Record<BasicCostumeJob, ImageSourcePropType> = {
  warrior: COSTUME_IMAGES.basicWarrior,
  mage: COSTUME_IMAGES.basicMage,
  archer: COSTUME_IMAGES.basicArcher,
};

const IMAGE_BY_CODE: Record<string, ImageSourcePropType> = {
  BLUE_DAWN_ROBE: COSTUME_IMAGES.blueDawn,
  STARLIGHT_ROBE: COSTUME_IMAGES.starlight,
  GOLDEN_GUARDIAN: COSTUME_IMAGES.guardian,
};

const IMAGE_BY_NAME: Record<string, ImageSourcePropType> = {
  '푸른 새벽 로브': COSTUME_IMAGES.blueDawn,
  '별빛 로브': COSTUME_IMAGES.starlight,
  '황금 수호자': COSTUME_IMAGES.guardian,
};

export function getBasicCostumeJob(
  costumeCode: string,
  name: string,
  currentJob?: BasicCostumeJob
): BasicCostumeJob | undefined {
  const code = costumeCode.toUpperCase();
  const normalizedName = name.trim();

  // 기존 상점의 특별 코스튬은 기본 의상으로 변경하지 않음
  if (IMAGE_BY_CODE[code]) return undefined;

  const basic =
    /BASIC|DEFAULT|STARTER|기본/.test(code) ||
    /기본|초기 의상|초기 코스튬/.test(normalizedName);

  if (!basic) return undefined;

  if (/WARRIOR|SWORD|FIGHTER|검사|전사/.test(code + normalizedName)) {
    return 'warrior';
  }

  if (/MAGE|WIZARD|MAGICIAN|마법사/.test(code + normalizedName)) {
    return 'mage';
  }

  if (/ARCHER|BOW|궁수/.test(code + normalizedName)) {
    return 'archer';
  }

  // 직업 구분이 없는 공용 기본 의상
  return currentJob;
}

export function getBasicCostumeName(job: BasicCostumeJob): string {
  return BASIC_NAMES[job];
}

export const getCostumeImage = (
  costumeCode: string,
  name?: string
): ImageSourcePropType | undefined => {
  // 직업별 기본 옷은 이름으로 우선 연결
  const basicJob = getBasicCostumeJob(costumeCode, name ?? '');

  if (basicJob) {
    return BASIC_IMAGES[basicJob];
  }

  return (
    IMAGE_BY_CODE[costumeCode.toUpperCase()] ??
    (name ? IMAGE_BY_NAME[name] : undefined)
  );
};
