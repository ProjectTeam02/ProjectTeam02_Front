/** 백엔드에서 받은 개념·사례·핵심 정리를 표시하고 같은 학습 ID의 퀴즈로 연결합니다. */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Empty, LinkRow, Progress } from '../../components/ui/Primitives';
import LearningContentState from '../../components/ui/LearningContentState';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useLearningContent } from '../../context/LearningContentContext';
import type { LearningLesson, LearningRegion } from '../../types/learning';

export default function MicroLearningScreen() {
  return <LearningContentState title="마이크로러닝"><MicroLearningContent /></LearningContentState>;
}

function MicroLearningContent() {
  const params = useLocalSearchParams<{ step?: string }>();
  const { regions, getLesson } = useLearningContent();
  const stepId = params.step === undefined ? regions[0]?.lessons[0]?.id : params.step;
  const record = stepId ? getLesson(stepId) : undefined;
  if (!record) return <Screen title="학습" back tabs><Empty title="아직 준비되지 않은 학습이에요" description="다른 단계의 내용을 대신 표시하지 않아요. 제공된 스테이지에서 학습을 선택해 주세요." action="탐험 지도 보기" onPress={() => router.replace('/explore')} /></Screen>;
  return <LessonCards key={record.lesson.id} lesson={record.lesson} region={record.region} />;
}

function LessonCards({ lesson, region }: { lesson: LearningLesson; region: LearningRegion }) {
  const [summary, setSummary] = useState(false);

  return <Screen title={summary ? '핵심 정리' : lesson.title} back tabs>
    <View style={styles.progress}><View style={styles.row}><Text style={styles.label}>{region.title} · {lesson.id}</Text><Text style={styles.small}>{summary ? '3' : '1'} / 3 · 약 3분</Text></View><Progress value={summary ? 1 : 1 / 3} /></View>
    {summary ? <>
      <LerenCard title="이것만 기억해도 좋아요" variant="info">{lesson.summary.map((line, index) => <Text key={line} style={styles.body}>{index + 1}. {line}</Text>)}</LerenCard>
      <LerenCard title="이제 퀴즈로 확인해 볼까요?" description="정답을 맞히면 몬스터의 HP가 줄어들어요. 배운 내용을 떠올리며 도전해 보세요." variant="reward" />
      <LerenButton title="퀴즈 전투 시작하기" onPress={() => router.push({ pathname: '/quiz', params: { step: lesson.id, boss: '0' } })} />
      <LerenButton title="학습 내용 다시 보기" variant="secondary" onPress={() => setSummary(false)} />
    </> : <>
      <LerenCard title={lesson.introTitle} description={lesson.intro} variant="info" />
      <LerenCard title={lesson.conceptTitle} description={lesson.concept} variant="info" />
      <LerenCard title="생활 속 예시" description={lesson.example} variant="reward" />
      <LerenButton title="핵심 정리 보기" onPress={() => setSummary(true)} />
    </>}
    <LinkRow title="헷갈리는 개념이 있나요?" subtitle="AI 튜터에게 질문" onPress={() => router.push({ pathname: '/tutor', params: { concept: lesson.title } })} />
  </Screen>;
}

const styles = StyleSheet.create({
  progress: { gap: 7 }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  label: { ...TYPOGRAPHY.label, color: COLORS.ink }, small: { ...TYPOGRAPHY.small, color: COLORS.muted }, body: { ...TYPOGRAPHY.body, color: COLORS.ink },
});
