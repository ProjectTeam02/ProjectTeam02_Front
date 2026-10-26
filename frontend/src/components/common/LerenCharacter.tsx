/**
 * 캐릭터 이미지 표시 전용 컴포넌트. 이미지가 없을 때도 같은 크기의 빈 영역을 유지합니다.
 */
import React from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  Image,
  View,
  StyleSheet,
} from 'react-native';

export interface LerenCharacterProps {
  source?: ImageSourcePropType;
  size?: number;
  accessibilityLabel?: string;
}

export default function LerenCharacter({
  source,
  size = 88,
  accessibilityLabel = 'LEREN 캐릭터',
}: LerenCharacterProps) {
  // 리소스가 아직 없는 화면에서도 레이아웃이 흔들리지 않게 공간을 확보합니다.
  if (!source) {
    return (
      <View
        style={[
          styles.placeholder,
          { width: size, height: size },
        ]}
      />
    );
  }

  return (
    <Image
      source={source}
      resizeMode="contain"
      accessibilityLabel={accessibilityLabel}
      style={{
        width: size,
        height: size,
      }}
    />
  );
}

// 이 화면/컴포넌트의 배치·색상·크기 정의. 최종 UI는 디자인 기준과 기기에서 확인합니다.
const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: 'transparent',
  },
});
