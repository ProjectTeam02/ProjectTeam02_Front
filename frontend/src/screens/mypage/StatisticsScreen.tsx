/**
 * 피그마 23번 통계 화면입니다. 전체·개념별·학습 이력을 탭으로 전환합니다.
 * 개념·단계 이름은 백엔드 카탈로그에서, 완료·최근 응시 수치는 로컬 미리보기 상태에서 읽습니다.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import LerenCard from '../../components/common/LerenCard';
import Screen from '../../components/ui/Screen';
import { Body, Chip, Empty, LinkRow, Progress, Row } from '../../components/ui/Primitives';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useLearningProgress } from '../../context/LearningProgressContext';
import { useLearningContent } from '../../context/LearningContentContext';
import LearningContentState from '../../components/ui/LearningContentState';

export default function StatisticsScreen() {
  const { profile, completedSteps, lastResult } = useLearningProgress();
  const { regions, questions, getBattleQuestions, getRegionForStep } = useLearningContent();
  const [tab, setTab] = useState(0);
  const title = tab === 1 ? '개념별 학습 통계' : tab === 2 ? '학습 이력' : '학습 통계';
  const steps = regions.flatMap(region => [...region.lessons.map(lesson => ({ id: lesson.id, title: lesson.title, region: region.title, boss: false })), { id: region.boss.id, title: `${region.title} · 보스`, region: region.title, boss: true }]);
  const completed = steps.filter(step => completedSteps.includes(step.id));
  const recentQuestions = lastResult ? getBattleQuestions(lastResult.stepId, lastResult.boss).slice(0, lastResult.total) : [];
  const rate = lastResult && recentQuestions.length ? Math.round(lastResult.correct / Math.max(lastResult.total, 1) * 100) : null;
  // 개념 목록 역시 서버가 제공한 문항으로 구성합니다. 응시하지 않은 개념의 정답률은 만들지 않습니다.
  const concepts = [...new Set(questions.map(question => question.concept))].map(title => {
    const attempted = recentQuestions.filter(question => question.concept === title);
    const correct = attempted.filter(question => !lastResult?.wrongQuestionIds.includes(question.id)).length;
    return { title, count: attempted.length, rate: attempted.length ? Math.round(correct / attempted.length * 100) : null };
  });
  const weakest = concepts.filter(concept => concept.rate !== null).sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0))[0];
  const progressBlock = (label: string, description: string, value: number) => <View key={label} style={styles.progressBlock}><View style={styles.progressHeader}><Text style={styles.label}>{label}</Text><Text style={styles.caption}>{description}</Text></View><Progress value={value} /></View>;

  return (
    <Screen title={title} back tabs>
      <Row>{['전체', '개념별', '학습 이력'].map((label, index) => <Chip key={label} label={label} active={tab === index} onPress={() => setTab(index)} />)}</Row>
      <LearningContentState>
      {tab === 0 ? <>
        <Row>{[{ value: `${completed.length}개`, label: '완료한 단계' }, { value: `${recentQuestions.length}개`, label: '최근 푼 문제' }, { value: rate === null ? '—' : `${rate}%`, label: '최근 정답률' }].map(item => <View key={item.label} style={styles.stat}><Text style={styles.value}>{item.value}</Text><Text style={styles.micro}>{item.label}</Text></View>)}</Row>
        {progressBlock('등록된 지역 학습률', `${completed.length} / ${steps.length} 단계`, completed.length / Math.max(steps.length, 1))}
        {progressBlock('전체 성장', `Lv.${profile.level} · ${profile.xp % 400} / 400 EXP`, profile.xp % 400 / 400)}
        {progressBlock('경제 성장', `Lv.${profile.economyLevel} · ${profile.economyXp % 200} / 200 EXP`, profile.economyXp % 200 / 200)}
        <LinkRow title="개념별 강점과 취약점" subtitle="자세히 보기" onPress={() => setTab(1)} />
        <LinkRow title="날짜별 학습 이력" subtitle="기록 보기" onPress={() => setTab(2)} />
      </> : tab === 1 ? <>
        {concepts.map(concept => progressBlock(concept.title, concept.rate === null ? '아직 응시 기록 없음' : `${concept.rate}% · 최근 ${concept.count}문제 응시`, (concept.rate ?? 0) / 100))}
        <LerenCard title={weakest ? `${weakest.title}을 한 번 더 복습해 볼까요?` : '학습한 개념을 다시 확인해 볼까요?'} description="개념을 다시 확인하고 문제로 기억을 단단하게 만들어요." variant="info" />
        <LinkRow title="개념 복습하기" subtitle="복습 노트로 이동" onPress={() => router.push('/review')} />
        <Body muted>개념별 정답률은 현재 앱에서 가장 최근에 푼 퀴즈를 기준으로 보여줘요.</Body>
      </> : <>
        {lastResult && <LinkRow title={`최근 퀴즈 · ${getRegionForStep(lastResult.stepId)?.title || '학습 결과'}`} subtitle={`정답 ${lastResult.correct} / ${lastResult.total}`} onPress={() => router.push('/result')} />}
        {completed.map(item => <LinkRow key={item.id} title={item.title} subtitle={`${item.region} · 완료한 단계`} onPress={() => router.push(item.boss ? { pathname: '/quiz', params: { step: item.id, boss: '1' } } : { pathname: '/lesson', params: { step: item.id } })} />)}
        {completed.length === 0 && !lastResult && <Empty title="아직 완료한 학습이 없어요" description="등록된 첫 학습을 마치면 이곳에서 다시 볼 수 있어요." action="학습 시작하기" onPress={() => router.push('/explore')} />}
      </>}
      <Body muted>학습 기록 저장은 준비 중이며, 현재 앱에서 만든 진행도는 다시 열면 초기화돼요.</Body>
      </LearningContentState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stat: { flex: 1, backgroundColor: COLORS.soft, padding: 12, borderRadius: 12, gap: 6 },
  value: { ...TYPOGRAPHY.heading, color: COLORS.primary },
  micro: { ...TYPOGRAPHY.micro, color: COLORS.muted },
  progressBlock: { gap: 8, paddingVertical: 6 },
  progressHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  label: { ...TYPOGRAPHY.label, color: COLORS.ink, flex: 1 },
  caption: { ...TYPOGRAPHY.small, color: COLORS.muted, textAlign: 'right', flex: 1 },
});
