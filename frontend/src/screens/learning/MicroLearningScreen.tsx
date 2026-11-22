import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/ui/Screen';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Body, Chip, Empty, Heading, LinkRow, Notice, Row } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenCard from '../../components/common/LerenCard';
import LerenButton from '../../components/common/LerenButton';
import { useBackend, useBackendAction } from '../../hooks/useBackend';
import { useAuth } from '../../context/AuthContext';
import { backendRequest, object } from '../../services/backend';
import { activeProgressDecoder, conceptDecoder, isLearningId, LEARNING_PATHS, stageDetailDecoder, type Concept, type StageDetail } from '../../services/learningApi';

export default function MicroLearningScreen() {
  const { stageId } = useLocalSearchParams<{ stageId?: string }>();
  const stage = useBackend(isLearningId(stageId) ? LEARNING_PATHS.stage(stageId) : null, stageDetailDecoder);
  if (!isLearningId(stageId)) return <Screen title="학습" tabs><Empty title="학습 단계를 선택해 주세요" action="경제 탐험 보기" onPress={() => router.replace('/explore')} /></Screen>;
  if (stage.data?.isUnlocked) return <Lesson key={stageId} stage={stage.data} />;
  return <Screen title="학습 내용" tabs><ApiStatus resource={stage} label="학습 내용" />{stage.data && <Notice>이전 단계 또는 선수 주제를 먼저 완료해 주세요.</Notice>}</Screen>;
}

function Lesson({ stage }: { stage: StageDetail }) {
  const { session } = useAuth();
  const token = session?.accessToken;
  const progress = useBackend(stage.stageType === 'NORMAL' ? LEARNING_PATHS.active : null, activeProgressDecoder);
  const save = useBackendAction();
  const [concepts, setConcepts] = useState<Concept[] | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [summary, setSummary] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    Promise.all(stage.concepts.map(c => backendRequest(token, LEARNING_PATHS.concept(c.conceptId), conceptDecoder, { signal: controller.signal })))
      .then(data => { if (!controller.signal.aborted) setConcepts(data); })
      .catch((e: Error) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [stage, token, retry]);
  const pages = (concepts ?? []).flatMap(concept => {
    const pageNos = [...new Set(concept.cards.map(card => card.pageNo))];
    return (pageNos.length ? pageNos : [0]).map(no => ({ concept, cards: concept.cards.filter(card => card.pageNo === no) }));
  });
  const saved = progress.data?.find(p => p.stageId === stage.stageId)?.position ?? 1;
  const position = Math.min(picked ?? saved, pages.length);
  const page = pages[position - 1];
  const back = () => router.canGoBack() ? router.back() : router.replace({ pathname: '/steps', params: { topicId: stage.topicId } });
  const checkpoint = async (n: number) => save.run(LEARNING_PATHS.progress(stage.stageId), object, 'PUT', { contentPosition: n });
  const go = async (n: number) => {
    if (save.busy) return;
    setPicked(n); setSummary(false);
    if (stage.stageType === 'NORMAL' && stage.progressStatus !== 'PASSED') await checkpoint(n);
  };
  const canSave = !!page && stage.stageType === 'NORMAL' && stage.progressStatus !== 'PASSED';
  const exit = () => canSave ? setLeaving(true) : back();
  return <Screen title={stage.title} tabs onBack={exit}>
    <ConfirmDialog visible={leaving} title="여기까지 학습할까요?" message={save.error || `현재 ${position}쪽을 저장하면 홈에서 이어볼 수 있어요.`}
      cancelLabel="계속 학습" confirmLabel="저장하고 나가기" busy={save.busy} onCancel={() => setLeaving(false)}
      onConfirm={async () => { if (await checkpoint(position)) { setLeaving(false); back(); } }} />
    <Body muted>{stage.stageCode} · {stage.stageType === 'BOSS' ? '보스 전투' : '개념 학습'}</Body>
    {!!stage.description && <Body>{stage.description}</Body>}
    {!!error && <><Notice tone="error">{error}</Notice><LerenButton title="학습 내용 다시 불러오기" onPress={() => { setError(''); setRetry(v => v + 1); }} /></>}
    {!error && !concepts && <Body muted>학습 내용을 불러오고 있어요.</Body>}
    {progress.status === 'error' && <ApiStatus resource={progress} label="저장한 페이지" />}
    {page && progress.status !== 'loading' && <>
      {concepts && concepts.length > 1 && <Row style={{ flexWrap: 'wrap' }}>{concepts.map(c => <Chip key={c.conceptId} label={c.title} active={c.conceptId === page.concept.conceptId} onPress={() => void go(pages.findIndex(p => p.concept === c) + 1)} />)}</Row>}
      <Body muted>개념 읽기 · {position} / {pages.length}쪽</Body><Heading>{page.concept.title}</Heading>
      {!!page.concept.shortDefinition && <LerenCard title="개념" description={page.concept.shortDefinition} variant="info" />}
      {page.cards.map(card => <LerenCard key={card.sectionId} title={card.title ?? undefined} description={card.body} />)}
      <Row><LerenButton style={{ flex: 1 }} variant="secondary" title="이전 쪽" disabled={save.busy || position <= 1} onPress={() => void go(position - 1)} />
        <LerenButton style={{ flex: 1 }} title="다음 쪽" disabled={save.busy || position >= pages.length} onPress={() => void go(position + 1)} /></Row>
      {!!page.concept.summary && <>{summary && <LerenCard title="핵심 정리" description={page.concept.summary} />}<LerenButton variant="secondary" title={summary ? '핵심 정리 접기' : '핵심 정리 보기'} onPress={() => setSummary(!summary)} /></>}
      <LinkRow title="AI 튜터에게 질문" onPress={() => router.push({ pathname: '/tutor', params: { concept: page.concept.title, stageId: stage.stageId } })} />
    </>}
    {concepts?.length === 0 && stage.stageType === 'NORMAL' && <Notice>이 단계에 공개된 학습 개념이 없습니다.</Notice>}
    {!!save.error && <Notice tone="error">{save.error}</Notice>}
    <LerenButton title={stage.stageType === 'BOSS' ? '보스 전투로' : '퀴즈 시작 화면으로'} onPress={() => router.push({ pathname: '/quiz', params: { stageId: stage.stageId } })} />
    <LerenButton title="학습 단계 목록" variant="secondary" onPress={() => canSave ? setLeaving(true) : router.replace({ pathname: '/steps', params: { topicId: stage.topicId } })} />
  </Screen>;
}
