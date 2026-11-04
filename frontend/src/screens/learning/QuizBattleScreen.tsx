/**
 * 백엔드가 제공한 문제·정답·해설·전투 규칙으로 임시 퀴즈 화면을 구성합니다.
 * 현재 테스트 API는 정답도 내려주므로 채점·기록은 로컬 처리하며 운영 채점 API와 구분합니다.
 */
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Empty, Heading, LinkRow } from '../../components/ui/Primitives';
import LearningContentState from '../../components/ui/LearningContentState';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import LerenCharacter from '../../components/common/LerenCharacter';
import LerenCheck from '../../components/common/LerenCheck';
import LerenOption from '../../components/common/LerenOption';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useLearningProgress } from '../../context/LearningProgressContext';
import { useLearningContent } from '../../context/LearningContentContext';
import type { LearningQuestion, LearningRegion } from '../../types/learning';

const CHARACTERS = {
  warrior: require('../../../assets/characters/leren_warrior.png'),
  mage: require('../../../assets/characters/leren_mage.png'),
  archer: require('../../../assets/characters/leren_archer.png'),
};

export default function QuizBattleScreen() {
  return <LearningContentState title="퀴즈 전투"><QuizBattleContent /></LearningContentState>;
}

function QuizBattleContent() {
  const params = useLocalSearchParams<{ step?: string; boss?: string }>();
  const { regions, getRegionForStep, getBattleQuestions, battleRules } = useLearningContent();
  const boss = params.boss === '1';
  const stepId = params.step === undefined ? boss ? regions[0]?.boss.id : regions[0]?.lessons[0]?.id : params.step;
  const region = stepId ? getRegionForStep(stepId) : undefined;
  const questions = stepId ? getBattleQuestions(stepId, boss) : [];
  const rule = battleRules?.[boss ? 'boss' : 'normal'];
  if (!region || !stepId || !rule || questions.length === 0) return <Screen title="퀴즈 전투" back tabs><Empty title="아직 준비되지 않은 문제예요" description="백엔드에서 받은 학습 목록에서 다시 선택해 주세요." action="탐험 지도 보기" onPress={() => router.replace('/explore')} /></Screen>;
  return <BattleRound key={`${stepId}-${boss ? 'boss' : 'normal'}`} stepId={stepId} boss={boss} region={region} questions={questions} maxHp={rule.hp} />;
}

