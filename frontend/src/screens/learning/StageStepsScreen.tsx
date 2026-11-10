/** 정식 Stage 목록·잠금·완료 상태를 서버에서 읽고 실제 UUID로 학습에 진입합니다. */
import { router, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Empty, Notice, Progress } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import { useLearningQuery } from '../../hooks/useLearningQuery';
import { isLearningId, LEARNING_PATHS, stagesDecoder } from '../../services/learningApi';

export default function StageStepsScreen() {
  const { topicId } = useLocalSearchParams<{ topicId?: string }>();
  const stages = useLearningQuery(isLearningId(topicId) ? LEARNING_PATHS.stages(topicId) : null, stagesDecoder);
  if (!isLearningId(topicId)) return <Screen title="학습 단계" tabs><Empty title="학습 주제를 선택해 주세요" action="경제 탐험 보기" onPress={() => router.replace('/explore')} /></Screen>;
  const done = stages.data?.items.filter(stage => stage.progressStatus === 'PASSED').length ?? 0;
  const total = stages.data?.items.length ?? 0;
  return <Screen title={stages.data?.topic.title ?? '학습 단계'} tabs>
    <ApiStatus resource={stages} label="학습 단계" empty={total === 0} />
    {total > 0 && <><Body>완료한 단계 {done} / {total}</Body><Progress value={done / total} /></>}
    {stages.data?.items.map(stage => <LerenCard key={stage.stageId} title={`${stage.stageCode} · ${stage.title}`} description={stage.description ?? undefined}>
      <Notice tone={stage.progressStatus === 'PASSED' ? 'success' : 'info'}>{stage.progressStatus === 'PASSED' ? '학습 완료 · 다시 학습 가능' : stage.isUnlocked ? stage.progressStatus === 'IN_PROGRESS' ? '진행 중 · 이어하기 가능' : '학습 가능' : '잠김 · 이전 단계 또는 선수 주제를 먼저 완료해 주세요.'}</Notice>
      {stage.stageType === 'BOSS' && <Body muted>보스의 퀴즈 응시는 아직 지원하지 않습니다. 공개된 학습 내용은 확인할 수 있습니다.</Body>}
      <LerenButton title="학습 내용 보기" disabled={!stage.isUnlocked} onPress={() => router.push({ pathname: '/lesson', params: { stageId: stage.stageId } })} />
    </LerenCard>)}
  </Screen>;
}
