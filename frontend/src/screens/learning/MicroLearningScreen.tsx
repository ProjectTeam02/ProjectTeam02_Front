/** Stage에 연결된 공개 개념과 정렬된 학습 카드를 실제 API로 조회합니다. */
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Empty, Heading, LinkRow, Notice } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenCard from '../../components/common/LerenCard';
import LerenButton from '../../components/common/LerenButton';
import { useLearningQuery } from '../../hooks/useLearningQuery';
import { conceptDecoder, isLearningId, LEARNING_PATHS, stageDetailDecoder, type StageDetail } from '../../services/learningApi';

export default function MicroLearningScreen() {
  const { stageId } = useLocalSearchParams<{ stageId?: string }>();
  const stage = useLearningQuery(isLearningId(stageId) ? LEARNING_PATHS.stage(stageId) : null, stageDetailDecoder);
  if (!isLearningId(stageId)) return <Screen title="학습" tabs><Empty title="학습 단계를 선택해 주세요" action="경제 탐험 보기" onPress={() => router.replace('/explore')} /></Screen>;
  return <Screen title={stage.data?.title ?? '학습 내용'} tabs>
    <ApiStatus resource={stage} label="학습 내용" />
    {stage.data && (stage.data.isUnlocked
      ? <ConceptCards key={stage.data.stageId} stage={stage.data} />
      : <Notice>이전 단계 또는 선수 주제를 먼저 완료해 주세요.</Notice>)}
  </Screen>;
}

function ConceptCards({ stage }: { stage: StageDetail }) {
  const [selectedId, setSelectedId] = useState(stage.concepts[0]?.conceptId ?? null);
  const concept = useLearningQuery(selectedId ? LEARNING_PATHS.concept(selectedId) : null, conceptDecoder);
  return <>
    {stage.description && <Body>{stage.description}</Body>}
    {stage.concepts.length === 0 && <Notice>이 단계에 공개된 학습 개념이 없습니다.</Notice>}
    {stage.concepts.map(item => <LinkRow key={item.conceptId} title={`${item.conceptId === selectedId ? '선택됨 · ' : ''}${item.title}`} subtitle={item.shortDefinition ?? undefined} onPress={() => setSelectedId(item.conceptId)} />)}
    {selectedId && <ApiStatus resource={concept} label="개념 카드" empty={concept.data?.cards.length === 0} />}
    {concept.data && <>
      <Heading>{concept.data.title}</Heading>
      {concept.data.shortDefinition && <LerenCard title="개념" description={concept.data.shortDefinition} variant="info" />}
      {concept.data.cards.map(card => <LerenCard key={card.sectionId} title={card.title ?? `학습 카드 ${card.pageNo}`} description={card.body} />)}
      {concept.data.summary && <LerenCard title="핵심 정리" description={concept.data.summary} variant="reward" />}
      <LinkRow title="AI 튜터에게 질문" subtitle="실제 질문 전송은 별도 활성화가 필요합니다." onPress={() => router.push({ pathname: '/tutor', params: { concept: concept.data!.title } })} />
    </>}
    {stage.stageType === 'NORMAL'
      ? <LerenButton title="퀴즈 시작 화면으로" onPress={() => router.push({ pathname: '/quiz', params: { stageId: stage.stageId } })} />
      : <Notice>보스 응시는 아직 지원하지 않습니다.</Notice>}
    <LerenButton title="학습 단계 목록" variant="secondary" onPress={() => router.replace({ pathname: '/steps', params: { topicId: stage.topicId } })} />
  </>;
}
