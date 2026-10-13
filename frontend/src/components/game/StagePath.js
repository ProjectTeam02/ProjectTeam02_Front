import React from 'react';
import { View, StyleSheet } from 'react-native';

const LINE_COLOR = '#DCE5F0';

export default function StagePath({
  type = 'vertical',
  height = 28,
}) {
  if (type === 'branch') {
    return (
      <View style={[styles.branch, { height }]}>
        <View style={styles.centerStem} />
        <View style={styles.horizontal} />
        <View style={styles.leftStem} />
        <View style={styles.rightStem} />
      </View>
    );
  }

  return (
    <View style={[styles.verticalContainer, { height }]}>
      <View style={styles.verticalLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  verticalContainer: {
    alignItems: 'center',
  },
  verticalLine: {
    width: 2,
    height: '100%',
    backgroundColor: LINE_COLOR,
  },
  branch: {
    width: '100%',
    position: 'relative',
  },
  centerStem: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 2,
    height: '50%',
    backgroundColor: LINE_COLOR,
  },
  horizontal: {
    position: 'absolute',
    top: '50%',
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: LINE_COLOR,
  },
  leftStem: {
    position: 'absolute',
    top: '50%',
    left: '25%',
    bottom: 0,
    width: 2,
    backgroundColor: LINE_COLOR,
  },
  rightStem: {
    position: 'absolute',
    top: '50%',
    left: '75%',
    bottom: 0,
    width: 2,
    backgroundColor: LINE_COLOR,
  },
});