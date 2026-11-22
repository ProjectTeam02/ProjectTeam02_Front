/** 진행도와 단계 잠금은 선택한 주제의 서버 응답으로 표시합니다. */
import { router, useLocalSearchParams } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Screen from '../../components/ui/Screen';
import { Body, Empty, Heading, Notice, Row } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenButton from '../../components/common/LerenButton';
import { stageBackground } from '../../constants/stageImages';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useLearningQuery } from '../../hooks/useLearningQuery';
import { isLearningId, LEARNING_PATHS, stagesDecoder, type Stage } from '../../services/learningApi';

// 13-S0~S5 배경의 첫 카드부터 보스까지, 366 × 447 그림 안에서의 세로 위치입니다.
const labelTops = [85, 151, 218, 285, 356];
const openLesson = (stage: Stage) => router.push({ pathname: '/lesson', params: { stageId: stage.stageId } });

export default function StageStepsScreen() {
  const { topicId } = useLocalSearchParams<{ topicId?: string }>();
  const stages = useLearningQuery(isLearningId(topicId) ? LEARNING_PATHS.stages(topicId) : null, stagesDecoder);
  const { fontScale, width } = useWindowDimensions();
  if (!isLearningId(topicId)) return <Screen title="학습 단계" tabs><Empty title="학습 주제를 선택해 주세요" action="경제 탐험 보기" onPress={() => router.replace('/explore')} /></Screen>;
  const topic = stages.data?.topic;
  const items = [...(stages.data?.items ?? [])].sort((a, b) => a.stageNo - b.stageNo);
  const done = items.filter(stage => stage.progressStatus === 'PASSED').length;
  const next = items.find(stage => stage.isUnlocked && stage.progressStatus !== 'PASSED');
  const artwork = topic && stageBackground(topic.topicNo, done, items.length);
  // 글자가 커지거나 서버의 단계 수가 다르면 고정된 그림 위에 작은 글씨를 겹치지 않습니다.
  const overlay = !!artwork && items.length === 5 && fontScale <= 1.15 && width >= 350;
  const cards = items.map((stage, index) => {
    const passed = stage.progressStatus === 'PASSED';
    const active = stage.isUnlocked && !passed;
    const boss = stage.stageType === 'BOSS';
    const state = passed ? '완료 · 다시 보기' : active ? stage.progressStatus === 'IN_PROGRESS' ? '이어서 학습' : '도전 가능' : '잠김';
    return <Pressable key={stage.stageId} accessibilityRole="button" accessibilityState={{ disabled: !stage.isUnlocked }}
      disabled={!stage.isUnlocked} onPress={() => openLesson(stage)}
      accessibilityLabel={`${stage.stageNo}단계 · ${stage.title} · ${state}. ${stage.description ?? ''}`}
      style={[s.card, overlay && s.overlayCard, overlay && { top: `${labelTops[index] / 447 * 100}%` }, active && s.active, boss && s.boss, boss && passed && s.cleared]}>
      <Text style={[s.meta, passed && s.passed, active && s.white, boss && s.gold]}>{stage.stageNo}단계 · {boss && !passed ? 'BOSS · ' : ''}{passed && overlay ? '완료' : state}</Text>
      <Text style={[s.name, (active || boss) && s.white]}>{stage.title}</Text>
      {!overlay && stage.description && <Text style={[s.meta, (active || boss) && s.white]}>{stage.description}</Text>}
    </Pressable>;
  });
  const action = next ? <LerenButton title={next.title + ' 학습하기'} onPress={() => openLesson(next)} />
    : done === items.length ? <LerenButton title="다른 지역 탐험하기" onPress={() => router.replace('/explore')} /> : null;
  return <Screen title={topic?.title ?? '학습 단계'} illustratedStage={overlay} tabs footer={overlay ? action : undefined}
    right={stages.status === 'success' && items.length > 0 && <ApiStatus resource={stages} label="학습 단계" />}>
    {(stages.status !== 'success' || !items.length) && <ApiStatus resource={stages} label="학습 단계" empty={items.length === 0} />}
    {topic && items.length > 0 && <>
      <View style={overlay ? s.illustratedIntro : s.standardIntro}>
        <Row style={[s.summary, overlay && s.illustratedTitle]}><Heading>스테이지 진행도</Heading><Text style={s.badge}>{done} / {items.length} 완료</Text></Row>
        {!!topic.description && <Body muted style={overlay ? s.illustratedDescription : undefined}>{topic.description}</Body>}
        <Row style={overlay ? s.illustratedProgress : undefined}>{items.map(stage => <View key={stage.stageId} style={[s.segment, stage.progressStatus === 'PASSED' && s.filled]} />)}</Row>
      </View>
      {artwork && <ImageBackground source={artwork} imageStyle={s.image} resizeMode="cover" style={[s.art, !overlay && s.banner]}>
        {overlay && <View style={s.labels}>{cards}</View>}
      </ImageBackground>}
      {!overlay && cards}
      {next ? <View style={overlay ? s.nextLesson : undefined}><Body muted>다음 학습</Body>
        {overlay && <Heading>{next.title}</Heading>}</View> : done === items.length
        ? <Heading>스테이지 완료!</Heading> : <Notice>이전 단계 또는 선수 주제를 먼저 완료해 주세요.</Notice>}
      {!overlay && action}
    </>}
  </Screen>;
}
const s = StyleSheet.create({
  standardIntro: { gap: 12 },
  illustratedIntro: { marginHorizontal: 6, gap: 2 },
  illustratedTitle: { minHeight: 42 },
  illustratedDescription: { minHeight: 25 },
  illustratedProgress: { marginTop: 9, gap: 6 },
  nextLesson: { minHeight: 70, marginHorizontal: 6, gap: 2 },
  summary: { justifyContent: 'space-between', flexWrap: 'wrap' },
  badge: { ...TYPOGRAPHY.label, color: COLORS.success, backgroundColor: COLORS.successBg, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 3 },
  segment: { flex: 1, height: 6, borderRadius: 4, backgroundColor: COLORS.disabled }, filled: { backgroundColor: COLORS.success },
  image: { width: '100%', height: '100%' },
  art: { width: '100%', aspectRatio: 366 / 447, overflow: 'hidden', borderRadius: 12 }, banner: { aspectRatio: 2 },
  labels: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  overlayCard: { position: 'absolute', right: '2.19%', width: '45.90%', height: '13.2%' },
  card: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: COLORS.surface, minHeight: 44, justifyContent: 'center' },
  active: { backgroundColor: COLORS.primary }, boss: { backgroundColor: '#302D61' },
  cleared: { borderColor: '#FFCC64', borderWidth: 2 },
  name: { ...TYPOGRAPHY.label, color: COLORS.ink }, meta: { ...TYPOGRAPHY.small, color: COLORS.muted },
  passed: { color: COLORS.success }, white: { color: COLORS.surface }, gold: { color: '#FFE28B' },
});
