/** AI 튜터 화면과 질문 입력을 제공합니다. 실제 답변/사용량 API가 연결되기 전에는 전송하거나 예시 답변을 만들지 않습니다. */
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Screen from '../../components/ui/Screen';
import { Body, Heading, Notice } from '../../components/ui/Primitives';
import LerenCard from '../../components/common/LerenCard';
import LerenInput from '../../components/common/LerenInput';
import LerenButton from '../../components/common/LerenButton';

export default function TutorScreen() {
  const { concept, question } = useLocalSearchParams<{ concept?: string; question?: string }>();
  const [input, setInput] = useState(question || '');
  const composer = <View style={styles.composer}>
    <LerenInput label="메시지" value={input} onChangeText={setInput} placeholder="궁금한 내용을 자유롭게 입력해 주세요" />
    <LerenButton title="전송 준비 중" disabled />
    <Body muted>AI 튜터가 준비되면 질문을 보낼 수 있어요.</Body>
  </View>;
  return <Screen title="AI 튜터" tabs footer={composer}>
    <LerenCard variant="info"><Heading>어떤 경제 개념이 궁금한가요?</Heading><Body muted>어려운 표현을 쉽게 풀어 함께 생각해요.</Body></LerenCard>
    {concept && <LerenCard title={`학습 맥락 · ${concept}`} description="배우던 개념과 연결해 질문할 수 있어요." variant="info" />}
    <Notice>AI 튜터를 준비하고 있어요. 아직 질문이 전송되거나 답변이 생성되지는 않아요.</Notice>
  </Screen>;
}
const styles = StyleSheet.create({ composer: { gap: 12 } });
