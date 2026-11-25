/** Figma 22-03~07, 22-10~11, 22-15~18: 복습 응시·채점·해설·결과. */
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { ApiStatus } from '../../components/ui/ApiStatus';
import { Body, Notice, Progress } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import LerenOption from '../../components/common/LerenOption';
import ReviewBookmark from '../../components/game/ReviewBookmark';
import { ReviewHero, ReviewPanel, ReviewPanelBody, ReviewPanelTitle, ReviewRow, ReviewStats } from '../../components/game/ReviewFigmaUI.tsx';
import { useAuth } from '../../context/AuthContext';
import { useBackend, useBackendAction } from '../../hooks/useBackend';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { conceptDecoder, LEARNING_PATHS } from '../../services/learningApi';
import { loadAttemptItems, REVIEW, reviewAttempt, type ReviewAttempt, type ReviewItem } from '../../services/reviewApi';

export default function ReviewMissionScreen({ attemptId }: { attemptId: string }) {
  const resource = useBackend(REVIEW.attempt(attemptId), reviewAttempt);
  if (resource.data) return <Mission key={resource.data.attemptId} initial={resource.data} reload={resource.reload} />;
  return <Screen title="복습 문제" back tabs>
    <ApiStatus resource={resource} label="복습 응시" />
    <LerenButton title="복습 노트로 돌아가기" variant="secondary" onPress={() => router.replace('/review')} />
  </Screen>;
}

