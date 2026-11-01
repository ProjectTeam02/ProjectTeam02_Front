/** AI 튜터 화면 시안: 백엔드 학습 자료로 예시 답변을 구성하며 실제 모델 호출은 아직 하지 않습니다. */
import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Screen from '../../components/ui/Screen';
import LearningContentState from '../../components/ui/LearningContentState';
import { Body, Chip, Heading, Notice, Row } from '../../components/ui/Primitives';
import LerenCard from '../../components/common/LerenCard';
import LerenInput from '../../components/common/LerenInput';
import LerenButton from '../../components/common/LerenButton';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useLearningContent } from '../../context/LearningContentContext';
interface Message { id: number; role: 'user' | 'tutor'; text: string }
export default function TutorScreen() {
  const { status, regions } = useLearningContent();
  if (status !== 'ready' || regions.length === 0) return <Screen title="AI 튜터" tabs><LearningContentState>{null}</LearningContentState></Screen>;
  return <TutorContent />;
}

function TutorContent() {
  const { regions, questions } = useLearningContent();
  const { state, question, concept } = useLocalSearchParams<{ state?: string; question?: string; concept?: string }>();
  const lessons = regions.flatMap(region => region.lessons);
  const conceptQuestion = questions.find(item => item.concept === concept);
  const conceptLesson = lessons.find(item => item.title === concept);
  const contextName = conceptQuestion?.concept || conceptLesson?.title || regions.find(region => region.title === concept)?.title || regions[0]?.title || '학습 자료';
  const suggestedQuestions = questions.filter((item, index, all) => all.findIndex(other => other.concept === item.concept) === index).slice(0, 2);
  const firstQuestion = conceptQuestion || questions[0];
  const [input, setInput] = useState(question || '');
  const [messages, setMessages] = useState<Message[]>(state === 'answer' && firstQuestion ? [{ id: 1, role: 'user', text: `${firstQuestion.concept}이 뭔가요?` }, { id: 2, role: 'tutor', text: firstQuestion.explanation }] : []);
  const [remaining, setRemaining] = useState(state === 'unavailable' ? 0 : 4);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  // 답변 문구를 프론트에 복사하지 않고 내려받은 문제 해설·개념 본문만 참조합니다.
  const sampleAnswer = (text: string) => {
    const matchedQuestion = questions.find(item => text.includes(item.concept));
    if (matchedQuestion) return matchedQuestion.explanation;
    const matchedLesson = lessons.find(item => text.includes(item.title));
    if (matchedLesson) return matchedLesson.concept;
    return '현재 준비된 학습 자료에서 연결되는 개념을 찾지 못했어요. 추천 질문을 선택해 자료의 설명을 확인해 주세요.';
  };
  // 로컬 대기 시간을 넣어 전송 중 표시를 확인합니다. 서버의 AI 답변을 생성하는 기능은 아닙니다.
  const send = () => {
    const text = input.trim();
    if (!text || busy || remaining <= 0) return;
    setMessages(old => [...old, { id: Date.now(), role: 'user', text }]);
    setInput(''); setBusy(true); setRemaining(old => old - 1);
    timer.current = setTimeout(() => { setMessages(old => [...old, { id: Date.now() + 1, role: 'tutor', text: sampleAnswer(text) }]); setBusy(false); }, 700);
  };
  const composer = <View style={s.composer}><LerenInput label="메시지" value={input} onChangeText={setInput} placeholder="궁금한 내용을 자유롭게 입력해 주세요" editable={!busy && remaining > 0} /><LerenButton title="전송" onPress={send} disabled={!input.trim() || remaining <= 0} loading={busy} /><Body muted style={s.small}>오늘 남은 질문 {remaining}회 · 예시 대화</Body></View>;
  return <Screen title="AI 튜터" tabs footer={composer}>
    {messages.length === 0 ? <><LerenCard variant="info" style={s.hero}><Heading>어떤 경제 개념이 궁금한가요?</Heading><Body muted style={s.small}>어려운 표현을 쉽게 풀어 함께 생각해요.</Body></LerenCard><Row style={s.suggestions}>{suggestedQuestions.map(item => <Chip key={item.id} label={`${item.concept}이 뭔가요?`} onPress={() => setInput(`${item.concept}이 뭔가요?`)} />)}</Row><LerenCard title={`학습 맥락 · ${contextName}`} description="배우고 있는 개념과 연결해 질문할 수 있어요." variant="info" /></> : messages.map(message => <LerenCard key={message.id} title={message.role === 'user' ? '나의 질문' : 'AI 튜터 · 자료의 예시 답변'} variant={message.role === 'user' ? 'info' : 'default'} description={message.text} />)}
    {busy && <Row><ActivityIndicator color={COLORS.primary} /><Body muted>답변을 준비하고 있어요.</Body></Row>}
    {remaining === 0 && <Notice>오늘의 질문을 모두 사용했어요. 학습 자료를 다시 살펴보세요.</Notice>}
    {state === 'noSources' && <Notice>확인할 수 있는 근거가 부족해요. 학습 자료에서 다시 확인해 주세요.</Notice>}
  </Screen>;
}
const s = StyleSheet.create({ hero: { borderWidth: 0, gap: 10 }, small: { ...TYPOGRAPHY.small }, suggestions: { flexWrap: 'wrap' }, composer: { gap: 12 } });
