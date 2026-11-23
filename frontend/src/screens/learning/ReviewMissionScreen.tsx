/** 서버에 저장된 복습 응시를 복원하고, 배정된 제출 식별자로 답안과 해설을 연결합니다. */
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { ApiStatus } from '../../components/ui/ApiStatus';
import { Body, Heading, LinkRow, Notice, Progress } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import LerenOption from '../../components/common/LerenOption';
import ReviewBookmark from '../../components/game/ReviewBookmark';
import { useAuth } from '../../context/AuthContext';
import { useBackend, useBackendAction } from '../../hooks/useBackend';
import { loadAttemptItems, REVIEW, reviewAttempt, type ReviewAttempt, type ReviewItem } from '../../services/reviewApi';

export default function ReviewMissionScreen({ attemptId }: { attemptId: string }) {
  const attempt = useBackend(REVIEW.attempt(attemptId), reviewAttempt);
  return attempt.data ? <Mission initial={attempt.data} reload={attempt.reload} /> :
    <Screen title="복습 임무" back tabs><ApiStatus resource={attempt} label="복습 임무" /></Screen>;
}

function Mission({ initial, reload }: { initial: ReviewAttempt; reload: () => void }) {
  const { session } = useAuth();
  const token = session?.accessToken;
  const [attempt, setAttempt] = useState(initial);
  const [items, setItems] = useState<Record<string, ReviewItem> | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const action = useBackendAction();
  useEffect(() => {
    if (!token || initial.status === 'COMPLETED') return;
    const controller = new AbortController();
    loadAttemptItems(token, initial.answers.map(a => a.questionId), controller.signal)
      .then(found => { if (!controller.signal.aborted) setItems(found); })
      .catch(() => { if (!controller.signal.aborted) setError('복습 문항을 불러오지 못했어요.'); });
    return () => controller.abort();
  }, [token, initial]);

  const feedback = attempt.answers.find(a => a.submissionId === feedbackId);
  const answer = feedback ?? attempt.answers.find(a => a.choiceId === null);
  const question = answer && items?.[answer.questionId];
  const submit = async () => {
    if (!answer || !selected || feedback || action.busy) return;
    // 응답을 못 받은 경우에도 같은 선택지와 제출 ID를 사용해 중복 채점을 방지합니다.
    setSent(true);
    const updated = await action.run(REVIEW.answers(attempt.attemptId), reviewAttempt, 'POST', {
      submissionId: answer.submissionId, questionId: answer.questionId, choiceId: selected,
    });
    if (updated) { setAttempt(updated); setFeedbackId(answer.submissionId); }
  };

  if (!feedback && attempt.status === 'COMPLETED') return <Screen title="복습 결과" back tabs>
    <LerenCard title="복습을 마쳤어요!" description={'푼 문제 ' + attempt.submitted + '개 · 정답 ' + attempt.correct + '개'} variant="success" />
    <LerenButton title="복습 노트로 돌아가기" onPress={() => router.replace('/review')} />
    <LinkRow title="나의 학습 통계" onPress={() => router.push('/statistics')} />
  </Screen>;

  return <Screen title="복습 임무" back tabs>
    {answer && <><Body>복습 문제 {answer.order} / {attempt.count}</Body><Progress value={answer.order / Math.max(1, attempt.count)} /></>}
    {question ? <>
      <Heading>{question.title}</Heading>
      {question.choices.map((choice, i) => <LerenOption key={choice.id} number={i + 1} title={choice.content}
        state={choice.id !== (feedback?.choiceId ?? selected) ? 'default' : feedback ? feedback.isCorrect ? 'correct' : 'wrong' : 'selected'}
        disabled={sent || action.busy} onPress={() => setSelected(choice.id)} />)}
      {feedback ? <>
        <LerenCard title={feedback.isCorrect ? '정답이에요!' : '다시 기억해 봐요'} description={feedback.explanation ?? undefined}
          variant={feedback.isCorrect ? 'success' : 'error'} />
        <ReviewBookmark key={question.questionId} questionId={question.questionId} initial={question.bookmarked} />
        <LerenButton title={attempt.status === 'COMPLETED' ? '복습 결과 보기' : '다음 문항'}
          onPress={() => { setSelected(null); setSent(false); setFeedbackId(null); }} />
        <LinkRow title="AI 튜터에게 질문" onPress={() => router.push({ pathname: '/tutor', params: { concept: question.conceptCode } })} />
      </> : <LerenButton title={sent ? '같은 답안 다시 전송' : '답 제출하기'} disabled={!selected || action.busy}
        loading={action.busy} onPress={() => void submit()} />}
    </> : !error && !items ? <Body muted>문항을 불러오는 중이에요.</Body> :
      <><Notice>{error || '배정된 문항을 확인할 수 없어요.'}</Notice><LerenButton title="다시 조회" onPress={reload} /></>}
    {!!action.error && <><Notice tone="error">{action.error}</Notice><LerenButton title="저장 상태 확인" variant="secondary" onPress={reload} /></>}
  </Screen>;
}
