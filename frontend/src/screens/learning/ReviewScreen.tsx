/** Figma 22-01, 22-02, 22-08~09, 22-12~14: 복습 노트 및 필터. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { ApiStatus } from '../../components/ui/ApiStatus';
import { Body, Heading, LinkRow, Notice } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import ReviewBookmark from '../../components/game/ReviewBookmark';
import { ReviewHero, ReviewPanel, ReviewPanelBody, ReviewPanelTitle, ReviewRow, ReviewTabs } from '../../components/game/ReviewFigmaUI.tsx';
import ReviewMissionScreen from './ReviewMissionScreen';
import { useAuth } from '../../context/AuthContext';
import { useBackend, useBackendAction } from '../../hooks/useBackend';
import { useLearningQuery } from '../../hooks/useLearningQuery';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { conceptDecoder, isLearningId, LEARNING_PATHS } from '../../services/learningApi';
import { STATISTICS_PATHS, conceptsDecoder } from '../../services/statisticsApi';
import { dueMissions, loadNotebookItems, REVIEW, reviewAttempt, type ReviewFilter, type ReviewItem } from '../../services/reviewApi';

const PAGE_SIZE = 10;
// 임무 목록에는 진행 중인 응시 ID가 없어서, 같은 로그인 세션에서만 재사용합니다.
const attemptsBySession = new WeakMap<object, Map<string, string>>();

export default function ReviewScreen() {
  const params = useLocalSearchParams<{ attemptId?: string; filter?: string }>();
  const { session } = useAuth();
  if (params.attemptId) {
    return isLearningId(params.attemptId)
      ? <ReviewMissionScreen key={params.attemptId} attemptId={params.attemptId} />
      : <Screen title="복습 임무" tabs><Notice tone="error">복습 응시 번호가 올바르지 않아요.</Notice><LerenButton title="복습 노트 보기" onPress={() => router.replace('/review')} /></Screen>;
  }
  const initialFilter: ReviewFilter = params.filter === 'WRONG' || params.filter === 'BOOKMARK' ? params.filter : 'ALL';
  return <Notebook key={`${session?.user.userId ?? 'guest'}:${initialFilter}`} initialFilter={initialFilter} />;
}

function ItemPreview({ item, conceptTitle, onBack, onSaved, onStart, busy, error }: {
  item: ReviewItem;
  conceptTitle: string;
  onBack: () => void;
  onSaved: (bookmarked: boolean) => void;
  onStart: () => void;
  busy: boolean;
  error: string;
}) {
  const concept = useBackend(item.conceptId ? LEARNING_PATHS.concept(item.conceptId) : null, conceptDecoder);
  const description = [item.wrongCount > 0 && `오답 ${item.wrongCount}회`, item.bookmarked && '헷갈림 저장됨'].filter(Boolean).join(' · ');
  return <Screen title={`${conceptTitle === '복습 문항' ? '문항' : conceptTitle} 복습`} tabs back onBack={onBack}>
    <ReviewHero title="복습 문항을 다시 확인해요" description="이곳에서는 문제를 미리 볼 수 있어요. 정식 복습을 시작하면 서버가 문제를 배정해요." />
    <ReviewPanel>
      <ReviewPanelTitle>{item.title}</ReviewPanelTitle>
      {item.choices.map((choice, i) => <Text key={choice.id} style={s.previewChoice}>{i + 1}  {choice.content}</Text>)}
    </ReviewPanel>
    {!!description && <ReviewPanel tone="muted"><ReviewPanelBody>지난 학습 기록 · {description}</ReviewPanelBody></ReviewPanel>}
    <ReviewBookmark key={item.questionId} questionId={item.questionId} initial={item.bookmarked} onSaved={onSaved} />
    {concept.data && <ReviewPanel tone="soft">
      <ReviewPanelTitle>{concept.data.title}</ReviewPanelTitle>
      <ReviewPanelBody>{concept.data.shortDefinition ?? concept.data.summary ?? '학습 개념을 다시 확인해 보세요.'}</ReviewPanelBody>
    </ReviewPanel>}
    {concept.status === 'error' && <Notice>개념 설명을 불러오지 못했지만 복습은 시작할 수 있어요.</Notice>}
    <LerenButton title="추천 문제 복습 시작" disabled={busy} loading={busy} onPress={onStart} />
    <Body muted>선택한 문항을 지정하는 API는 현재 없어요. 서버가 복습할 문제를 선정하므로 이 문항이 첫 번째로 나오지는 않을 수 있어요.</Body>
    {error ? <Notice tone="error">{error}</Notice> : null}
    <LerenButton title="복습 노트로 돌아가기" variant="secondary" onPress={onBack} />
    <LinkRow title="AI 튜터에게 질문" onPress={() => router.push({ pathname: '/tutor', params: { concept: concept.data?.title ?? item.conceptCode } })} />
  </Screen>;
}

function Notebook({ initialFilter }: { initialFilter: ReviewFilter }) {
  const { session } = useAuth();
  const token = session?.accessToken;
  const [filter, setFilter] = useState<ReviewFilter>(initialFilter);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ReviewItem | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const missions = useLearningQuery(REVIEW.due, dueMissions);
  // 백엔드 통계에는 개념의 실제 title이 들어 있습니다. 코드값을 이름으로 추측하지 않습니다.
  const concepts = useLearningQuery(STATISTICS_PATHS.concepts, conceptsDecoder);
  const start = useBackendAction();

  useFocusEffect(useCallback(() => { setReloadCount(count => count + 1); }, []));
  useEffect(() => {
    if (!token) { setItems([]); setLoadError('로그인 후 복습 노트를 확인해 주세요.'); setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    loadNotebookItems(token, controller.signal)
      .then(found => { if (!controller.signal.aborted) { setItems(found); setLoading(false); } })
      .catch((cause: unknown) => { if (!controller.signal.aborted) { setLoadError(cause instanceof Error ? cause.message : '복습 노트를 불러오지 못했어요.'); setLoading(false); } });
    return () => controller.abort();
  }, [token, reloadCount]);

  const conceptNames = useMemo(() => new Map((concepts.data?.items ?? []).map(c => [c.conceptId, c.title])), [concepts.data]);
  const eligible = useMemo(() => items.filter(item => filter === 'ALL' || (filter === 'WRONG' ? item.wrongCount > 0 : item.bookmarked)), [items, filter]);
  const shown = eligible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(eligible.length / PAGE_SIZE));
  const wrongCount = items.filter(item => item.wrongCount > 0).length;
  const bookmarkCount = items.filter(item => item.bookmarked).length;
  const bothCount = items.filter(item => item.wrongCount > 0 && item.bookmarked).length;
  const due = missions.data?.filter(m => m.status !== 'COMPLETED') ?? [];
  const label = (item: ReviewItem) => item.conceptId ? conceptNames.get(item.conceptId) ?? '복습 문항' : '복습 문항';
  const description = (item: ReviewItem) => [item.wrongCount > 0 ? `오답 ${item.wrongCount}회` : null, item.bookmarked ? '헷갈림' : null].filter(Boolean).join(' · ');
  const refresh = () => setReloadCount(value => value + 1);

  const startRecommended = async () => {
    if (start.busy) return;
    // 비어 있는 본문으로만 요청: 백엔드 requestDto.empty 계약과 일치합니다.
    const attempt = await start.run(REVIEW.recommendedStart, reviewAttempt, 'POST');
    if (!attempt) return;
    router.push({ pathname: '/review', params: { attemptId: attempt.attemptId } });
  };
  const openMission = async (missionId: string) => {
    if (!session || start.busy) return;
    let attemptId = attemptsBySession.get(session)?.get(missionId);
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

  if (selected) return <ItemPreview
    item={selected} conceptTitle={label(selected)} onBack={() => setSelected(null)}
    onSaved={bookmarked => { setSelected({ ...selected, bookmarked }); refresh(); }}
    onStart={() => void startRecommended()} busy={start.busy} error={start.error}
  />;

  return <Screen title="복습 노트" tabs back>
    <ReviewHero
      title={loading ? '복습 노트를 불러오고 있어요' : loadError ? '복습 정보를 확인해 주세요' : items.length > 0 ? '오답도, 헷갈린 문제도 다시 봐요' : '아직 모아 둔 복습 문항이 없어요'}
      description={items.length > 0
        ? `오답 ${wrongCount}문제 · 헷갈림 ${bookmarkCount}문제${bothCount > 0 ? ` · 겹치는 ${bothCount}문제` : ''}\n합쳐서 총 ${items.length}문제`
        : '퀴즈를 풀고 오답이나 헷갈리는 문제를 표시하면 이곳에 모여요.'}
    />
    {loading ? <View style={s.loading}><ActivityIndicator color={COLORS.primary} /><Body muted>복습 문항을 불러오는 중이에요.</Body></View> : null}
    {!!loadError && <><Notice tone="error">{loadError}</Notice><LerenButton title="복습 문항 다시 불러오기" variant="secondary" onPress={refresh} /></>}
    {!loading && !loadError && items.length === 0 ? <>
      <ReviewPanel tone="muted"><ReviewPanelTitle>새로운 개념을 만나볼까요?</ReviewPanelTitle><ReviewPanelBody>탐험 지도에서 학습을 시작해 보세요.</ReviewPanelBody></ReviewPanel>
      <LerenButton title="탐험 지도 보기" onPress={() => router.push('/explore')} />
      <LinkRow title="완료한 학습 다시 보기" subtitle="학습 달력" onPress={() => router.push('/calendar')} />
    </> : null}
    {!loading && !loadError && items.length > 0 ? <>
      <ReviewTabs selected={filter} onChange={value => { setFilter(value); setPage(1); }} />
      {filter !== 'ALL' && <Body muted>{filter === 'WRONG' ? '틀린 문제들을 다시 정리해요.' : '헷갈림으로 직접 체크한 문제들이에요.'}</Body>}
      {eligible.length ? <View style={s.list}>
        {shown.map((item, index) => <ReviewRow key={item.questionId}
          title={conceptNames.get(item.conceptId ?? '') ?? item.title}
          description={description(item)}
          last={index === shown.length - 1}
          onPress={() => setSelected(item)} />)}
      </View> : <ReviewPanel tone="muted">
        <ReviewPanelTitle>{filter === 'WRONG' ? '현재 오답 문항이 없어요' : '현재 헷갈림 문항이 없어요'}</ReviewPanelTitle>
        <ReviewPanelBody>다른 필터를 선택하면 저장된 복습 문제를 볼 수 있어요.</ReviewPanelBody>
      </ReviewPanel>}
      {pages > 1 && <View style={s.pagination}>
        <LerenButton title="‹ 이전" variant="secondary" style={s.pageButton} disabled={page <= 1} onPress={() => setPage(p => p - 1)} />
        <Text style={s.pageCount}>{page} / {pages}</Text>
        <LerenButton title="다음 ›" variant="secondary" style={s.pageButton} disabled={page >= pages} onPress={() => setPage(p => p + 1)} />
      </View>}
      <LerenButton title="추천 문제 복습 시작" onPress={() => void startRecommended()} disabled={start.busy} loading={start.busy} />
      <LinkRow title="개념별 학습 통계" subtitle="강점과 취약 개념 보기" onPress={() => router.push({ pathname: '/statistics', params: { tab: 'concepts' } })} />
    </> : null}
    {due.length > 0 && <View style={{ gap: 8 }}>
      <Heading>예정된 복습 임무</Heading>
      {due.map(m => <LerenButton key={m.missionId}
        title={`${m.dueDate} · ${m.count}문제 ${session && attemptsBySession.get(session)?.has(m.missionId) ? '이어풀기' : '복습하기'}`}
        variant="secondary" disabled={start.busy} onPress={() => void openMission(m.missionId)} />)}
    </View>}
    {missions.status === 'error' && <ApiStatus resource={missions} label="예정된 복습 임무" />}
    {!!start.error && <Notice tone="error">{start.error}</Notice>}
  </Screen>;
}

const s = StyleSheet.create({
  list: { borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.surface, borderRadius: 13, overflow: 'hidden' },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  previewChoice: { ...TYPOGRAPHY.body, fontSize: 15, lineHeight: 23, padding: 10, borderWidth: 1, borderRadius: 9, borderColor: COLORS.line, color: COLORS.ink },
  pagination: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between' },
  pageButton: { flex: 1, width: undefined },
  pageCount: { ...TYPOGRAPHY.label, color: COLORS.ink },
});
