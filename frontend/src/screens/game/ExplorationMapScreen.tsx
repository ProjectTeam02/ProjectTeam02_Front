/**
 * 백엔드가 제공한 경제 지역 목록과 선수 관계를 보여 주는 탐험 화면입니다.
 * 콘텐츠는 HTTP 조회 결과를 사용하고, 완료·잠금 표시는 앱의 임시 진행도를 함께 읽습니다.
 */
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Heading, LinkRow, Notice } from '../../components/ui/Primitives';
import LearningContentState from '../../components/ui/LearningContentState';
import LerenButton from '../../components/common/LerenButton';
import StageCard from '../../components/game/StageCard';
import type { StageStatus } from '../../components/game/StageCard';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useLearningProgress } from '../../context/LearningProgressContext';
import { useLearningContent } from '../../context/LearningContentContext';
import type { LearningRegion } from '../../types/learning';

export default function ExplorationMapScreen() {
  return <LearningContentState title="경제 탐험"><ExplorationMapContent /></LearningContentState>;
}

function ExplorationMapContent() {
  const { regions } = useLearningContent();
  const { completedSteps } = useLearningProgress();
  const [lockedStage, setLockedStage] = useState<LearningRegion | null>(null);
  const completeStages = regions.filter((stage) => completedSteps.includes(stage.boss.id)).map((stage) => stage.id);
  const statusOf = (stage: LearningRegion): StageStatus => completeStages.includes(stage.id) ? 'complete' : stage.prerequisite === null || completeStages.includes(stage.prerequisite) ? 'available' : 'locked';
  const current = regions.find((stage) => statusOf(stage) === 'available');
  const progressOf = (stage: LearningRegion) => stage.lessons.filter((lesson) => completedSteps.includes(lesson.id)).length + (completeStages.includes(stage.id) ? 1 : 0);
  const allComplete = regions.length > 0 && completeStages.length === regions.length;
  const prerequisite = regions.find((stage) => stage.id === lockedStage?.prerequisite);

  // 열린 지역은 단계 목록으로 이동하고 잠긴 지역은 선행 학습 안내를 표시합니다.
  const openStage = (stage: LearningRegion) => {
    if (statusOf(stage) === 'locked') setLockedStage(stage);
    else router.push({ pathname: '/steps', params: { stage: stage.id } });
  };

  return (
    <Screen title="경제 탐험" back tabs>
      <View style={styles.map}>
        <Text style={styles.mapTitle}>경제 지식 탐험 · {regions.length}개 지역</Text>
        <Text style={styles.mapDescription}>완료한 지역에서 새로운 길이 열려요</Text>
        {/* 서버 목록에 없는 지역이나 연결선은 임의로 추가하지 않습니다. */}
        <View style={styles.path}>
          {regions.map((stage) => (
            <View key={stage.id} style={styles.stage}>
              {stage.prerequisite !== null && <Text style={styles.requirement}>{stage.prerequisite}번 지역에서 이어지는 길</Text>}
              <StageCard number={stage.id} title={stage.title} status={statusOf(stage) === 'available' && progressOf(stage) > 0 ? 'active' : statusOf(stage)} progress={`${progressOf(stage)} / ${stage.lessons.length + 1} 완료`} requirement={`${stage.prerequisite}번 완료 필요`} onPress={() => openStage(stage)} />
            </View>
          ))}
        </View>
      </View>
      {current && <><LinkRow title={`현재 지역 · ${current.title}`} subtitle={`${progressOf(current)} / ${current.lessons.length + 1} 단계 완료`} onPress={() => openStage(current)} /><LerenButton title={`${current.title} ${progressOf(current) ? '이어하기' : '시작하기'}`} onPress={() => openStage(current)} /></>}
      {allComplete && <Notice tone="success">현재 제공된 지역을 모두 완료했어요. 다음 스테이지는 준비 중이에요.</Notice>}
      {!allComplete && <Body muted>현재 백엔드에서 제공한 스테이지만 표시해요. 이후 스테이지는 준비되면 추가돼요.</Body>}
      <Modal visible={!!lockedStage} transparent animationType="fade" onRequestClose={() => setLockedStage(null)}>
        <View style={styles.overlay}><View style={styles.dialog}>
          <Heading>{lockedStage?.title}은 아직 열리지 않았어요</Heading>
          <Body muted>{prerequisite ? `STAGE ${prerequisite.id} · ${prerequisite.title}을 완료하면 도전할 수 있어요.` : '이 지역의 선행 스테이지는 아직 준비되지 않았어요.'}</Body>
          {prerequisite && <LerenButton title="먼저 학습하기" onPress={() => { setLockedStage(null); router.push({ pathname: '/steps', params: { stage: prerequisite.id } }); }} />}
          <LerenButton title="닫기" variant="secondary" onPress={() => setLockedStage(null)} />
        </View></View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  map: { padding: 12, borderRadius: 16, backgroundColor: COLORS.soft },
  mapTitle: { ...TYPOGRAPHY.label, color: COLORS.primary },
  mapDescription: { ...TYPOGRAPHY.small, color: COLORS.muted, marginTop: 10 },
  path: { minHeight: 166, marginTop: 20, paddingBottom: 16, alignItems: 'center', gap: 20 },
  stage: { width: '100%', maxWidth: 250, gap: 8 },
  requirement: { ...TYPOGRAPHY.micro, color: COLORS.muted, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(24,40,66,0.4)', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 390, alignSelf: 'center', borderRadius: 16, backgroundColor: COLORS.surface, padding: 24, gap: 14 },
});