function Mission({ initial, reload }: { initial: ReviewAttempt; reload: () => void }) {
  const { session } = useAuth();
  const token = session?.accessToken;
  const [attempt, setAttempt] = useState(initial);
  const [loadResult, setLoadResult] = useState<{
    token: string;
    initial: ReviewAttempt;
    retry: number;
    items: Record<string, ReviewItem> | null;
    error: string;
  } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [showConcept, setShowConcept] = useState(false);
  const [retry, setRetry] = useState(0);
  const currentLoad = loadResult &&
    loadResult.token === token &&
    loadResult.initial === initial &&
    loadResult.retry === retry
    ? loadResult : null;
  const items = currentLoad?.items ?? null;
  const loadError = currentLoad?.error ?? '';
  const action = useBackendAction();

  // 배정된 문제의 ID만 응시에 포함되므로 복습 목록에서 실제 문항 본문을 다시 찾습니다.
  useEffect(() => {
    if (!token || initial.status === 'COMPLETED') return;
    const controller = new AbortController();
    loadAttemptItems(token, initial.answers.map(a => a.questionId), controller.signal)
      .then(found => {
        if (!controller.signal.aborted) {
          setLoadResult({ token, initial, retry, items: found, error: '' });
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setLoadResult({
            token, initial, retry, items: null,
            error: cause instanceof Error ? cause.message : '복습 문항을 불러오지 못했어요.',
          });
        }
      });
    return () => controller.abort();
  }, [token, initial, retry]);

  const feedback = attempt.answers.find(a => a.submissionId === feedbackId);
  const answer = feedback ?? attempt.answers.find(a => a.choiceId === null);
  const question = answer && items?.[answer.questionId];
  const concept = useBackend(question?.conceptId ? LEARNING_PATHS.concept(question.conceptId) : null, conceptDecoder);
  const conceptTitle = concept.data?.title ?? '복습';
  const checked = question ? bookmarks[question.questionId] ?? question.bookmarked : false;
  const lastSubmitted = attempt.answers.filter(a => a.choiceId !== null).at(-1);

  const submit = async () => {
    if (!answer || !selected || feedback || action.busy) return;
    // 응답이 유실되었을 때도 submissionId, choiceId를 그대로 재전송해 중복 채점을 방지합니다.
    setSent(true);
    const updated = await action.run(REVIEW.answers(attempt.attemptId), reviewAttempt, 'POST', {
      submissionId: answer.submissionId,
      questionId: answer.questionId,
      choiceId: selected,
    });
    if (updated) {
      setAttempt(updated);
      setFeedbackId(answer.submissionId);
      setShowConcept(false);
    }
  };

  const next = () => {
    setFeedbackId(null);
    setSelected(null);
    setSent(false);
    setShowConcept(false);
  };

  // 마지막 문제의 해설을 읽고 '복습 결과 확인'을 눌러야 결과 화면으로 넘어갑니다.
  if (!feedback && attempt.status === 'COMPLETED') return <Screen title="복습 결과" tabs back>
    <ReviewHero title="복습을 마쳤어요!" description="한 번 더 개념을 정리했어요. 다음 학습에도 활용해 보세요." />
    <ReviewStats count={attempt.submitted} correct={attempt.correct} />
    <ReviewPanel tone="muted">
      <ReviewPanelTitle>복습 결과가 저장되었어요</ReviewPanelTitle>
      <ReviewPanelBody>이번 복습의 정답 수와 완료 상태가 서버에 저장되었습니다.</ReviewPanelBody>
    </ReviewPanel>
    <LerenButton title="다른 개념 복습하기" onPress={() => router.replace('/review')} />
    <LerenButton title="홈으로 돌아가기" variant="secondary" onPress={() => router.replace('/home')} />
    <ReviewPanel tone="default">
      <ReviewRow title="나의 학습 통계" description="정답률과 학습 성과 확인하기" last onPress={() => router.push('/statistics')} />
    </ReviewPanel>
  </Screen>;

  return <Screen title={`${conceptTitle} 문제`} back tabs>
    {answer && <View style={s.progressBox}>
      <View style={s.progressRow}>
        <Text style={s.progressLabel}>복습 문제</Text>
        <Text style={s.progressCount}>{answer.order} / {attempt.count}</Text>
      </View>
      <Progress value={answer.order / Math.max(1, attempt.count)} />
    </View>}

    {question ? <>
      {!feedback && <>
        <Text style={s.questionTitle}>{question.title}</Text>
        <View style={s.options}>
          {question.choices.map((choice, i) => <LerenOption key={choice.id} number={i + 1} title={choice.content}
            state={choice.id === selected ? 'selected' : 'default'}
            disabled={sent || action.busy}
            onPress={() => setSelected(choice.id)} />)}
        </View>
        <View style={s.bookmarkArea}>
          <ReviewBookmark key={question.questionId} questionId={question.questionId} initial={checked}
            onSaved={value => setBookmarks(state => ({ ...state, [question.questionId]: value }))} />
        </View>
        <Text style={s.help}>정답을 고른 뒤 제출해 주세요. 헷갈린 문항은 직접 체크해서 보관할 수 있어요.</Text>
        <LerenButton title={sent ? '같은 답안 다시 전송' : '답안 제출'} disabled={!selected || action.busy} loading={action.busy} onPress={() => void submit()} />
        <LerenButton title={showConcept ? '개념 설명 닫기' : '개념 다시 보기'} variant="secondary" onPress={() => setShowConcept(v => !v)} />
        {showConcept && <ReviewPanel tone="soft">
          <ReviewPanelTitle>{concept.data?.title ?? '관련 학습 개념'}</ReviewPanelTitle>
          <ReviewPanelBody>{concept.data?.shortDefinition ?? concept.data?.summary ?? '개념 설명을 불러오는 중이거나 제공되지 않았어요.'}</ReviewPanelBody>
        </ReviewPanel>}
        <ReviewPanel tone="muted">
          <ReviewPanelTitle>이전 학습 기록 · 오답 / 헷갈림 체크</ReviewPanelTitle>
          <ReviewPanelBody>
            {question.wrongCount > 0 ? `과거 오답 ${question.wrongCount}회` : '저장된 오답 횟수 없음'} · {checked ? '헷갈림 체크됨' : '헷갈림 미체크'}
          </ReviewPanelBody>
        </ReviewPanel>
      </>}

      {feedback && <>
        <ReviewHero title={feedback.isCorrect ? '정답이에요!' : '다시 기억해 봐요'}
          description={feedback.isCorrect ? `${conceptTitle} 개념을 잘 확인했어요.` : '문제의 해설을 읽고 관련 개념을 다시 확인해요.'}
          character={false} />
        <ReviewPanel tone="soft">
          <ReviewPanelTitle>{feedback.isCorrect ? '정답' : '제출 결과'} · {concept.data?.title ?? '문제 해설'}</ReviewPanelTitle>
          <ReviewPanelBody>{feedback.explanation ?? '서버에서 별도의 문제 해설을 제공하지 않았어요.'}</ReviewPanelBody>
        </ReviewPanel>
        <ReviewPanel tone="muted">
          <ReviewPanelTitle>다시 기억해요</ReviewPanelTitle>
          <ReviewPanelBody>{concept.data?.summary ?? concept.data?.shortDefinition ?? '관련 경제 개념을 확인하고 다음 복습 문제로 넘어가 보세요.'}</ReviewPanelBody>
        </ReviewPanel>
        <View style={s.bookmarkArea}>
          <ReviewBookmark key={question.questionId} questionId={question.questionId} initial={checked}
            onSaved={value => setBookmarks(state => ({ ...state, [question.questionId]: value }))} />
        </View>
        <ReviewPanel tone="default">
          <ReviewRow title="더 쉽게 설명해 주세요" description="AI 튜터에게 질문" last
            onPress={() => router.push({ pathname: '/tutor', params: { concept: concept.data?.title ?? question.conceptCode } })} />
        </ReviewPanel>
        <LerenButton title={attempt.status === 'COMPLETED' ? '복습 결과 확인' : '다음 복습 문제'} onPress={next} />
        <Text style={s.help}>헷갈림 체크는 정답 여부와 별도로 저장됩니다. 해제해도 과거 오답 기록은 삭제되지 않아요.</Text>
      </>}
    </> : !loadError && !items ? <View style={s.loading}><ActivityIndicator color={COLORS.primary} /><Body muted>복습 문제를 불러오는 중이에요.</Body></View>
      : <>
        <Notice tone="error">{loadError || '배정된 문항을 찾지 못했어요. 다시 불러와 주세요.'}</Notice>
        <LerenButton title="복습 문항 다시 조회" variant="secondary" onPress={() => { setRetry(v => v + 1); reload(); }} />
      </>}

    {!!action.error && <>
      <Notice tone="error">{action.error}</Notice>
      <LerenButton title="서버 저장 상태 다시 확인" variant="secondary" onPress={reload} />
    </>}
    {lastSubmitted && !feedback && attempt.submitted > 0 && <Text style={s.help}>현재 복습에서 앞서 답변한 {attempt.submitted}개 문항이 저장되어 있어요.</Text>}
  </Screen>;
}

const s = StyleSheet.create({
  progressBox: { gap: 9, marginBottom: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { ...TYPOGRAPHY.label, fontSize: 16, lineHeight: 23, color: COLORS.ink },
  progressCount: { ...TYPOGRAPHY.label, fontSize: 14, lineHeight: 23, color: COLORS.primary },
  questionTitle: { ...TYPOGRAPHY.heading, fontSize: 20, lineHeight: 29, color: COLORS.ink },
  options: { gap: 8 },
  bookmarkArea: { backgroundColor: '#E9EFFF', borderRadius: 13, padding: 4 },
  help: { ...TYPOGRAPHY.small, fontSize: 12, lineHeight: 19, color: COLORS.muted },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
});

