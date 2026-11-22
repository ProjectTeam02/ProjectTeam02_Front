/** 지역 번호와 완료 단계 수로 Figma 원본을 선택합니다. 새 지역 그림은 이 표에 등록합니다. */
import type { ImageSourcePropType } from 'react-native';

export const continentImage = require('../../assets/stages/economic_continent.png');
const backgrounds: Partial<Record<number, readonly ImageSourcePropType[]>> = {
  1: [
    require('../../assets/stages/stage_01_0.png'),
    require('../../assets/stages/stage_01_1.jpg'),
    require('../../assets/stages/stage_01_2.png'),
    require('../../assets/stages/stage_01_3.png'),
    require('../../assets/stages/stage_01_4.png'),
    require('../../assets/stages/stage_01_5.png'),
  ],
};

export function stageBackground(topicNo: number, done: number, total: number) {
  const images = backgrounds[topicNo];
  if (!images?.length || total === 0) return undefined;
  if (images.length === 1) return images[0];
  return images[done === total ? images.length - 1 : Math.min(done, images.length - 2)];
}
