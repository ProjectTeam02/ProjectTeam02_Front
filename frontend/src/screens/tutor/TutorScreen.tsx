/** 실제 대화·메시지·한도를 조회하고 AI가 준비된 경우에만 전송합니다. 예시 답변으로 대체하지 않습니다. */
import { useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Heading, LinkRow, Notice, Row } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenButton from '../../components/common/LerenButton';
import LerenInput from '../../components/common/LerenInput';
import LerenCard from '../../components/common/LerenCard';
import { useBackend, useBackendAction } from '../../hooks/useBackend';
import { PATHS, conversationsDecoder, conversationDecoder, messagesDecoder, answerDecoder, usageDecoder, dependenciesDecoder } from '../../services/backend';
export default function TutorScreen() {
  const params = useLocalSearchParams<{ question?: string; concept?: string }>();
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
  const select = (id: string) => { if (action.busy) return; setConversation(id); setMessagePage(1); setNotice(''); request.current = null; };
  const create = async () => { const result = await action.run(PATHS.conversations, conversationDecoder, 'POST', { entryPoint: 'NAV' }); if (result) { select(result.conversationId); setConversationPage(1); conversations.reload(); setNotice('대화방 생성 API가 성공했습니다.'); } };
  const send = async () => {
    const question = input.trim();
    if (!conversation || !question || question.length > 4000 || action.busy || health.data?.fastapi !== 'CONNECTED' || !usage.data || usage.data.remaining <= 0) return;
    // 응답을 잃고 같은 질문을 재전송해도 서버에 중복 메시지를 만들지 않도록 같은 식별자를 유지합니다.
    if (request.current?.question !== question || request.current.conversation !== conversation) request.current = { conversation, question, id: `app-${Date.now()}-${Math.random().toString(36).slice(2)}` };
    setNotice('');
    const result = await action.run('/api/v1/tutor/messages', answerDecoder, 'POST', { conversationId: conversation, question, modelTier: 'BASIC', clientMessageId: request.current.id });
    messages.reload(); usage.reload();
    if (result) { setInput(''); request.current = null; setNotice('메시지 전송과 실제 AI 답변 수신에 성공했습니다.'); setMessagePage(Math.max(1, Math.ceil(((messages.data?.total ?? 0) + (result.duplicate ? 0 : 2)) / 20))); }
  };
  return <Screen title="AI 튜터" tabs>
    <ApiStatus resource={health} label="AI 서비스 상태 조회" />
    {health.data && <Notice tone={health.data.fastapi === 'CONNECTED' ? 'success' : 'error'}>{health.data.fastapi === 'CONNECTED' ? 'AI 서버에 연결되어 있습니다.' : '백엔드 API는 응답했지만 AI 서버가 연결되지 않았습니다. 실제 답변 전송은 준비될 때까지 사용할 수 없습니다.'}</Notice>}
    <ApiStatus resource={usage} label="튜터 사용량" />{usage.data && <Body>오늘 남은 질문 {usage.data.remaining}/{usage.data.dailyLimit}회 · 사용 {usage.data.used}회</Body>}
    <Heading>나의 대화</Heading><ApiStatus resource={conversations} label="대화 목록" empty={conversations.data?.total === 0} />
    {conversations.data?.items.map((c, i) => <LinkRow key={c.conversationId} title={`대화 ${(conversationPage - 1) * 10 + i + 1}${conversation === c.conversationId ? ' · 선택됨' : ''}`} subtitle={new Date(c.createdAt).toLocaleString('ko-KR')} onPress={() => select(c.conversationId)} />)}
    <Row><LerenButton title="이전 대화" style={{ flex: 1, width: undefined }} variant="secondary" disabled={conversationPage <= 1 || action.busy} onPress={() => setConversationPage(p => p - 1)} /><LerenButton title="다음 대화" style={{ flex: 1, width: undefined }} variant="secondary" disabled={!conversations.data || conversationPage * 10 >= conversations.data.total || action.busy} onPress={() => setConversationPage(p => p + 1)} /></Row>
    <LerenButton title="새 대화 만들기" loading={action.busy} disabled={action.busy} onPress={create} />
    {!!notice && <Notice tone="success">{notice}</Notice>}{!!action.error && <Notice tone="error">튜터 요청 실패: {action.error} 예시 답변은 표시하지 않습니다.</Notice>}
    {conversation && <><Heading>선택한 대화 내용</Heading><ApiStatus resource={messages} label="메시지 목록" empty={messages.data?.total === 0} />
      {messages.data?.items.map(m => <LerenCard key={m.messageId} title={`${m.role === 'USER' ? '나의 질문' : 'AI 튜터'} · ${m.status === 'FAILED' ? '요청 실패' : m.status === 'PENDING' ? '처리 중' : '완료'}`} description={m.content}>{m.sources.map((source, i) => <Body key={`${source.documentId}-${i}`} muted>근거: {source.title}</Body>)}</LerenCard>)}
      <Row><LerenButton title="이전 메시지" style={{ flex: 1, width: undefined }} variant="secondary" disabled={messagePage <= 1} onPress={() => setMessagePage(p => p - 1)} /><LerenButton title="다음 메시지" style={{ flex: 1, width: undefined }} variant="secondary" disabled={!messages.data || messagePage * 20 >= messages.data.total} onPress={() => setMessagePage(p => p + 1)} /></Row>
      {params.concept && <Body muted>질문 맥락: {params.concept} (정식 개념 ID는 아직 제공되지 않아 서버 문맥 ID로 보내지 않습니다.)</Body>}
      <LerenInput label="메시지" value={input} onChangeText={setInput} placeholder="궁금한 내용을 입력해 주세요" editable={!action.busy} hint="최대 4000자" />
      <LerenButton title="실제 AI에 질문 전송" loading={action.busy} disabled={action.busy || !input.trim() || input.trim().length > 4000 || health.data?.fastapi !== 'CONNECTED' || !usage.data || usage.data.remaining <= 0} onPress={send} />
    </>}
  </Screen>;
}
