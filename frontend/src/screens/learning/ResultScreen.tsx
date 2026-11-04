/** 서버 콘텐츠의 지역 이름·전투 규칙과 로컬 전투 결과를 조합해 결과·재도전 화면을 표시합니다. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Empty, Heading, LinkRow, Notice, Progress } from '../../components/ui/Primitives';
import LearningContentState from '../../components/ui/LearningContentState';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import LerenCharacter from '../../components/common/LerenCharacter';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useLearningProgress } from '../../context/LearningProgressContext';
import { useLearningContent } from '../../context/LearningContentContext';

const CHARACTERS = { warrior: require('../../../assets/characters/leren_warrior.png'), mage: require('../../../assets/characters/leren_mage.png'), archer: require('../../../assets/characters/leren_archer.png') };

export default function ResultScreen() {
  return <LearningContentState title="학습 결과"><ResultContent /></LearningContentState>;
}

function ResultContent() {
  const { lastResult, profile } = useLearningProgress();
  const { regions, getRegionForStep, battleRules } = useLearningContent();
  const result = lastResult;
  if (!result) return <Screen title="학습 결과" back tabs><Empty title="아직 전투 결과가 없어요" description="학습을 마치고 퀴즈에 도전해 보세요." action="경제 탐험 시작하기" onPress={() => router.replace('/explore')} /></Screen>;
  const stage = getRegionForStep(result.stepId);
  const rule = battleRules?.[result.boss ? 'boss' : 'normal'];
  if (!stage || !rule) return <Screen title="학습 결과" back tabs><Empty title="현재 제공되지 않는 학습 결과예요" description="콘텐츠 목록을 다시 확인하고 준비된 스테이지에서 학습해 주세요." action="탐험 지도 보기" onPress={() => router.replace('/explore')} /></Screen>;
  const hp = Math.max(0, rule.hp - result.correct);
  const nextRegion = regions.find((region) => region.prerequisite === stage.id);
  const retry = () => router.replace({ pathname: '/quiz', params: { step: result.stepId, boss: result.boss ? '1' : '0' } });
  return <Screen title={result.passed ? result.firstClear ? result.boss ? '지역 클리어' : '학습 완료' : '재학습 완료' : '클리어 실패'} back tabs>
    <LerenCard variant={result.passed ? 'success' : 'error'}>
      <LerenCharacter source={CHARACTERS[profile.job]} size={64} />
      <Heading>{result.passed ? result.boss ? `${stage.title} 지역을 클리어했어요!` : '몬스터를 물리쳤어요!' : '조금만 더 기억해 볼까요?'}</Heading>
      <Body muted>{stage.title} · 정답 {result.correct} / {result.total} · 적 HP {hp} / {rule.hp}</Body>
    </LerenCard>
    {result.passed ? <>
      <View style={styles.rewards}>{[
        [`+${result.rewardXp}`, '전체 EXP'], [`+${result.rewardEconomyXp ?? 0}`, '경제 EXP'], [`+${result.rewardCoins}`, '코인'],
      ].map(([value, title]) => <View key={title} style={styles.reward}><Text style={styles.value}>{value}</Text><Text style={styles.small}>{title}</Text></View>)}</View>
      {!result.firstClear && <Body muted>이미 완료한 단계의 재학습이에요. 최초 클리어 보상은 중복 지급되지 않아요.</Body>}
      <View style={styles.progress}><View style={styles.row}><Text style={styles.label}>전체 성장</Text><Text style={styles.small}>Lv.{profile.level} · {profile.xp} / 400 EXP</Text></View><Progress value={Math.min(1, profile.xp / 400)} /></View>
    </> : <LerenCard title="해설을 보고 다시 도전해요" description="오답과 헷갈리는 문항은 복습 노트에서 다시 확인할 수 있어요. 이번 도전의 보상은 지급되지 않아요." variant="info" />}
    <LinkRow title="문항별 결과" subtitle={result.wrongQuestionIds.length ? `오답 ${result.wrongQuestionIds.length}문제 · 해설 보기` : '모두 정답 · 해설 보기'} onPress={() => router.push({ pathname: '/review', params: { mode: 'result' } })} />
    {result.passed && result.boss && !nextRegion && <Notice>현재 제공된 스테이지를 완료했어요. 다음 스테이지는 준비 중이에요.</Notice>}
    <LerenButton title={result.passed ? result.boss ? nextRegion ? '다음 스테이지 보기' : '탐험 지도 보기' : '다음 단계 보기' : '다시 도전하기'} onPress={result.passed ? () => result.boss ? nextRegion ? router.replace({ pathname: '/steps', params: { stage: nextRegion.id } }) : router.replace('/explore') : router.replace({ pathname: '/steps', params: { stage: stage.id } }) : retry} />
    <LerenButton title="홈으로 돌아가기" variant="secondary" onPress={() => router.replace('/home')} />
  </Screen>;
}

const styles = StyleSheet.create({
  rewards: { flexDirection: 'row', gap: 8 }, reward: { flex: 1, backgroundColor: COLORS.soft, padding: 12, borderRadius: 12, gap: 6 },
  value: { ...TYPOGRAPHY.heading, color: COLORS.primary }, small: { ...TYPOGRAPHY.small, color: COLORS.muted },
  progress: { gap: 7 }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, label: { ...TYPOGRAPHY.label, color: COLORS.ink },
});
