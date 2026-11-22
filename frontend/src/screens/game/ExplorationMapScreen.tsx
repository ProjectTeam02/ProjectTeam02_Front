/** 경제 대륙 지도에서 실제 주제 ID로 단계 목록을 엽니다. */
import { useState } from 'react';
import { router } from 'expo-router';
import { ImageBackground, StyleSheet } from 'react-native';
import Screen from '../../components/ui/Screen';
import { Body, Heading, LinkRow } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenButton from '../../components/common/LerenButton';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StageCard from '../../components/game/StageCard';
import { continentImage } from '../../constants/stageImages';
import { useLearningQuery } from '../../hooks/useLearningQuery';
import { LEARNING_PATHS, topicsDecoder, stagesDecoder, type Topic } from '../../services/learningApi';

const labelY = [48, 154, 277, 393, 516, 628, 732, 830, 942];
const onMap = (topic: Topic) => topic.topicNo >= 1 && topic.topicNo <= labelY.length;
const openTopic = (topic: Topic) => router.push({ pathname: '/steps', params: { topicId: topic.topicId } });

function Region({ topic, onSelect }: { topic: Topic; onSelect: (message: string, locked: boolean) => void }) {
  const stages = useLearningQuery(LEARNING_PATHS.stages(topic.topicId), stagesDecoder);
  const items = stages.data?.items ?? [];
  const done = items.filter(item => item.progressStatus === 'PASSED').length;
  const locked = items.length > 0 && items.every(item => !item.isUnlocked && item.progressStatus !== 'PASSED');
  const message = locked ? '이전 단계 또는 선수 주제를 먼저 완료해 주세요.' : items.length ? done + ' / ' + items.length + '단계 완료' : '단계 보기';
  const status = !items.length ? 'overview' : locked ? 'locked' : done === items.length ? 'complete' : 'active';
  return <StageCard number={topic.topicNo} title={topic.title} status={status} progress={message}
    style={[s.card, { top: `${labelY[topic.topicNo - 1] / 1086 * 100}%` }, topic.topicNo % 2 ? s.right : s.left]}
    onPress={() => onSelect(message, locked)} />;
}
export default function ExplorationMapScreen() {
  const topics = useLearningQuery(LEARNING_PATHS.topics, topicsDecoder);
  const items = topics.data?.items ?? [];
  const [lockedTopic, setLockedTopic] = useState<Topic | null>(null);
  const [region, setRegion] = useState<{ topic: Topic; message: string } | null>(null);
  return <Screen title="경제 탐험" tabs contentPadding={14}
    right={topics.status === 'success' && items.length > 0 && <ApiStatus resource={topics} label="학습 주제" />}
    footer={region && <>
    <Body>{region.topic.title} · {region.message}</Body>
    <LerenButton title={region.topic.title + ' 단계 보기'} onPress={() => { setRegion(null); openTopic(region.topic); }} />
  </>}>
    <ConfirmDialog visible={!!lockedTopic} title={lockedTopic?.title + ' · 잠긴 지역'} message="선수 주제를 완료하면 이 지역이 열려요." confirmLabel="단계 살펴보기" cancelLabel="지도 보기" onCancel={() => setLockedTopic(null)} onConfirm={() => { if (lockedTopic) openTopic(lockedTopic); setLockedTopic(null); }} />
    <Heading>경제 대륙 지도</Heading>
    {items.length > 0 && <Body muted>아래로 스크롤해 {items.length}개 지역을 탐험하세요.</Body>}
    {(topics.status !== 'success' || !items.length) && <ApiStatus resource={topics} label="학습 주제" empty={items.length === 0} />}
    {items.some(onMap) && <ImageBackground source={continentImage} imageStyle={s.image} style={s.map}>
      {items.filter(onMap).map(topic => <Region key={topic.topicId} topic={topic} onSelect={(message, locked) => { if (locked) { setRegion(null); setLockedTopic(topic); } else setRegion({ topic, message }); }} />)}
    </ImageBackground>}
    {items.filter(topic => !onMap(topic)).map(topic => <LinkRow key={topic.topicId} title={topic.title}
      subtitle={topic.description ?? undefined} onPress={() => openTopic(topic)} />)}
  </Screen>;
}
const s = StyleSheet.create({
  image: { width: '100%', height: '100%' },
  map: { width: '100%', aspectRatio: 362 / 1086, overflow: 'hidden', borderRadius: 14 },
  card: { position: 'absolute', width: '49%', minHeight: 58, paddingVertical: 5, paddingHorizontal: 10, gap: 1 },
  right: { right: '2%' }, left: { left: '2%' },
});
