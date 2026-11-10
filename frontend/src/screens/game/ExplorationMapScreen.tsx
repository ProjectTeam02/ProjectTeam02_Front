/** 정식 주제 목록을 EC2에서 조회합니다. 잠금·완료 여부는 다음 단계의 서버 응답을 사용합니다. */
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, LinkRow, Notice } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenCard from '../../components/common/LerenCard';
import { useLearningQuery } from '../../hooks/useLearningQuery';
import { LEARNING_PATHS, topicsDecoder } from '../../services/learningApi';

export default function ExplorationMapScreen() {
  const topics = useLearningQuery(LEARNING_PATHS.topics, topicsDecoder);
  return <Screen title="경제 탐험" back tabs>
    <Body>학습할 경제 주제를 선택해 주세요.</Body>
    <ApiStatus resource={topics} label="학습 주제" empty={topics.data?.items.length === 0} />
    {topics.data?.items.map(topic => <LerenCard key={topic.topicId} title={`${topic.topicNo}. ${topic.title}`} description={topic.description ?? undefined}>
      <LinkRow title="학습 단계 보기" onPress={() => router.push({ pathname: '/steps', params: { topicId: topic.topicId } })} />
    </LerenCard>)}
    {topics.data?.items.length === 0 && <Notice>현재 공개된 학습 주제가 없습니다. 자료가 등록되면 다시 조회해 주세요.</Notice>}
  </Screen>;
}
