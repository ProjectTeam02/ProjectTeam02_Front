/** 실제 카카오 접속과 구분되는 로컬 계약 검사입니다. PKCE·콜백 오염·중복 교환·취소·실패 처리를 검증합니다. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto, createHash } from 'node:crypto';
import { createKakaoFlow, createPkce, getKakaoWebFlow } from '../src/services/kakao.ts';

const origin = 'http://localhost:3000';
const attempt = 'd404d773-0bbf-400b-9f17-80d4b9d2e49a';
const code = 'c'.repeat(43);
const authorization = () => {
  const url = new URL('https://kauth.kakao.com/oauth/authorize');
  url.search = new URLSearchParams({ response_type: 'code', client_id: 'local-test-key',
    redirect_uri: `${origin}/api/v1/auth/kakao/callback`, state: 's'.repeat(43) }).toString();
  return url.toString();
};
const login = { success: true, data: { user: { userId: 'local-test-user', nickname: '테스트 사용자', email: null },
  accessToken: 'contract-access-token', refreshToken: 'contract-refresh-token' } };
test.beforeEach(() => { process.env.EXPO_PUBLIC_API_URL = origin; });

function fixture() {
  const data = new Map();
  const calls = [];
  const navigations = [];
  let url = `http://localhost:3001/auth/callback?loginAttemptId=${attempt}&loginCode=${code}`;
  let now = 100000;
  let handler = async route => route.endsWith('/start')
    ? Response.json({ success: true, data: { authorizationUrl: authorization(), loginAttemptId: attempt, expiresIn: 300 } })
    : Response.json(login);
  const browser = {
    storage: { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) },
    crypto: webcrypto, now: () => now, currentUrl: () => url,
    replaceUrl: clean => { calls.push({ clean }); url = `http://localhost:3001${clean}`; },
    navigate: target => { navigations.push(target); },
    fetch: async (route, options) => { calls.push({ route, options }); return handler(route, options); },
  };
  return { data, calls, navigations, flow: createKakaoFlow(browser), browser,
    setUrl: value => { url = value; }, setNow: value => { now = value; },
    setHandler: value => { handler = value; }, currentUrl: () => url };
}

test('PKCE는 무작위 검증값과 실제 SHA256 base64url challenge를 만든다', async () => {
  const first = await createPkce(webcrypto);
  const second = await createPkce(webcrypto);
  assert.match(first.verifier, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(first.verifier, second.verifier);
  assert.equal(first.challenge, createHash('sha256').update(first.verifier).digest('base64url'));
});

test('start는 검증값만 탭에 보관하고 실제 카카오 도메인으로 이동한다', async () => {
  const f = fixture();
  await f.flow.begin();
  const saved = JSON.parse([...f.data.values()][0]);
  assert.equal(saved.attemptId, attempt);
  assert.equal(saved.origin, origin);
  assert.equal(saved.expiresAt - saved.createdAt, 300000);
  assert.equal(saved.accessToken, undefined);
  assert.equal(f.navigations[0], authorization());
  const request = f.calls[0];
  assert.equal(request.route, 'http://localhost:3000/api/v1/auth/kakao/start');
  assert.equal(new URL(f.navigations[0]).searchParams.get('redirect_uri'), 'http://localhost:3000/api/v1/auth/kakao/callback');
  const payload = JSON.parse(request.options.body);
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.redirect, 'error');
  assert.equal(payload.codeChallengeMethod, 'S256');
  assert.equal(payload.codeChallenge, createHash('sha256').update(saved.verifier).digest('base64url'));
  assert.equal(payload.codeVerifier, undefined);
});

test('임의 도메인 또는 다른 콜백을 반환하면 이동하지 않는다', async () => {
  for (const target of ['https://evil.example/oauth/authorize', authorization().replace('localhost%3A3000', 'localhost%3A9999')]) {
    const f = fixture();
    f.setHandler(async () => Response.json({ success: true, data: { authorizationUrl: target, loginAttemptId: attempt, expiresIn: 300 } }));
    await assert.rejects(f.flow.begin(), /인증 주소|콜백 주소/);
    assert.equal(f.navigations.length, 0);
    assert.equal(f.data.size, 0);
  }
});

test('콜백 쿼리를 먼저 지우고 한 번만 exchange한 실제 응답을 돌려준다', async () => {
  const f = fixture();
  await f.flow.begin();
  const saved = JSON.parse([...f.data.values()][0]);
  f.calls.length = 0;
  const first = f.flow.finish();
  assert.equal(f.flow.finish(), first);
  const result = await first;
  assert.equal(result.accessToken, login.data.accessToken);
  assert.equal(f.currentUrl(), 'http://localhost:3001/auth/callback');
  assert.deepEqual(f.calls[0], { clean: '/auth/callback' });
  assert.equal(f.data.size, 0);
  const exchanges = f.calls.filter(call => call.route?.endsWith('/exchange'));
  assert.equal(exchanges.length, 1);
  assert.equal(exchanges[0].route, 'http://localhost:3000/api/v1/auth/kakao/exchange');
  assert.deepEqual(JSON.parse(exchanges[0].options.body), { loginCode: code, codeVerifier: saved.verifier, loginAttemptId: attempt });
});

test('만료·시도 불일치·중복 파라미터는 교환 전에 거절하고 쿼리를 지운다', async () => {
  for (const type of ['expired', 'mismatch', 'duplicate', 'missing']) {
    const f = fixture();
    if (type !== 'missing') await f.flow.begin();
    if (type === 'expired') f.setNow(500000);
    if (type === 'mismatch') f.setUrl(`http://localhost:3001/auth/callback?loginAttemptId=6d4b2456-c2ad-4e5e-bb5e-1bbda3e00273&loginCode=${code}`);
    if (type === 'duplicate') f.setUrl(`http://localhost:3001/auth/callback?loginAttemptId=${attempt}&loginCode=${code}&loginCode=${code}`);
    f.calls.length = 0;
    await assert.rejects(f.flow.finish());
    assert.equal(f.currentUrl(), 'http://localhost:3001/auth/callback');
    assert.equal(f.data.size, 0);
    assert.equal(f.calls.filter(call => call.route).length, 0);
  }
});

test('사용자 취소를 성공으로 처리하지 않고 임시 검증값을 지운다', async () => {
  const f = fixture();
  await f.flow.begin();
  f.setUrl(`http://localhost:3001/auth/callback?loginAttemptId=${attempt}&error=login_cancelled`);
  f.calls.length = 0;
  await assert.rejects(f.flow.finish(), /취소/);
  assert.equal(f.data.size, 0);
  assert.equal(f.calls.filter(call => call.route).length, 0);
});

test('콜백에서 API 주소가 바뀌면 코드를 다른 서버에 보내지 않는다', async () => {
  const f = fixture();
  await f.flow.begin();
  process.env.EXPO_PUBLIC_API_URL = 'https://different.example';
  f.calls.length = 0;
  await assert.rejects(f.flow.finish(), /없거나 만료/);
  assert.equal(f.calls.filter(call => call.route).length, 0);
});

test('백엔드 설정 누락 503은 실제 오류이며 카카오 화면으로 이동하지 않는다', async () => {
  const f = fixture();
  f.setHandler(async () => Response.json({ message: 'configuration missing' }, { status: 503 }));
  await assert.rejects(f.flow.begin(), /설정이 준비되지/);
  assert.equal(f.data.size, 0);
  assert.equal(f.navigations.length, 0);
});

test('원격 HTTP로는 인증 요청을 전송하지 않는다', async () => {
  const f = fixture();
  process.env.EXPO_PUBLIC_API_URL = 'http://3.34.171.205';
  await assert.rejects(f.flow.begin(), /HTTPS/);
  assert.equal(f.calls.length, 0);
});

test('서버가 토큰을 누락하거나 HTML을 돌려주면 인증 성공으로 처리하지 않는다', async () => {
  for (const response of [Response.json({ success: true, data: { user: login.data.user } }), new Response('<html>proxy</html>')]) {
    const f = fixture();
    await f.flow.begin();
    f.setHandler(async () => response);
    await assert.rejects(f.flow.finish(), /응답 형식|JSON/);
  }
});

test('브라우저가 없는 네이티브·CLI에서는 PC 웹 단계임을 명확히 안내한다', () => {
  assert.throws(getKakaoWebFlow, /PC 브라우저/);
});
