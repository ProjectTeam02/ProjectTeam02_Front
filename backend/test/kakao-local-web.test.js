/** 개발용 HTTP 앱 복귀와 브라우저 CORS를 실제 Express 요청으로 검증합니다. 외부 카카오는 호출하지 않습니다. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
const env = require('../src/config/env');
const app = require('../src/app');
const createMobileService = require('../src/modules/auth/kakao-mobile.service');
const original = { ...env };
const callback = 'http://localhost:3000/api/v1/auth/kakao/callback';
const localApp = 'http://localhost:3001/auth/callback';
const payload = () => ({ codeChallenge: crypto.randomBytes(32).toString('base64url'), codeChallengeMethod: 'S256' });
let server;
let base;

test.beforeEach(async () => {
  Object.assign(env, { nodeEnv: 'test', corsOrigin: 'http://localhost:3001',
    kakaoOauthStoreMode: 'memory', kakaoRestApiKey: 'mock-key', kakaoClientSecret: 'mock-secret',
    kakaoOauthCallbackUrl: callback, kakaoAllowedRedirectUris: [callback],
    kakaoAppDeepLink: localApp, kakaoAllowedAppDeepLinks: [localApp],
    kakaoOauthStateTtlSeconds: 300, kakaoOauthExchangeTtlSeconds: 60 });
  server = await require('./helpers/listen-test-server')(app);
  base = `http://127.0.0.1:${server.address().port}`;
});
test.afterEach(async () => {
  await new Promise(resolve => server.close(resolve));
  Object.assign(env, original);
});

test('개발용 loopback 웹 복귀는 start/callback 취소 흐름에서 허용한다', async () => {
  const service = createMobileService({});
  const attempt = service.start(payload());
  const state = new URL(attempt.authorizationUrl).searchParams.get('state');
  const location = new URL(await service.callback({ state, error: 'access_denied' }));
  assert.equal(location.origin + location.pathname, localApp);
  assert.equal(location.searchParams.get('error'), 'login_cancelled');
});

test('외부 HTTP와 loopback처럼 보이는 다른 호스트는 허용하지 않는다', () => {
  for (const address of ['http://localhost.attacker.test/auth/kakao', 'http://192.168.0.2:3001/auth/kakao', 'http://127.0.0.1.attacker.test/auth/kakao']) {
    env.kakaoAppDeepLink = address;
    env.kakaoAllowedAppDeepLinks = [address];
    assert.throws(() => createMobileService({}).start(payload()), error => error.statusCode === 503);
  }
});

test('운영에서는 loopback 설정이어도 미구현 상태 저장소를 계속 차단한다', () => {
  env.nodeEnv = 'production';
  assert.throws(() => createMobileService({}).start(payload()), error => error.statusCode === 503);
});

test('등록 origin의 JSON·Authorization preflight만 허용한다', async () => {
  const response = await fetch(`${base}/api/v1/auth/kakao/start`, { method: 'OPTIONS', headers: {
    Origin: 'http://localhost:3001', 'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type,authorization',
  } });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3001');
  assert.equal(response.headers.get('access-control-allow-credentials'), null);
  assert.match(response.headers.get('vary'), /Origin/);
});

test('다른 origin에는 CORS 허용 헤더를 반사하지 않는다', async () => {
  const response = await fetch(`${base}/health`, { headers: { Origin: 'http://localhost.attacker.test:3001' } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});

test('허용 origin이라도 미등록 요청 헤더의 preflight는 거절한다', async () => {
  const response = await fetch(`${base}/api/v1/auth/kakao/start`, { method: 'OPTIONS', headers: {
    Origin: 'http://localhost:3001', 'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type,x-unapproved-header',
  } });
  assert.equal(response.status, 403);
});

test('실제 start 응답에 CORS를 붙이되 세션·카카오 토큰은 포함하지 않는다', async () => {
  const response = await fetch(`${base}/api/v1/auth/kakao/start`, { method: 'POST', headers: {
    Origin: 'http://localhost:3001', 'Content-Type': 'application/json',
  }, body: JSON.stringify(payload()) });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3001');
  assert.equal(new URL(body.data.authorizationUrl).origin, 'https://kauth.kakao.com');
  assert.equal(body.data.accessToken, undefined);
});
