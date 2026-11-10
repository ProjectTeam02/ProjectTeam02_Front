/** 저장된 응시 결과를 다시 조회합니다. 로컬 정답 수·가상 보상으로 결과를 만들지 않습니다. */
import { useCallback } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Empty, Heading, Notice } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenCard from '../../components/common/LerenCard';
import LerenButton from '../../components/common/LerenButton';
import { useLearningQuery } from '../../hooks/useLearningQuery';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { isLearningId, LEARNING_PATHS, resultDecoder, stageDetailDecoder } from '../../services/learningApi';

export default function ResultScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId?: string }>();
  const result = useLearningQuery(isLearningId(attemptId) ? LEARNING_PATHS.result(attemptId) : null, resultDecoder);
  const stage = useLearningQuery(result.data ? LEARNING_PATHS.stage(result.data.stageId) : null, stageDetailDecoder);
  const profile = useBackendProfile();
  const reloadProfile = profile.reload;
  useFocusEffect(useCallback(() => { reloadProfile(); }, [reloadProfile]));
  if (!isLearningId(attemptId)) return <Screen title="학습 결과" tabs><Empty title="저장된 응시를 선택해 주세요" action="경제 탐험 보기" onPress={() => router.replace('/explore')} /></Screen>;
  return <Screen title="학습 결과" tabs>
    <ApiStatus resource={result} label="저장된 결과" />
    {result.data && <>
      <LerenCard variant={result.data.status === 'PASSED' ? 'success' : 'error'}>
        <Heading>{result.data.status === 'PASSED' ? '학습 완료' : '다시 도전해 볼까요?'}</Heading>
        {stage.data && <Body>{stage.data.title}</Body>}
        <Body>제출 {result.data.submittedCount}/{result.data.maxQuestionCount} · 정답 {result.data.correctCount}개 · 남은 HP {result.data.hp}</Body>
      </LerenCard>
      <Notice>{result.data.rewardGranted ? '최초 통과 보상이 서버에서 지급 처리되었습니다.' : '이 응시에서 추가 지급된 보상은 없습니다.'}</Notice>
      <ApiStatus resource={profile} label="최신 성장·코인" />
      {profile.data && <Body>전체 EXP {profile.data.totalExp ?? '정보 없음'} · 경제 EXP {profile.data.economyExp ?? '정보 없음'} · 보유 코인 {profile.data.coinBalance ?? '정보 없음'}</Body>}
      <LerenButton title="다시 도전하기" variant="secondary" onPress={() => router.replace({ pathname: '/quiz', params: { stageId: result.data!.stageId } })} />
      {stage.data && <LerenButton title="다음 학습 단계 보기" onPress={() => router.replace({ pathname: '/steps', params: { topicId: stage.data!.topicId } })} />}
    </>}
    <LerenButton title="학습 이력 보기" variant="secondary" onPress={() => router.push('/statistics')} />
    <LerenButton title="홈으로" variant="secondary" onPress={() => router.replace('/home')} />
  </Screen>;
}
