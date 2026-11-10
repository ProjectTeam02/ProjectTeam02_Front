/** 생성 차단을 실제 통신 전에 적용하며 조회·기존 Node 저장 요청에는 영향을 주지 않는지 검사합니다. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { assertAiRequestAllowed, isAiGenerationEnabled } from '../src/services/aiRequestPolicy.ts';

const previous = process.env.EXPO_PUBLIC_AI_REQUESTS_ENABLED;
test.beforeEach(() => { delete process.env.EXPO_PUBLIC_AI_REQUESTS_ENABLED; });
test.after(() => {
  if (previous === undefined) delete process.env.EXPO_PUBLIC_AI_REQUESTS_ENABLED;
  else process.env.EXPO_PUBLIC_AI_REQUESTS_ENABLED = previous;
});

test('누락되거나 true와 정확히 같지 않은 값은 생성 허용으로 해석하지 않는다', () => {
  assert.equal(isAiGenerationEnabled(), false);
  for (const value of ['', 'false', 'TRUE', 'True', ' true ', '1', 'yes', 'enabled']) {
    process.env.EXPO_PUBLIC_AI_REQUESTS_ENABLED = value;
    assert.equal(isAiGenerationEnabled(), false);
    assert.throws(() => assertAiRequestAllowed('/api/v1/tutor/messages', 'POST'), error => error.code === 'AI_GENERATION_DISABLED');
  }
});

test('Node·내부 API의 알려진 생성 POST를 실행 전에 막는다', async t => {
  const mock = t.mock.method(globalThis, 'fetch', () => { throw new Error('전송 금지'); });
  const guardedSend = async path => { assertAiRequestAllowed(path, 'POST'); return fetch(path, { method: 'POST' }); };
  for (const path of ['/api/v1/tutor/messages', '/api/v1/tutor/messages/?x=1', '/api/v1/questions/generate', '/internal/v1/tutor/answer', '/internal/v1/questions/generate']) {
    await assert.rejects(guardedSend(path), error => error.code === 'AI_GENERATION_DISABLED');
  }
  assert.equal(mock.mock.callCount(), 0);
});

test('상태·이력·사용량 조회와 대화방 생성은 그대로 허용한다', () => {
  for (const path of ['/health', '/__local-ai/health', '/api/v1/health/dependencies', '/api/v1/tutor/conversations', '/api/v1/tutor/usage', '/api/v1/tutor/conversations/id/messages']) {
    assert.doesNotThrow(() => assertAiRequestAllowed(path, 'GET'));
  }
  assert.doesNotThrow(() => assertAiRequestAllowed('/api/v1/tutor/conversations', 'POST'));
  assert.doesNotThrow(() => assertAiRequestAllowed('/api/v1/users/me/notifications', 'PATCH'));
});

test('정확한 true는 요청 함수를 허용할 뿐 자체 통신을 실행하지 않는다', t => {
  const mock = t.mock.method(globalThis, 'fetch', () => { throw new Error('자체 전송 금지'); });
  process.env.EXPO_PUBLIC_AI_REQUESTS_ENABLED = 'true';
  assert.equal(isAiGenerationEnabled(), true);
  assert.doesNotThrow(() => assertAiRequestAllowed('/api/v1/tutor/messages', 'post'));
  assert.doesNotThrow(() => assertAiRequestAllowed('/api/v1/questions/generate', 'POST'));
  assert.equal(mock.mock.callCount(), 0);
});
