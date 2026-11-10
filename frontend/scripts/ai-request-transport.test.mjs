/** 유료 전송 차단이 화면이 아닌 실제 공통 요청 함수에서도 적용되는지 확인합니다. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { backendRequest, conversationsDecoder, answerDecoder } from '../src/services/backend.ts';

test.beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'https://lerenapp.com';
  process.env.EXPO_PUBLIC_AI_REQUESTS_ENABLED = 'false';
});

test('AI 생성 요청은 fetch를 호출하기 전에 거절한다', async t => {
  const sent = t.mock.method(globalThis, 'fetch', () => { throw new Error('호출되면 안 됩니다.'); });
  await assert.rejects(backendRequest('synthetic-token', '/api/v1/tutor/messages', answerDecoder, {
    method: 'POST', body: { question: '전송하지 않는 질문' },
  }));
  assert.equal(sent.mock.callCount(), 0);
});

test('일반 대화 목록은 실제 설정한 EC2 주소로 요청한다', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://lerenapp.com/api/v1/tutor/conversations');
    assert.equal(options.method, 'GET');
    return Response.json({ success: true, data: { total: 0, items: [] } });
  });
  const response = await backendRequest('synthetic-token', '/api/v1/tutor/conversations', conversationsDecoder);
  assert.equal(response.total, 0);
});
