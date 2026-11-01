/** 홈 대시보드: 백엔드에서 받은 지역·단계 이름과 로컬 진행 상태를 조합해 학습 동선을 만듭니다. */
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/ui/Screen';
import { Body, Heading, LinkRow, Progress, Row } from '../../components/ui/Primitives';
import LearningContentState from '../../components/ui/LearningContentState';
import LerenCard from '../../components/common/LerenCard';
import LerenButton from '../../components/common/LerenButton';
import LerenCharacter from '../../components/common/LerenCharacter';
import { useLearningProgress } from '../../context/LearningProgressContext';
import { useLearningContent } from '../../context/LearningContentContext';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

const IMAGES = {
  warrior: require('../../../assets/characters/leren_warrior.png'),
  mage: require('../../../assets/characters/leren_mage.png'),
  archer: require('../../../assets/characters/leren_archer.png'),
};
const JOB_NAMES = { warrior: '검사', mage: '마법사', archer: '궁수' };
export default function HomeScreen() {
  const { profile } = useLearningProgress();
  return <Screen title="홈" back={false} tabs right={<Pressable accessibilityRole="button" onPress={() => router.push('/screens')} style={s.preview}><Text style={s.previewLabel}>화면 목록</Text></Pressable>}>
    <LerenCard variant="info" style={s.hero}>
      <LerenCharacter source={IMAGES[profile.job]} size={64} accessibilityLabel={JOB_NAMES[profile.job]} />
      <Heading>{profile.nickname}님, 오늘도 한 걸음!</Heading>
      <Body muted style={s.small}>{JOB_NAMES[profile.job]} Lv.{profile.level} · 경제 Lv.{profile.economyLevel}</Body>
    </LerenCard>
    <LearningContentState><HomeContent /></LearningContentState>
    <LinkRow title="오늘의 복습" subtitle="표시한 문제 확인하기" onPress={() => router.push('/review')} />
    <LinkRow title="학습 달력" subtitle="이번 달 일정 보기" onPress={() => router.push('/calendar')} />
  </Screen>;
}

// API가 준비된 뒤에만 학습 내용을 렌더해 오류 시 임의의 지역을 대신 보여주지 않습니다.
function HomeContent() {
  const { profile, completedSteps, wrongQuestionIds, flaggedQuestionIds } = useLearningProgress();
  const { regions, getQuestion } = useLearningContent();
  const region = regions.find(item => !completedSteps.includes(item.boss.id)) || regions[0];
  if (!region) return null;
  const stepIds = [...region.lessons.map(lesson => lesson.id), region.boss.id];
  const count = stepIds.filter(id => completedSteps.includes(id)).length;
  const nextLesson = region.lessons.find(lesson => !completedSteps.includes(lesson.id));
  const step = nextLesson?.id || region.boss.id;
  const complete = count === stepIds.length;
  const reviewQuestions = [...new Set([...wrongQuestionIds, ...flaggedQuestionIds])].map(getQuestion).filter(question => !!question);
  const reviewConcepts = [...new Set(reviewQuestions.map(question => question.concept))].slice(0, 2).join(' · ');
  const completedLessons = region.lessons.filter(lesson => completedSteps.includes(lesson.id)).length;
  return <>
    <Row>{[{ value: `${completedLessons} / ${region.lessons.length}`, label: '학습 단계 완료' }, { value: `${count} / ${stepIds.length}`, label: '지역 진행' }, { value: String(profile.coins), label: '보유 코인' }].map(item => <View key={item.label} style={s.stat}><Text style={s.number}>{item.value}</Text><Text style={s.caption}>{item.label}</Text></View>)}</Row>
    <View style={s.progress}><Row style={s.between}><Text style={s.label}>{region.title}</Text><Text style={s.small}>{count} / {stepIds.length} 단계 완료</Text></Row><Progress value={count / Math.max(stepIds.length, 1)} /></View>
    {complete && <Body muted>현재 준비된 지역의 학습을 마쳤어요. 다음 지역은 준비 중이며, 완료한 학습은 다시 볼 수 있어요.</Body>}
    <LerenButton title={complete ? '완료한 학습 다시 보기' : '이어서 학습하기'} onPress={() => router.push({ pathname: '/steps', params: { stage: String(region.id), step } })} />
    {reviewQuestions.length > 0 && <Body muted>복습할 개념 · {reviewConcepts}</Body>}
    <LinkRow title="전체 탐험 지도" subtitle={`현재 준비된 지역 ${regions.length}개`} onPress={() => router.push('/explore')} />
  </>;
}
const s = StyleSheet.create({
  hero: { borderWidth: 0, gap: 10 }, small: { ...TYPOGRAPHY.small, color: COLORS.muted },
  stat: { flex: 1, backgroundColor: COLORS.soft, padding: 12, borderRadius: 12, gap: 6 },
  number: { ...TYPOGRAPHY.heading, color: COLORS.primary }, caption: { ...TYPOGRAPHY.micro, color: COLORS.muted },
  label: { ...TYPOGRAPHY.label, color: COLORS.ink }, between: { justifyContent: 'space-between' }, progress: { gap: 7 },
  preview: { padding: 8 }, previewLabel: { ...TYPOGRAPHY.micro, color: COLORS.primary },
});
