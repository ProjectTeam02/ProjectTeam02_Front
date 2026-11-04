/**
 * 탐험 지도 카드 사이의 연결선. 학습 경로를 세로선 또는 두 갈래 분기선으로 표현하며 데이터 처리는 하지 않습니다.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';

const LINE_COLOR = '#DCE5F0';

export interface StagePathProps {
  type?: 'vertical' | 'branch';
  height?: number;
}

export default function StagePath({
  type = 'vertical',
  height = 28,
}: StagePathProps = {}) {
  // 분기선은 가운데 줄기·가로선·양쪽 줄기로 구성합니다.
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

// 이 화면/컴포넌트의 배치·색상·크기 정의. 최종 UI는 디자인 기준과 기기에서 확인합니다.
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
