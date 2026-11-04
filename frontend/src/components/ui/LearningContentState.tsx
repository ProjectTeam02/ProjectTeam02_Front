/** 학습 서버 로딩·연결 오류·빈 카탈로그를 같은 안내로 처리하고 재시도 버튼을 제공합니다. */
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLearningContent } from '../../context/LearningContentContext';
import { COLORS } from '../../constants/theme';
import { Body, Empty } from './Primitives';
import Screen from './Screen';
export default function LearningContentState({ children, title }: { children: ReactNode; title?: string }) {
  const { status, error, regions, reload } = useLearningContent();
  // 전체 페이지를 감싼 경우에도 연결 오류에서 뒤로가기와 탭을 사용할 수 있게 합니다.
  const fallback = (content: ReactNode) => title ? <Screen title={title} back tabs>{content}</Screen> : content;
  if (status === 'unconfigured') return fallback(<Empty title="학습 콘텐츠 연결 준비 중" description="학습 콘텐츠가 준비되면 스테이지와 문제를 볼 수 있어요." />);
  if (status === 'loading') return fallback(<View style={s.loading}><ActivityIndicator color={COLORS.primary} /><Body muted>학습 정보를 불러오고 있어요.</Body></View>);
  if (status === 'error') return fallback(<Empty title="학습 정보를 불러오지 못했어요" description={error || '연결 상태를 확인한 뒤 다시 시도해 주세요.'} action="다시 불러오기" onPress={() => { void reload(); }} />);
  if (!regions.length) return fallback(<Empty title="학습을 준비하고 있어요" description="준비된 스테이지가 아직 없어요." action="다시 불러오기" onPress={() => { void reload(); }} />);
  return children;
}
const s = StyleSheet.create({ loading: { alignItems: 'center', paddingVertical: 48, gap: 12 } });
