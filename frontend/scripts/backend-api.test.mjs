/** 빈 결과·장애·권한 오류가 서로 바뀌지 않는지 검사합니다. 실제 자격증명은 사용하지 않습니다. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { backendRequest, historyDecoder, quizDecoder, dependenciesDecoder, memberDecoder, PATHS, notificationDecoder, planDecoder, deletedDecoder, detailDecoder, answerDecoder } from '../src/services/backend.ts';
test.beforeEach(() => { process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000'; });
test('인증 헤더·정확한 경로를 사용하며 빈 이력은 성공으로 반환한다', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => { assert.equal(url, `http://localhost:3000${PATHS.history}`); assert.equal(options.headers.Authorization, 'Bearer test-token'); assert.equal(options.redirect, 'error'); return Response.json({ success: true, data: { items: [], page: 1, total: 0, totalPages: 0 } }); });
  assert.equal((await backendRequest('test-token', PATHS.history, historyDecoder)).total, 0);
});
test('정확한 승인 문제 없음 404만 빈 문제 상태로 구분한다', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ success: false, code: 'NOT_FOUND', message: '승인된 문제가 없습니다.' }, { status: 404 }));
  await assert.rejects(backendRequest('test', PATHS.quiz, quizDecoder), e => e.code === 'NO_APPROVED_QUESTION');
  mock.mock.mockImplementation(async () => Response.json({ success: false, code: 'NOT_FOUND', message: '경로가 없습니다.' }, { status: 404 }));
  await assert.rejects(backendRequest('test', PATHS.quiz, quizDecoder), e => e.code !== 'NO_APPROVED_QUESTION' && e.status === 404);
});
test('인증 만료·DB 장애를 성공 또는 빈 데이터로 처리하지 않는다', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ success: false }, { status: 401 }));
  await assert.rejects(backendRequest('test', PATHS.history, historyDecoder), /다시 로그인/);
  mock.mock.mockImplementation(async () => Response.json({ success: false, code: 'SERVICE_UNAVAILABLE' }, { status: 503 }));
  await assert.rejects(backendRequest('test', PATHS.history, historyDecoder), /HTTP 503/);
});

test('배포되지 않은 API와 개별 데이터 없음은 서로 다른 오류로 남긴다', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ success: false, code: 'NOT_FOUND', message: '요청한 API를 찾을 수 없습니다.' }, { status: 404 }));
  await assert.rejects(backendRequest('test', PATHS.history, historyDecoder), e => e.code === 'API_NOT_CONNECTED' && e.status === 404);
  mock.mock.mockImplementation(async () => Response.json({ success: false, code: 'NOT_IMPLEMENTED' }, { status: 501 }));
  await assert.rejects(backendRequest('test', PATHS.history, historyDecoder), e => e.code === 'API_NOT_CONNECTED' && e.status === 501);
  mock.mock.mockImplementation(async () => Response.json({ success: false, code: 'NOT_FOUND', message: '학습 기록이 없습니다.' }, { status: 404 }));
  await assert.rejects(backendRequest('test', PATHS.history, historyDecoder), e => e.code === 'NOT_FOUND' && e.status === 404);
});

test('깨진 성공 응답과 통신 장애는 진단 코드로 구분한다', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ success: true, data: {} }));
  await assert.rejects(backendRequest('test', PATHS.history, historyDecoder), e => e.code === 'INVALID_RESPONSE');
  mock.mock.mockImplementation(async () => { throw new TypeError('contract network error'); });
  await assert.rejects(backendRequest('test', PATHS.history, historyDecoder), e => e.code === 'NETWORK_ERROR');
});
test('잘못된 성공 응답·HTML을 빈 목록으로 처리하지 않는다', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ success: true, data: {} }));
  await assert.rejects(backendRequest('test', PATHS.history, historyDecoder), /응답 형식/);
  mock.mock.mockImplementation(async () => new Response('<html>proxy</html>', { status: 502 }));
  await assert.rejects(backendRequest('test', PATHS.history, historyDecoder), /JSON/);
});
test('누락된 성장·지갑·직업은 실제 null 그대로 남긴다', () => {
  const parsed = memberDecoder({ userId: 'u', nickname: 'n', email: 'e', level: null, totalExp: null, economyLevel: null, economyExp: null, coinBalance: null, completedStageCount: 0, characterClass: null, equippedCostumes: [] });
  assert.equal(parsed.level, null); assert.equal(parsed.coinBalance, null); assert.equal(parsed.characterClass, null);
});
test('HTTP 200 DEGRADED를 AI 정상 연결로 바꾸지 않는다', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ status: 'DEGRADED', database: 'CONNECTED', fastapi: 'DISCONNECTED' }));
  assert.equal((await backendRequest('test', '/api/v1/health/dependencies', dependenciesDecoder)).fastapi, 'DISCONNECTED');
});
test('알림 저장은 실제 boolean을 보내고 서버 응답의 boolean을 반환한다', async t => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => { assert.equal(options.method, 'PATCH'); assert.deepEqual(JSON.parse(options.body), { learningOn: false }); return Response.json({ success: true, data: { learningOn: false } }); });
  assert.equal((await backendRequest('test', '/api/v1/users/me/notifications', notificationDecoder, { method: 'PATCH', body: { learningOn: false } })).learningOn, false);
});
test('원격 HTTP와 미인증 요청은 전송 전에 차단한다', async t => {
  const mock = t.mock.method(globalThis, 'fetch', () => { throw new Error('전송 금지'); });
  process.env.EXPO_PUBLIC_API_URL = 'http://example.test';
  await assert.rejects(backendRequest('test', PATHS.history, historyDecoder), /HTTPS/);
  process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';
  await assert.rejects(backendRequest('', PATHS.history, historyDecoder), /로그인/);
  assert.equal(mock.mock.callCount(), 0);
});
test('화면 이탈 취소 신호를 실제 요청에 전달한다', async t => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async (_url, options) => { assert.equal(options.signal.aborted, true); throw new DOMException('aborted', 'AbortError'); });
  controller.abort();
  await assert.rejects(backendRequest('test', PATHS.history, historyDecoder, { signal: controller.signal }), /aborted/);
});
test('일정 추가·수정·삭제 요청은 실제 대상 ID와 서버 삭제 응답을 사용한다', async t => {
  const plan = { planId: 'plan-id', scheduledDate: '2026-11-06', goal: '복습', planType: 'REVIEW', topic: { topicId: 'topic-id', title: '경제' }, stageId: 'stage-id', conceptId: null };
  const sent = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => { sent.push({ url, method: options.method, body: options.body ? JSON.parse(options.body) : null }); return Response.json({ success: true, data: options.method === 'DELETE' ? { planId: plan.planId, deleted: true } : plan }, { status: options.method === 'POST' ? 201 : 200 }); });
  const body = { scheduledDate: plan.scheduledDate, goal: plan.goal, planType: plan.planType, topicId: plan.topic.topicId, stageId: plan.stageId, conceptId: null };
  await backendRequest('test', PATHS.plans, planDecoder, { method: 'POST', body });
  await backendRequest('test', `${PATHS.plans}/${plan.planId}`, planDecoder, { method: 'PATCH', body });
  assert.equal((await backendRequest('test', `${PATHS.plans}/${plan.planId}`, deletedDecoder, { method: 'DELETE' })).deleted, true);
  assert.deepEqual(sent.map(r => r.method), ['POST', 'PATCH', 'DELETE']); assert.deepEqual(sent[0].body, body);
  assert.throws(() => deletedDecoder({ planId: plan.planId, deleted: false }), /응답 형식/);
});
test('실제 이력 상세의 문항·선택 답·채점·해설을 누락 없이 변환한다', () => {
  const detail = detailDecoder({ recordType: 'LEARNING', recordId: 'record', status: 'PASSED', learningDate: '2026-11-06', stage: { stageId: 'stage', title: '단계' }, topic: { topicId: 'topic', title: '주제' }, submittedCount: 1, correctCount: 1, accuracyPercentage: 100, submissions: [{ submissionId: 'submission', question: { questionText: '문제' }, selectedAnswer: { choiceText: '선택' }, isCorrect: true, explanation: '해설' }] });
  assert.deepEqual(detail.submissions[0], { submissionId: 'submission', questionText: '문제', selectedAnswer: '선택', isCorrect: true, explanation: '해설' });
});
test('튜터 실제 답변·근거를 읽고 깨진 답변은 생성 성공으로 처리하지 않는다', () => {
  const userMessage = { messageId: 'u', role: 'USER', content: '질문', status: 'COMPLETED' };
  const assistantMessage = { messageId: 'a', role: 'ASSISTANT', content: '답변', status: 'COMPLETED', sources: [{ documentId: 'document', titleSnapshot: '학습 자료' }] };
  assert.equal(answerDecoder({ userMessage, assistantMessage }).assistantMessage.sources[0].title, '학습 자료');
  assert.throws(() => answerDecoder({ userMessage }), /응답 형식/);
});
