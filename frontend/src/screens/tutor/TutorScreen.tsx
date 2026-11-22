/** 실제 대화·메시지·한도를 조회하고 AI가 준비된 경우에만 전송합니다. 예시 답변으로 대체하지 않습니다. */
import { useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import Screen from '../../components/ui/Screen';
import { Body, Chip, Heading, LinkRow, Notice, Row } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenButton from '../../components/common/LerenButton';
import LerenInput from '../../components/common/LerenInput';
import LerenCard from '../../components/common/LerenCard';
import { useBackend, useBackendAction } from '../../hooks/useBackend';
import { isLearningId } from '../../services/learningApi';
import { isAiGenerationEnabled } from '../../services/aiRequestPolicy';
import { PATHS, conversationsDecoder, conversationDecoder, messagesDecoder, answerDecoder, usageDecoder, dependenciesDecoder } from '../../services/backend';
export default function TutorScreen() {
  // EC2 연결 상태와 실제 튜터 생성 허용 여부는 별도로 관리합니다.
  const aiRequestsEnabled = isAiGenerationEnabled();
  const params = useLocalSearchParams<{ question?: string; concept?: string; stageId?: string }>();
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState(params.question ?? '');
  const [conversation, setConversation] = useState<string | null>(null);
  const [conversationPage, setConversationPage] = useState(1);
  const [messagePage, setMessagePage] = useState(1);
  const [notice, setNotice] = useState('');
  const request = useRef<{ conversation: string; question: string; id: string } | null>(null);
  const conversations = useBackend(`${PATHS.conversations}?page=${conversationPage}&pageSize=10`, conversationsDecoder);
  const messages = useBackend(conversation ? `${PATHS.conversations}/${conversation}/messages?page=${messagePage}&pageSize=20` : null, messagesDecoder);
  const usage = useBackend(PATHS.usage, usageDecoder);
  const health = useBackend('/api/v1/health/dependencies', dependenciesDecoder);
  const action = useBackendAction();
  const select = (id: string) => { if (action.busy) return; setConversation(id); setMessagePage(1); setShowHistory(false); setNotice(''); request.current = null; };
  const create = async () => { const result = await action.run(PATHS.conversations, conversationDecoder, 'POST', { entryPoint: 'NAV' }); if (result) { select(result.conversationId); setConversationPage(1); conversations.reload(); setNotice('새 대화를 시작했어요.'); } };
  const send = async () => {
    const question = input.trim();
    if (!aiRequestsEnabled || !conversation || !question || question.length > 4000 || action.busy || health.data?.fastapi !== 'CONNECTED' || !usage.data || usage.data.remaining <= 0) return;
    // 응답을 잃고 같은 질문을 재전송해도 서버에 중복 메시지를 만들지 않도록 같은 식별자를 유지합니다.
    if (request.current?.question !== question || request.current.conversation !== conversation) request.current = { conversation, question, id: `app-${Date.now()}-${Math.random().toString(36).slice(2)}` };
    setNotice('');
    const result = await action.run('/api/v1/tutor/messages', answerDecoder, 'POST', { conversationId: conversation, question, modelTier: 'BASIC', clientMessageId: request.current.id });
    messages.reload(); usage.reload();
    if (result) { setInput(''); request.current = null; setNotice('답변이 도착했어요.'); setMessagePage(Math.max(1, Math.ceil(((messages.data?.total ?? 0) + (result.duplicate ? 0 : 2)) / 20))); }
  };
  const canSend = aiRequestsEnabled && !action.busy && !!input.trim() && input.trim().length <= 4000
    && health.data?.fastapi === 'CONNECTED' && !!usage.data && usage.data.remaining > 0;
  const composer = <>
    <Row style={s.composeRow}>
      <View style={s.field}><LerenInput label="메시지" value={input} onChangeText={setInput}
        placeholder="궁금한 내용을 입력해 주세요" editable={!action.busy} /></View>
      {conversation && <LerenButton title="전송" style={s.send} loading={action.busy} disabled={!canSend} onPress={send} />}
    </Row>
    {!conversation && <LerenButton title="새 대화 시작하기" loading={action.busy} disabled={action.busy} onPress={create} />}
    {input.length > 4000 && <Body muted>메시지는 최대 4000자까지 보낼 수 있어요.</Body>}
    {usage.data && <Body muted>오늘 남은 질문 {usage.data.remaining} / {usage.data.dailyLimit}회</Body>}
  </>;
  return <Screen title="AI 튜터" tabs footer={conversation && !showHistory ? composer : undefined} right={<Chip label="대화 목록" active={showHistory} onPress={() => setShowHistory(v => !v)} />}>
    {showHistory ? <>
      <Heading>나의 대화</Heading><ApiStatus resource={conversations} label="대화 목록" empty={conversations.data?.total === 0} />
      {conversations.data?.items.map((c, i) => <LinkRow key={c.conversationId} title={`대화 ${(conversationPage - 1) * 10 + i + 1}${conversation === c.conversationId ? ' · 선택됨' : ''}`} subtitle={new Date(c.createdAt).toLocaleString('ko-KR')} onPress={() => select(c.conversationId)} />)}
      {(conversationPage > 1 || (conversations.data?.total ?? 0) > 10) && <Row><LerenButton title="이전 대화" style={s.page} variant="secondary" disabled={conversationPage <= 1 || action.busy} onPress={() => setConversationPage(p => p - 1)} /><LerenButton title="다음 대화" style={s.page} variant="secondary" disabled={!conversations.data || conversationPage * 10 >= conversations.data.total || action.busy} onPress={() => setConversationPage(p => p + 1)} /></Row>}
      <LerenButton title="새 대화 시작하기" disabled={action.busy} loading={action.busy} onPress={create} />
    </> : <>
      {!conversation && <View style={s.welcome}>
        <Image source={tutor} resizeMode="contain" style={s.friend} accessibilityLabel="책을 든 AI 튜터" />
        <Heading>어떤 경제 개념이 궁금한가요?</Heading><Body muted>어려운 표현을 쉽게 풀어 함께 생각해요.</Body>
      </View>}
      {params.concept && <LerenCard variant="info" title={'학습 맥락 · ' + params.concept}>
        {isLearningId(params.stageId) && <LinkRow title="연결된 학습 확인" onPress={() => router.navigate({ pathname: '/lesson', params: { stageId: params.stageId } })} />}
      </LerenCard>}
      {conversation && <>
        <ApiStatus resource={messages} label="대화 내용" empty={messages.data?.total === 0} />
        {messages.data?.items.map((m, index, list) => {
          const mine = m.role === 'USER';
          const previous = list.slice(0, index).reverse().find(message => message.role === 'USER');
          return <View key={m.messageId} style={[s.message, mine && s.mine]}>
            {!mine && <Image source={tutor} resizeMode="contain" style={s.avatar} accessibilityLabel="AI 튜터" />}
            <View style={[s.bubble, mine && s.myBubble]}><Text style={s.speaker}>{mine ? '나' : 'AI 튜터'}</Text>
              {!!m.content && <Body>{m.content}</Body>}
              {m.status === 'FAILED' && <Body muted>답변을 받지 못했어요.</Body>}
              {m.status === 'PENDING' && <Body muted>답변을 작성하고 있어요…</Body>}
              {!mine && !!m.content && !m.sources.length && m.status !== 'PENDING' && <>
                <Body muted>이 답변에 첨부된 출처가 없어요.</Body>
                {previous && <LerenButton title="질문 다시 쓰기" variant="secondary" disabled={!!input.trim()} onPress={() => setInput(previous.content)} />}
              </>}
              {m.sources.map((source, i) => <Body key={`${source.documentId}-${i}`} muted>출처 · {source.title}</Body>)}
            </View>
          </View>;
        })}
        {(messagePage > 1 || (messages.data?.total ?? 0) > 20) && <Row><LerenButton title="이전 메시지" style={s.page} variant="secondary" disabled={messagePage <= 1} onPress={() => setMessagePage(p => p - 1)} /><LerenButton title="다음 메시지" style={s.page} variant="secondary" disabled={!messages.data || messagePage * 20 >= messages.data.total} onPress={() => setMessagePage(p => p + 1)} /></Row>}
      </>}
      {!conversation && <Row style={s.suggestions}>{['기회비용이 뭔가요?', '돈의 역할이 궁금해요'].map(q => <Chip label={q} key={q} onPress={() => setInput(q)} />)}</Row>}
      {!conversation && composer}
      {!aiRequestsEnabled ? <Notice>지금은 이전 대화를 읽을 수 있어요. 새 질문 전송은 준비 중이에요.</Notice>
        : health.data && health.data.fastapi !== 'CONNECTED' && <Notice>튜터가 잠시 응답할 수 없어요. 잠시 후 다시 시도해 주세요.</Notice>}
      {usage.status !== 'success' && <ApiStatus resource={usage} label="질문 한도" />}
      {health.status !== 'success' && <ApiStatus resource={health} label="튜터 상태" />}
      {usage.data && health.data && <Chip label="튜터 상태 새로고침" onPress={() => { usage.reload(); health.reload(); }} />}
      {conversation && action.busy && <Body muted>튜터가 답변을 작성하고 있어요…</Body>}
    </>}
    {!!notice && <Notice tone="success">{notice}</Notice>}{!!action.error && <Notice tone="error">{action.error}</Notice>}
  </Screen>;
}
const tutor = require('../../../assets/characters/leren_tutor.png');
const s = StyleSheet.create({
  composeRow: { alignItems: 'flex-end' }, field: { flex: 1 }, send: { width: 72, minHeight: 54 },
  welcome: { alignItems: 'center', paddingVertical: 20, gap: 8 }, friend: { width: 128, height: 117 },
  suggestions: { flexWrap: 'wrap' }, page: { flex: 1, width: undefined },
  message: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' }, mine: { justifyContent: 'flex-end' },
  avatar: { width: 40, height: 40 }, bubble: { flexShrink: 1, maxWidth: '83%', borderRadius: 16, padding: 12, gap: 4, borderWidth: 1, borderColor: COLORS.line },
  myBubble: { backgroundColor: COLORS.soft }, speaker: { ...TYPOGRAPHY.small, color: COLORS.primary },
});
