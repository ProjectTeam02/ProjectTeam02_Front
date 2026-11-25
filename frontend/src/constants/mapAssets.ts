/** 최종 지도 이미지와 상태 배지는 정적 require()로 등록해야 Metro가 번들링할 수 있다. */
import type { ImageSourcePropType } from 'react-native';

export const mapArtwork: number = require('../../assets/stages/map/map_art_3x.webp');
export const mapBadges: Record<'locked' | 'available' | 'complete', ImageSourcePropType> = {
  locked: require('../../assets/stages/map/status_locked.png'),
  available: require('../../assets/stages/map/status_available.png'),
  complete: require('../../assets/stages/map/status_complete.png'),
};
