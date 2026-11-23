/** 응시 생성·복원과 서버 채점만 사용합니다. 제출 응답을 잃으면 같은 답·키로 재시도합니다. */
import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import ReviewBookmark from '../../components/game/ReviewBookmark';
import BattleScene from '../../components/game/BattleScene';
import { heroImage } from '../../constants/heroImage';
import Screen from '../../components/ui/Screen';
import { Body, Empty, Heading, Notice } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import LerenOption from '../../components/common/LerenOption';
import { useBackendAction } from '../../hooks/useBackend';
import { useLearningQuery } from '../../hooks/useLearningQuery';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { attemptDecoder, isLearningId, LEARNING_PATHS, stageDetailDecoder, submissionDecoder, submissionKey, type Submission } from '../../services/learningApi';

export default function QuizBattleScreen() {
  const { stageId, attemptId, kind, mode } = useLocalSearchParams<{ stageId?: string; attemptId?: string; kind?: string; mode?: string }>();
  const boss = kind === 'boss';
  const attempt = useLearningQuery(isLearningId(attemptId) ? (boss ? LEARNING_PATHS.bossAttempt(attemptId) : LEARNING_PATHS.attempt(attemptId)) : null, attemptDecoder);
  const activeStageId = attempt.data?.stageId ?? stageId;
  const stage = useLearningQuery(isLearningId(activeStageId) ? LEARNING_PATHS.stage(activeStageId) : null, stageDetailDecoder);
  const action = useBackendAction();
  const profile = useBackendProfile();
  const [selection, setSelection] = useState<{ questionId: string; choiceId: string } | null>(null);
  const [feedback, setFeedback] = useState<Submission | null>(null);
  const [proof, setProof] = useState<{ submissionId: string; attemptId: string; questionId: string; choiceId: string } | null>(null);
  if ((attemptId !== undefined && !isLearningId(attemptId)) || (!attemptId && !isLearningId(stageId))) {
    return <Screen title="퀴즈" tabs><Empty title="학습할 단계를 선택해 주세요" action="경제 탐험 보기" onPress={() => router.replace('/explore')} /></Screen>;
  }
  const openResult = (id: string) => router.replace({ pathname: '/result', params: { attemptId: id, kind: boss ? 'boss' : 'normal' } });
  const start = async () => {
    if (!stage.data || !stage.data.isUnlocked) return;
    const isBoss = stage.data.stageType === 'BOSS';
    const result = isBoss
      ? await action.run(LEARNING_PATHS.bossStart(stage.data.stageId), attemptDecoder, 'POST', { mode: mode === 'retry' || stage.data.progressStatus === 'PASSED' ? 'RETRY' : 'START' })
      : await action.run(LEARNING_PATHS.start(stage.data.stageId), attemptDecoder, 'POST');
    if (result) router.replace({ pathname: '/quiz', params: { stageId: result.stageId, attemptId: result.attemptId, kind: isBoss ? 'boss' : 'normal' } });
  };
  const question = attempt.data?.currentQuestion;
  const shownFeedback = feedback?.attemptId === attempt.data?.attemptId && feedback?.quizId === question?.id ? feedback : null;
  const selected = selection?.questionId === question?.id ? selection?.choiceId : null;
  const retryProof = proof?.attemptId === attempt.data?.attemptId && proof?.questionId === question?.id ? proof : null;
  const submit = async () => {
    if (!attempt.data || !question || shownFeedback || action.busy || (!selected && !retryProof)) return;
    // 첫 전송의 답을 고정합니다. 통신 오류 뒤 다른 답으로 바뀌어 중복 키 충돌이 나지 않게 합니다.
    const pending = retryProof ?? { submissionId: randomUUID(), attemptId: attempt.data.attemptId, questionId: question.id, choiceId: selected! };
    setProof(pending);
    const result = boss
      ? await action.run(LEARNING_PATHS.bossAnswer(pending.attemptId), submissionDecoder, 'POST', {
        submissionId: pending.submissionId, questionId: pending.questionId, choiceId: pending.choiceId,
      })
      : await action.run(LEARNING_PATHS.submit(pending.questionId), submissionDecoder, 'POST',
      { choiceId: pending.choiceId, attemptId: pending.attemptId }, submissionKey(pending.attemptId, pending.questionId));
    if (result) {
      setFeedback(result); setProof(null);
      if (result.status !== 'IN_PROGRESS') profile.reload();
    }
  };
  return <Screen title={stage.data?.stageType === 'BOSS' ? '보스 전투' : '퀴즈 전투'} tabs>
    {!attemptId ? <>
      <ApiStatus resource={stage} label="퀴즈 단계" />
      {stage.data && <>
        <BattleScene boss={stage.data.stageType === 'BOSS'} hero={heroImage(profile.data?.characterClass)} hp={stage.data.initialMonsterHp} maxHp={stage.data.initialMonsterHp} />
        <LerenCard title={stage.data.title} description={stage.data.description ?? undefined} />
        <>
          <Body>최대 {stage.data.maxQuestionCount}문제</Body>
          <LerenButton title={stage.data.stageType === 'BOSS' ? '보스 전투 시작·이어하기' : '퀴즈 시작·이어하기'} disabled={!stage.data.isUnlocked || action.busy} loading={action.busy} onPress={() => { void start(); }} />
          {!stage.data.isUnlocked && <Notice>이전 단계 또는 선수 주제를 먼저 완료해 주세요.</Notice>}
        </>
      </>}
    </> : <>
      <ApiStatus resource={attempt} label="나의 응시" />
      {attempt.data && <>
        {stage.data && <BattleScene boss={stage.data.stageType === 'BOSS'} hero={heroImage(profile.data?.characterClass)} hp={shownFeedback?.hpAfter ?? attempt.data.hp} maxHp={stage.data.initialMonsterHp} feedback={shownFeedback} />}
        <Body>{attempt.data.attemptNo}번째 도전 · 제출 {shownFeedback?.submittedCount ?? attempt.data.submittedCount}/{attempt.data.maxQuestionCount}{!stage.data && ` · HP ${shownFeedback?.hpAfter ?? attempt.data.hp}`}</Body>
        {attempt.data.status !== 'IN_PROGRESS'
          ? <LerenButton title="저장된 결과 보기" onPress={() => openResult(attempt.data!.attemptId)} />
          : question && <>
            <Heading>{question.title}</Heading>
            {question.choices.map((choice, index) => <LerenOption key={choice.id} number={index + 1} title={choice.content}
              state={selected === choice.id ? shownFeedback ? shownFeedback.isCorrect ? 'correct' : 'wrong' : 'selected' : 'default'}
              disabled={action.busy || !!shownFeedback || !!retryProof}
              onPress={() => setSelection({ questionId: question.id, choiceId: choice.id })} />)}
            {shownFeedback ? <>
              <Notice tone={shownFeedback.isCorrect ? 'success' : 'error'}>{shownFeedback.isCorrect ? '정답입니다.' : '오답입니다.'}</Notice>
              <ReviewBookmark key={question.id} questionId={question.id} />
              <LerenCard title="해설" description={shownFeedback.explanation ?? '등록된 해설이 없습니다.'} />
              <LerenButton title={shownFeedback.status === 'IN_PROGRESS' ? '다음 문제' : '저장된 결과 보기'} onPress={() => {
                if (shownFeedback.status === 'IN_PROGRESS') attempt.reload(); else openResult(shownFeedback.attemptId);
              }} />
            </> : <>
              <LerenButton title={retryProof ? '같은 답안 다시 전송' : '답 제출하기'} disabled={action.busy || (!selected && !retryProof)} loading={action.busy} onPress={() => { void submit(); }} />
              {!!retryProof && <Notice>이 답안의 저장 여부가 아직 확인되지 않았습니다. 같은 답으로 재시도하거나 응시를 다시 조회해 주세요.</Notice>}
              {!!retryProof && <LerenButton title="진행 상태 다시 확인" variant="secondary" disabled={action.busy} onPress={attempt.reload} />}
            </>}
          </>}
      </>}
    </>}
    {!!action.error && <Notice tone="error">{action.error}</Notice>}
    <Body muted>문제마다 한 번씩 답을 제출할 수 있어요.</Body>
  </Screen>;
}
