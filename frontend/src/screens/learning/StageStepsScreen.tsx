/** 백엔드 지역의 학습 목록과 보스를 표시합니다. 진행도만 앱 메모리에서 함께 읽습니다. */
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Empty, Heading, LinkRow, Progress } from '../../components/ui/Primitives';
import LearningContentState from '../../components/ui/LearningContentState';
import LerenCard from '../../components/common/LerenCard';
import LerenButton from '../../components/common/LerenButton';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useLearningProgress } from '../../context/LearningProgressContext';
import { useLearningContent } from '../../context/LearningContentContext';
import type { LearningLesson } from '../../types/learning';

export default function StageStepsScreen() {
  return <LearningContentState title="학습 단계"><StageStepsContent /></LearningContentState>;
}

function StageStepsContent() {
  const params = useLocalSearchParams<{ stage?: string }>();
  const { regions, getRegion, battleRules } = useLearningContent();
  // 주소를 생략한 경우에만 첫 지역을 엽니다. 명시한 미등록 ID는 다른 내용으로 대체하지 않습니다.
  const stage = params.stage === undefined ? regions[0] : getRegion(Number(params.stage));
  const { completedSteps } = useLearningProgress();
  const [locked, setLocked] = useState(false);
  if (!stage || !battleRules) return <Screen title="스테이지" back tabs><Empty title="아직 준비되지 않은 스테이지예요" description="백엔드에서 제공하는 지역 목록에서 선택해 주세요." action="탐험 지도 보기" onPress={() => router.replace('/explore')} /></Screen>;
  const prerequisite = stage.prerequisite === null ? undefined : getRegion(stage.prerequisite);
  if (stage.prerequisite !== null && (!prerequisite || !completedSteps.includes(prerequisite.boss.id))) return <Screen title={stage.title} back tabs><Empty title="앞 지역을 먼저 완료해 주세요" description="선행 스테이지를 완료하면 다음 지역이 열려요." action="탐험 지도 보기" onPress={() => router.replace('/explore')} /></Screen>;
  const done = stage.lessons.filter((lesson) => completedSteps.includes(lesson.id)).length;
  const bossDone = completedSteps.includes(stage.boss.id);
  const bossOpen = done === stage.lessons.length;
  const next = stage.lessons.find((lesson) => !completedSteps.includes(lesson.id));
  const totalSteps = stage.lessons.length + 1;
  const openLesson = (lesson: LearningLesson, index: number) => {
    if (index > 0 && !completedSteps.includes(stage.lessons[index - 1].id)) setLocked(true);
    else router.push({ pathname: '/lesson', params: { step: lesson.id } });
  };
  const openBoss = () => {
    if (!bossOpen) setLocked(true);
    else router.push({ pathname: '/quiz', params: { step: stage.boss.id, boss: '1' } });
  };

  return <Screen title={stage.title} back tabs>
    <LerenCard title={`STAGE ${stage.id} · ${stage.title}`} description={stage.description} variant="info" />
    <View style={styles.progress}><View style={styles.row}><Text style={styles.label}>지역 진행도</Text><Text style={styles.small}>{done + (bossDone ? 1 : 0)} / {totalSteps} 단계 완료</Text></View><Progress value={(done + (bossDone ? 1 : 0)) / totalSteps} /></View>
    {stage.lessons.map((lesson, index) => <LinkRow key={lesson.id} title={`${lesson.id} · ${lesson.title}`} subtitle={completedSteps.includes(lesson.id) ? '완료 · 다시 보기' : index === 0 || completedSteps.includes(stage.lessons[index - 1].id) ? '학습 가능 · 3~5분' : '잠김 · 앞 단계 완료 필요'} onPress={() => openLesson(lesson, index)} />)}
    <LinkRow title={`BOSS · ${stage.title} 종합 복습`} subtitle={bossDone ? '완료 · 다시 도전' : bossOpen ? `도전 가능 · 최대 ${battleRules.boss.maxQuestions}문제` : '잠김 · 앞 단계 완료 필요'} onPress={openBoss} />
    <LerenButton title={next ? `${next.title} 학습하기` : bossDone ? '경제 탐험 지도 보기' : '보스 도전하기'} onPress={() => next ? router.push({ pathname: '/lesson', params: { step: next.id } }) : bossDone ? router.push('/explore') : openBoss()} />
    <Modal visible={locked} transparent animationType="fade" onRequestClose={() => setLocked(false)}><View style={styles.overlay}><View style={styles.dialog}><Heading>앞 단계를 먼저 완료해 주세요</Heading><Body muted>학습과 퀴즈를 마치면 다음 단계와 보스가 열려요.</Body><LerenButton title="알겠어요" onPress={() => setLocked(false)} /></View></View></Modal>
  </Screen>;
}

const styles = StyleSheet.create({
  progress: { gap: 7 }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  label: { ...TYPOGRAPHY.label, color: COLORS.ink }, small: { ...TYPOGRAPHY.small, color: COLORS.muted },
  overlay: { flex: 1, backgroundColor: 'rgba(24,40,66,0.4)', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 390, alignSelf: 'center', padding: 24, borderRadius: 16, backgroundColor: COLORS.surface, gap: 14 },
});
