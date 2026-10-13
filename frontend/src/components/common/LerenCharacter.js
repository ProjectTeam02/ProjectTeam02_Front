
import React from 'react';
import {
  Image,
  View,
  StyleSheet,
} from 'react-native';

export default function LerenCharacter({
  source,
  size = 88,
  accessibilityLabel = 'LEREN 캐릭터',
}) {
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

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: 'transparent',
  },
});
