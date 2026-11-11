/** 모의 인증 창과 실제 공통 검증기를 연결해 모바일 교환·취소·잘못된 복귀를 검사합니다. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto, createHash } from 'node:crypto';
import { runNativeKakaoSignIn, KAKAO_APP_RETURN } from '../src/services/kakaoNativeFlow.ts';
const origin = 'https://lerenapp.com';
const attempt = 'd404d773-0bbf-400b-9f17-80d4b9d2e49a';
const code = 'c'.repeat(43);
function fixture(result = { type: 'success', url: `${KAKAO_APP_RETURN}?loginAttemptId=${attempt}&loginCode=${code}` }) {
  process.env.EXPO_PUBLIC_API_URL = origin;
  const requests = []; let opened = false;
  const deps = { crypto: webcrypto,
    fetch: async (url, options) => {
      requests.push({ url, body: JSON.parse(options.body) });
      if (url.endsWith('/start')) {
        const auth = new URL('https://kauth.kakao.com/oauth/authorize');
        auth.search = new URLSearchParams({ response_type: 'code', client_id: 'test-key', state: 's'.repeat(43), redirect_uri: `${origin}/api/v1/auth/kakao/callback` }).toString();
        return Response.json({ success: true, data: { authorizationUrl: auth.toString(), loginAttemptId: attempt, expiresIn: 300 } });
      }
      return Response.json({ success: true, data: { user: { userId: 'test-user', nickname: '카카오 사용자', email: null }, accessToken: 'test-access', refreshToken: 'test-refresh' } });
    },
    openAuthSession: async (url, redirect) => { opened = true; assert.equal(new URL(url).host, 'kauth.kakao.com'); assert.equal(redirect, KAKAO_APP_RETURN); return result; },
  };
  return { deps, requests, opened: () => opened };
}
test('앱 복귀 후 원본 verifier로 한 번 교환하고 실제 세션 응답을 전달한다', async () => {
  const f = fixture(); const session = await runNativeKakaoSignIn(f.deps);
  assert.equal(session.accessToken, 'test-access'); assert.equal(session.user.email, null);
  assert.equal(f.requests.length, 2); assert.ok(f.opened());
  const [start, exchange] = f.requests;
  assert.equal(exchange.body.loginAttemptId, attempt); assert.equal(exchange.body.loginCode, code);
  assert.equal(createHash('sha256').update(exchange.body.codeVerifier).digest('base64url'), start.body.codeChallenge);
  assert.equal(start.body.codeVerifier, undefined);
});
test('재로그인은 새 verifier를 생성한다', async () => {
  const f = fixture(); await runNativeKakaoSignIn(f.deps); await runNativeKakaoSignIn(f.deps);
  assert.notEqual(f.requests[1].body.codeVerifier, f.requests[3].body.codeVerifier);
});
test('인증 창 취소·닫기는 토큰 교환하지 않는다', async () => {
  for (const type of ['cancel', 'dismiss']) { const f = fixture({ type }); await assert.rejects(runNativeKakaoSignIn(f.deps), /취소/); assert.equal(f.requests.length, 1); }
});
test('다른 scheme·host·path·중복 파라미터·시도 불일치를 교환 전에 거절한다', async () => {
  const query = `?loginAttemptId=${attempt}&loginCode=${code}`;
  for (const url of ['invalid-url', `https://auth/callback${query}`, `leren://auth.evil/callback${query}`, `leren://auth/other${query}`, `leren://user@auth/callback${query}`, `${KAKAO_APP_RETURN}${query}#bad`, `${KAKAO_APP_RETURN}${query}&loginCode=${code}`, `${KAKAO_APP_RETURN}?loginAttemptId=bad&loginCode=${code}`]) {
    const f = fixture({ type: 'success', url }); await assert.rejects(runNativeKakaoSignIn(f.deps)); assert.equal(f.requests.length, 1);
  }
});
test('서버가 전달한 인증 취소와 교환 실패를 성공으로 처리하지 않는다', async () => {
  const f = fixture({ type: 'success', url: `${KAKAO_APP_RETURN}?loginAttemptId=${attempt}&error=login_cancelled` });
  await assert.rejects(runNativeKakaoSignIn(f.deps), /취소/); assert.equal(f.requests.length, 1);
  const g = fixture(); const original = g.deps.fetch;
  g.deps.fetch = (url, options) => url.endsWith('/exchange') ? Promise.resolve(Response.json({ success: false }, { status: 401 })) : original(url, options);
  await assert.rejects(runNativeKakaoSignIn(g.deps), /만료|유효/);
});
