/** 실제 서버 성공과 구분되는 로컬 계약 검사입니다. 인증 실패·잘못된 JSON을 빈 이력으로 숨기지 않는지 확인합니다. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { getApiBaseUrl, getAuthenticatedApiBaseUrl, getBackendHealth, getLearningHistory } from '../src/services/apiSmoke.ts';

const origin = 'https://api.example.test';
const page = items => ({ success: true, data: { items, page: 1, pageSize: 10, total: items.length, totalPages: items.length ? 1 : 0 } });
const entry = { recordType: 'LEARNING', recordId: 'test-record', status: 'PASSED', learningDate: '2026-11-06',
  stage: { title: '서버에서 온 스테이지' }, submittedCount: 4, correctCount: 3 };

test.beforeEach(() => { process.env.EXPO_PUBLIC_API_URL = origin; });

test('origin 설정에서 경로·인증 정보·빈 값을 거부한다', () => {
  for (const address of ['', 'https://user:secret@example.test', `${origin}/api/v1`, `${origin}?q=1`, 'file:///tmp/backend']) {
    process.env.EXPO_PUBLIC_API_URL = address;
    assert.throws(getApiBaseUrl);
  }
  process.env.EXPO_PUBLIC_API_URL = `${origin}/`;
  assert.equal(getApiBaseUrl(), origin);
});

test('공개 health는 실제 계약의 JSON만 허용한다', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, `${origin}/health`);
    assert.equal(options.method, 'GET');
    assert.equal(options.headers.Authorization, undefined);
    return Response.json({ service: 'leren-backend', status: 'UP', timestamp: '2026-11-06T00:00:00Z' });
  });
  assert.equal((await getBackendHealth()).status, 'UP');
});

test('원격 HTTP는 공개 진단만 허용하고 토큰은 요청 전에 거절한다', async t => {
  const mocked = t.mock.method(globalThis, 'fetch', () => { throw new Error('토큰이 전송되면 안 됨'); });
  process.env.EXPO_PUBLIC_API_URL = 'http://3.34.171.205';
  assert.equal(getApiBaseUrl(), 'http://3.34.171.205');
  assert.throws(getAuthenticatedApiBaseUrl, /HTTPS/);
  await assert.rejects(getLearningHistory('local-contract-token'), /HTTPS/);
  assert.equal(mocked.mock.callCount(), 0);
  for (const local of ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://[::1]:3000']) {
    process.env.EXPO_PUBLIC_API_URL = local;
    assert.equal(getAuthenticatedApiBaseUrl(), local);
  }
});

test('HTML이나 health 계약이 다른 응답을 정상 처리하지 않는다', async t => {
  const mocked = t.mock.method(globalThis, 'fetch', async () => new Response('<html>proxy</html>', { headers: { 'content-type': 'text/html' } }));
  await assert.rejects(getBackendHealth(), /JSON/);
  mocked.mock.mockImplementation(async () => Response.json({ ok: true }));
  await assert.rejects(getBackendHealth(), /계약/);
});

test('이력은 현재 토큰과 GET만 보내고 서버 항목을 화면 모델로 변환한다', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, `${origin}/api/v1/learning/history?page=1&pageSize=10`);
    assert.equal(options.method, 'GET');
    assert.equal(options.headers.Authorization, 'Bearer local-contract-token');
    assert.equal(options.body, undefined);
    return Response.json(page([entry]));
  });
  const result = await getLearningHistory('local-contract-token');
  assert.equal(result.items[0].stageTitle, entry.stage.title);
  assert.equal(result.items[0].correctCount, 3);
});

test('토큰이 없으면 보호 API에 요청하지 않는다', async t => {
  const mocked = t.mock.method(globalThis, 'fetch', () => { throw new Error('호출되면 안 됨'); });
  await assert.rejects(getLearningHistory(''), /로그인/);
  assert.equal(mocked.mock.callCount(), 0);
});

test('인증 실패와 404는 빈 이력으로 대체하지 않는다', async t => {
  const mocked = t.mock.method(globalThis, 'fetch', async () => Response.json({ success: false }, { status: 401 }));
  await assert.rejects(getLearningHistory('local-contract-token'), /HTTP 401/);
  mocked.mock.mockImplementation(async () => Response.json({ success: false }, { status: 404 }));
  await assert.rejects(getLearningHistory('local-contract-token'), /HTTP 404/);
});

test('서버가 준 빈 목록은 성공이며 잘못된 건수·페이지는 실패다', async t => {
  const mocked = t.mock.method(globalThis, 'fetch', async () => Response.json(page([])));
  assert.equal((await getLearningHistory('local-contract-token')).items.length, 0);
  mocked.mock.mockImplementation(async () => Response.json(page([{ ...entry, correctCount: 5 }])));
  await assert.rejects(getLearningHistory('local-contract-token'), /항목/);
  mocked.mock.mockImplementation(async () => Response.json({ success: true, data: { ...page([]).data, total: 1, totalPages: 0 } }));
  await assert.rejects(getLearningHistory('local-contract-token'), /페이지/);
});

test('화면 종료 신호가 요청에 전달되어 이전 결과를 버린다', async t => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }));
  const controller = new AbortController();
  const request = getBackendHealth(controller.signal);
  controller.abort();
  await assert.rejects(request, /취소/);
});
