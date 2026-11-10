/**
 * 백엔드에서 받은 문항 중 로컬 오답·헷갈림 ID에 해당하는 문제를 모아 다시 풉니다.
 * 프론트에 별도 문제·해설 사본을 두지 않으며 재풀이에서 보상은 지급하지 않습니다.
 * 헷갈림은 직접 해제할 때까지 유지하고, 오답 해제 정책은 서버 협의 전까지 자동 적용하지 않습니다.
 */
import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/ui/Screen';
import LearningContentState from '../../components/ui/LearningContentState';
import { Body, Chip, Empty, Heading, LinkRow, Progress } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import LerenCheck from '../../components/common/LerenCheck';
import LerenOption from '../../components/common/LerenOption';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useLearningProgress } from '../../context/LearningProgressContext';
import { useLearningContent } from '../../context/LearningContentContext';
import type { LearningQuestion } from '../../types/learning';

type Filter = '전체' | '오답' | '헷갈림';

export default function ReviewScreen() {
  return <LearningContentState title="복습 노트"><ReviewContent /></LearningContentState>;
}

function ReviewContent() {
  const params = useLocalSearchParams<{ mode?: string; question?: string }>();
  const { getBattleQuestions, getQuestion } = useLearningContent();
  const { wrongQuestionIds, flaggedQuestionIds, toggleFlag, lastResult } = useLearningProgress();
  const resultMode = params.mode === 'result' && !!lastResult;
  const [filter, setFilter] = useState<Filter>('전체');
  const [queue, setQueue] = useState<string[]>(params.question ? [params.question] : []);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState(false);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const submitted = useRef(false);
  const candidates = resultMode ? getBattleQuestions(lastResult.stepId, lastResult.boss).slice(0, lastResult.total).map((question) => question.id) : [...new Set([...wrongQuestionIds, ...flaggedQuestionIds])];
  // 백엔드에서 더 이상 제공하지 않는 문항은 오래된 로컬 ID만으로 재생성하지 않습니다.
  const ids = candidates.filter((id) => !!getQuestion(id));
  const filtered = ids.filter((id) => filter === '전체' || (filter === '오답' ? (resultMode ? lastResult.wrongQuestionIds : wrongQuestionIds).includes(id) : flaggedQuestionIds.includes(id)));
  const questions = filtered.map(getQuestion).filter((question): question is LearningQuestion => !!question);
  const question = getQuestion(queue[index] || '');
  // 원래 정답 번호는 보관하고, 재풀이에서는 보기 순서만 회전합니다.
  const choices = useMemo(() => {
    if (!question) return [];
    const offset = question.id.length % (question.choices.length - 1) + 1;
    return question.choices.map((title, originalIndex) => ({ title, originalIndex })).slice(offset).concat(question.choices.map((title, originalIndex) => ({ title, originalIndex })).slice(0, offset));
  }, [question]);

  const start = (id: string) => {
    const nextQueue = [id, ...questions.map((item) => item.id).filter((item) => item !== id)];
    setQueue(nextQueue); setIndex(0); setSelected(null); setFeedback(false); setDone(false); setScore(0); submitted.current = false;
  };
  const submit = () => {
    if (selected === null || !question || submitted.current) return;
    submitted.current = true;
    if (selected === question.answer) setScore((old) => old + 1);
    setFeedback(true);
  };
  const next = () => {
    if (index === queue.length - 1) setDone(true);
    else { setIndex((old) => old + 1); setSelected(null); setFeedback(false); submitted.current = false; }
  };

  if (queue.length > 0 && !question) return <Screen title="복습 문항" back tabs onBack={() => setQueue([])}><Empty title="현재 제공되지 않는 문항이에요" description="백엔드에서 받은 복습 목록의 문항을 선택해 주세요." action="복습 목록 보기" onPress={() => setQueue([])} /></Screen>;

  if (done) return <Screen title="복습 결과" back tabs onBack={() => { setDone(false); setQueue([]); }}>
    <LerenCard title="복습을 마쳤어요!" description="헷갈렸던 개념을 한 번 더 정리했어요." variant="success" />
    <View style={styles.stats}>{[[`${queue.length}개`, '푼 문제'], [`${score}개`, '맞힌 문제'], [`${Math.round(score / queue.length * 100)}%`, '정답률']].map(([value, label]) => <View key={label} style={styles.stat}><Text style={styles.value}>{value}</Text><Text style={styles.small}>{label}</Text></View>)}</View>
    <Body muted>체크한 문항은 재풀이 정답만으로 자동 해제되지 않아요. 직접 해제한 문항의 체크는 꺼진 상태로 유지돼요.</Body>
    <LerenButton title="복습 노트로 돌아가기" onPress={() => { setDone(false); setQueue([]); }} />
    <LinkRow title="나의 학습 통계" subtitle="성장 확인하기" onPress={() => router.push('/statistics')} />
  </Screen>;

  if (question) return <Screen title={`${question.concept} 복습`} back tabs onBack={() => setQueue([])}>
    <View style={styles.progress}><View style={styles.row}><Text style={styles.label}>복습 문제</Text><Text style={styles.small}>{index + 1} / {queue.length}</Text></View><Progress value={(index + 1) / queue.length} /></View>
    {feedback ? <>
      <LerenCard title={selected === question.answer ? '정답이에요!' : '다시 기억해 봐요'} description={`${question.explanation}\n정답: ${question.choices[question.answer]}`} variant={selected === question.answer ? 'success' : 'error'} />
      <LerenCheck title={`${question.concept} 헷갈림 체크`} checked={flaggedQuestionIds.includes(question.id)} onChange={() => toggleFlag(question.id)} description="해제할 때까지 헷갈림 문항으로 유지돼요." />
      <LerenButton title={index === queue.length - 1 ? '복습 결과 보기' : '다음 문항'} onPress={next} />
      <LinkRow title="더 쉽게 설명해 주세요" subtitle="AI 튜터에게 질문" onPress={() => router.push({ pathname: '/tutor', params: { concept: question.concept } })} />
      <Body muted>체크한 문항은 재풀이 정답만으로 자동 해제되지 않아요.</Body>
    </> : <>
      <Heading>{question.question}</Heading>
      {choices.map((choice, choiceIndex) => <LerenOption key={choice.originalIndex} number={choiceIndex + 1} title={choice.title} state={selected === choice.originalIndex ? 'selected' : 'default'} onPress={() => setSelected(choice.originalIndex)} />)}
      <LerenButton title="답 제출하기" disabled={selected === null} onPress={submit} />
      <Body muted>정답을 고른 뒤 제출해 주세요.</Body>
    </>}
    <LerenButton title="문항 목록 보기" variant="secondary" onPress={() => setQueue([])} />
  </Screen>;

  return <Screen title={resultMode ? '문항별 결과' : '복습 노트'} back tabs>
    <LerenCard title={resultMode ? '방금 푼 문제를 다시 확인해요' : '오답도, 헷갈린 문제도 다시 봐요'} description={resultMode ? `${lastResult.total}문제 · 정답 ${lastResult.correct}문제` : `오답 ${wrongQuestionIds.filter((id) => !!getQuestion(id)).length}문제 · 헷갈림 ${flaggedQuestionIds.filter((id) => !!getQuestion(id)).length}문제\n겹치는 문항을 합쳐 총 ${ids.length}문제`} variant="info" />
    <View style={styles.row}>{(['전체', '오답', '헷갈림'] as const).map((item) => <Chip key={item} label={item} active={filter === item} onPress={() => setFilter(item)} />)}</View>
    {questions.length ? questions.map((item) => {
      const isWrong = resultMode ? lastResult.wrongQuestionIds.includes(item.id) : wrongQuestionIds.includes(item.id);
      const previousWrong = resultMode && !isWrong && wrongQuestionIds.includes(item.id);
      return <LinkRow key={item.id} title={item.concept} subtitle={`${isWrong ? '오답' : '정답'}${previousWrong ? ' · 이전 오답 기록' : ''}${flaggedQuestionIds.includes(item.id) ? ' · 헷갈림' : ''} · 개념 다시 보기`} onPress={() => start(item.id)} />;
    }) : <Empty title={filter === '전체' ? '복습할 문제가 없어요' : `${filter} 문항이 없어요`} description="퀴즈를 풀고 헷갈리는 문제에 체크해 보세요." action="경제 탐험으로" onPress={() => router.push('/explore')} />}
    <LinkRow title="개념별 학습 통계" subtitle="강점과 취약 개념 보기" onPress={() => router.push('/statistics')} />
  </Screen>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 }, progress: { gap: 7 }, label: { ...TYPOGRAPHY.label, color: COLORS.ink, flex: 1 },
  small: { ...TYPOGRAPHY.small, color: COLORS.muted }, stats: { flexDirection: 'row', gap: 8 }, stat: { flex: 1, padding: 12, backgroundColor: COLORS.soft, borderRadius: 12, gap: 6 }, value: { ...TYPOGRAPHY.heading, color: COLORS.primary },
});
