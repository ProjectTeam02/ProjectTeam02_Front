/** 복습 노트의 오답·북마크와 도래한 임무를 로그인한 사용자의 서버 기록으로 표시합니다. */
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { ApiStatus } from '../../components/ui/ApiStatus';
import { Body, Chip, Empty, Heading, LinkRow, Notice, Row } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import ReviewBookmark from '../../components/game/ReviewBookmark';
import ReviewMissionScreen from './ReviewMissionScreen';
import { useAuth } from '../../context/AuthContext';
import { useLearningQuery } from '../../hooks/useLearningQuery';
import { useBackendAction } from '../../hooks/useBackend';
import { isLearningId } from '../../services/learningApi';
import { dueMissions, REVIEW, reviewAttempt, reviewPage, type ReviewFilter, type ReviewItem } from '../../services/reviewApi';

const filters = { ALL: '전체', WRONG: '오답', BOOKMARK: '헷갈림' } as const;
// 임무 목록에는 응시 ID가 없으므로 현재 로그인 세션에서 이미 시작한 응시를 기억합니다.
const attemptsBySession = new WeakMap<object, Map<string, string>>();

export default function ReviewScreen() {
  const params = useLocalSearchParams<{ attemptId?: string; filter?: string }>();
  const { session } = useAuth();
  if (params.attemptId) {
    return isLearningId(params.attemptId)
      ? <ReviewMissionScreen key={params.attemptId} attemptId={params.attemptId} />
      : <Screen title="복습 임무" tabs><Empty title="복습 임무를 찾을 수 없어요" action="복습 노트 보기" onPress={() => router.replace('/review')} /></Screen>;
  }
  const filter = params.filter === 'WRONG' || params.filter === 'BOOKMARK' ? params.filter : 'ALL';
  return <Notebook key={JSON.stringify([session?.user.userId, filter])} initialFilter={filter} />;
}

function Notebook({ initialFilter }: { initialFilter: ReviewFilter }) {
  const { session } = useAuth();
  const [filter, setFilter] = useState(initialFilter);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ReviewItem | null>(null);
  const items = useLearningQuery(REVIEW.items(filter, page), reviewPage);
  const missions = useLearningQuery(REVIEW.due, dueMissions);
  const start = useBackendAction();
  const openMission = async (missionId: string) => {
    if (!session) return;
    const previous = attemptsBySession.get(session)?.get(missionId);
    let attemptId = previous;
    if (!attemptId) {
      const attempt = await start.run(REVIEW.start(missionId), reviewAttempt, 'POST');
      if (!attempt) return;
      attemptId = attempt.attemptId;
      const cache = attemptsBySession.get(session) ?? new Map<string, string>();
      cache.set(missionId, attemptId);
      attemptsBySession.set(session, cache);
    }
    router.push({ pathname: '/review', params: { attemptId } });
  };

  if (selected) return <Screen title="복습 문항" back tabs onBack={() => setSelected(null)}>
    <Heading>{selected.title}</Heading>
    {selected.choices.map((choice, i) => <Body key={choice.id}>{i + 1}. {choice.content}</Body>)}
    <ReviewBookmark key={selected.questionId} questionId={selected.questionId} initial={selected.bookmarked}
      onSaved={bookmarked => { setSelected({ ...selected, bookmarked }); items.reload(); }} />
    <LinkRow title="AI 튜터에게 질문" onPress={() => router.push({ pathname: '/tutor', params: { concept: selected.conceptCode } })} />
    <LerenButton title="복습 노트로 돌아가기" variant="secondary" onPress={() => setSelected(null)} />
  </Screen>;

  const due = missions.data?.filter(m => m.status !== 'COMPLETED');
  const entries = items.data?.items.filter(item => item.wrongCount > 0 || item.bookmarked);
  return <Screen title="복습 노트" back tabs>
    <Heading>오늘의 복습 임무</Heading>
    <ApiStatus resource={missions} label="복습 임무" />
    {due?.length === 0 && <Body muted>오늘 예정된 복습 임무가 없어요.</Body>}
    {due?.map(m => <LerenButton key={m.missionId}
      title={m.dueDate + ' · ' + m.count + '문제 ' + (session && attemptsBySession.get(session)?.has(m.missionId) ? '이어풀기' : '복습하기')}
      disabled={start.busy} onPress={() => void openMission(m.missionId)} />)}
    {!!start.error && <Notice tone="error">{start.error}</Notice>}
    <LerenCard title="오답·헷갈림 노트" description="틀렸거나 헷갈림에 저장한 문제를 다시 확인해요." variant="info" />
    <Row>{(Object.keys(filters) as ReviewFilter[]).map(key => <Chip key={key} label={filters[key]} active={filter === key}
      onPress={() => { setPage(1); setFilter(key); }} />)}</Row>
    <ApiStatus resource={items} label="복습 문항" />
    {entries?.map(item => <LinkRow key={item.questionId} title={item.title}
      subtitle={[item.wrongCount > 0 && '오답 ' + item.wrongCount + '회', item.bookmarked && '헷갈림'].filter(Boolean).join(' · ')}
      onPress={() => setSelected(item)} />)}
    {entries?.length === 0 && <Empty title={items.data && items.data.total > items.data.size ? '이 페이지에 표시할 문항이 없어요' : '저장된 복습 문항이 없어요'} />}
    {page > 1 && <LerenButton title="이전 페이지" variant="secondary" onPress={() => setPage(page - 1)} />}
    {items.data && page * items.data.size < items.data.total && <LerenButton title="다음 페이지" variant="secondary" onPress={() => setPage(page + 1)} />}
    <LinkRow title="개념별 학습 통계" subtitle="강점과 취약 개념 보기" onPress={() => router.push({ pathname: '/statistics', params: { tab: 'concepts' } })} />
  </Screen>;
}