function BattleRound({ stepId, boss, region, questions, maxHp }: { stepId: string; boss: boolean; region: LearningRegion; questions: LearningQuestion[]; maxHp: number }) {
  const { profile, flaggedQuestionIds, toggleFlag, finishQuiz } = useLearningProgress();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const submitted = useRef(false);
  const resultSaved = useRef(false);
  const question = questions[index];
  const hp = Math.max(0, maxHp - score);
  const correct = selected === question.answer;
  const roundFinished = hp === 0 || index === questions.length - 1;

  // 제출 즉시 잠가 한 문항을 여러 번 채점하지 않습니다. 끝난 문항만 결과 total에 포함합니다.
  const submit = () => {
    if (selected === null || submitted.current) return;
    submitted.current = true;
    const nextScore = score + (correct ? 1 : 0);
    const nextWrong = correct ? wrong : [...wrong, question.id];
    setScore(nextScore); setWrong(nextWrong);
    // 마지막 문제도 해설과 헷갈림 체크를 읽을 수 있게 채점 화면을 먼저 표시합니다.
    setFeedback(true);
  };
  const nextQuestion = () => {
    if (roundFinished) {
      if (resultSaved.current) return;
      resultSaved.current = true;
      finishQuiz({ stepId, boss, correct: score, total: index + 1, wrongQuestionIds: wrong });
      router.replace('/result');
      return;
    }
    setIndex((old) => old + 1); setSelected(null); setFeedback(false); submitted.current = false;
  };

  return <Screen title={feedback ? correct ? '정답이에요!' : '다시 기억해 봐요' : boss ? `${region.title} · 보스` : '퀴즈 전투'} back tabs>
    <LerenCard>
      <View style={styles.row}><Text style={styles.label}>{boss ? '보스 · 지식 골렘' : '선택 슬라임'}</Text><Text style={styles.hp}>HP {hp}/{maxHp}</Text></View>
      <View style={styles.track}><View style={[styles.hpFill, { width: `${hp / maxHp * 100}%` }]} /></View>
      <View style={styles.battle}>
        <LerenCharacter source={CHARACTERS[profile.job]} size={64} />
        <Text style={styles.versus}>VS</Text>
        {/* 피그마의 픽셀 몬스터는 단순한 사각형 도형으로 구성되어 있습니다. */}
        <View style={[styles.monster, boss && styles.boss]} accessibilityLabel={boss ? '지식 골렘' : '선택 슬라임'} accessible>
          <View style={styles.eyes}><View style={styles.eye} /><View style={styles.eye} /></View><View style={styles.mouth} />
        </View>
      </View>
      <Text style={styles.questionNumber}>문제 {index + 1} / {questions.length}{feedback ? ' · 채점 완료' : ''}</Text>
    </LerenCard>
    {feedback ? <>
      <LerenCard title={`${correct ? '정답' : '정답은'} · ${question.choices[question.answer]}`} description={`${question.explanation}\n${correct ? '몬스터 HP가 1 줄었어요.' : '몬스터 HP는 그대로예요. 해설을 읽고 다시 기억해 봐요.'}`} variant={correct ? 'success' : 'error'} />
      <LerenCheck checked={flaggedQuestionIds.includes(question.id)} onChange={() => toggleFlag(question.id)} title={`Q${index + 1} · ${question.concept} 헷갈림 체크`} description="정답·오답과 상관없이 이 문항을 복습에 모아요." />
      <LerenButton title={roundFinished ? '결과 보기' : '다음 문제'} onPress={nextQuestion} />
      <LinkRow title="해설을 더 쉽게 이해하기" subtitle="AI 튜터에게 질문" onPress={() => router.push({ pathname: '/tutor', params: { concept: question.concept } })} />
    </> : <>
      <Heading>{question.question}</Heading>
      {question.choices.map((choice, choiceIndex) => <LerenOption key={choice} number={choiceIndex + 1} title={choice} state={selected === choiceIndex ? 'selected' : 'default'} onPress={() => setSelected(choiceIndex)} />)}
      <LerenButton title={selected === null ? '답을 선택해 주세요' : '답 제출하기'} disabled={selected === null} onPress={submit} />
      <Body muted>{boss ? `보스 HP ${maxHp} · 최대 ${questions.length}문제. HP가 0이면 바로 클리어해요.` : `일반 HP ${maxHp} · 최대 ${questions.length}문제\n정답이면 적 HP −1 · 오답이면 유지해요.`}</Body>
    </>}
  </Screen>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, label: { ...TYPOGRAPHY.label, color: COLORS.ink },
  hp: { ...TYPOGRAPHY.small, color: COLORS.danger }, track: { height: 8, width: '100%', borderRadius: 4, backgroundColor: COLORS.disabled, overflow: 'hidden' },
  hpFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.danger }, battle: { flexDirection: 'row', alignItems: 'center', gap: 24, marginVertical: 2 },
  versus: { ...TYPOGRAPHY.label, color: COLORS.muted, width: 56 }, questionNumber: { ...TYPOGRAPHY.small, color: COLORS.primary },
  monster: { width: 48, height: 48, backgroundColor: '#248565', alignItems: 'center', justifyContent: 'center', gap: 8 },
  boss: { backgroundColor: '#68778E', width: 56, height: 56 }, eyes: { flexDirection: 'row', gap: 16 }, eye: { width: 8, height: 8, backgroundColor: '#FFFFFF' }, mouth: { width: 16, height: 6, backgroundColor: '#182842' },
});
