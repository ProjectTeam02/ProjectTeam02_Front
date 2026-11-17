
import type { ImageSourcePropType } from 'react-native';

export const COSTUME_IMAGES = {
  blueDawn: require('../../assets/costumes/blue_dawn_robe.png'),
  starlight: require('../../assets/costumes/starlight_robe.png'),
  guardian: require('../../assets/costumes/golden_guardian.png'),
};

const IMAGE_BY_NAME: Record<string, ImageSourcePropType> = {
  '푸른 새벽 로브': COSTUME_IMAGES.blueDawn,
  '별빛 로브': COSTUME_IMAGES.starlight,
  '황금 수호자': COSTUME_IMAGES.guardian,
};

export const getCostumeImage = (name: string): ImageSourcePropType | undefined => IMAGE_BY_NAME[name];
