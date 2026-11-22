/** 서버 상품 코드와 이름을 앱에 포함된 코스튬 이미지에 연결합니다. */
import type { ImageSourcePropType } from 'react-native';

export const COSTUME_IMAGES = {
  blueDawn: require('../../assets/costumes/blue_dawn_robe.png'),
  starlight: require('../../assets/costumes/starlight_robe.png'),
  guardian: require('../../assets/costumes/golden_guardian.png'),
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

// 코드로 이미지를 찾을 수 없으면 상품 이름으로 조회합니다.
export const getCostumeImage = (
  costumeCode: string,
  name?: string
): ImageSourcePropType | undefined =>
  IMAGE_BY_CODE[costumeCode] ??
  (name ? IMAGE_BY_NAME[name] : undefined);
