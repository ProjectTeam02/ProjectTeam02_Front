/** 실제 loopback 리다이렉트로 인증 본문·토큰이 다음 주소에 재전송되지 않는지 검사합니다. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { login, logout } from '../src/services/auth.ts';

// 실계정·외부 네트워크 없이 307·308이 유도하는 두 번째 요청을 관찰합니다.
async function redirectServer(t, status) {
  const requests = [];
  const server = createServer((request, response) => {
    requests.push(request.url);
    request.resume();
    if (request.url === '/redirect-target') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ success: true }));
    } else {
      response.writeHead(status, { Location: '/redirect-target' });
      response.end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const previousOrigin = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = `http://127.0.0.1:${server.address().port}`;
  t.after(() => {
    if (previousOrigin === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previousOrigin;
  });
  return requests;
}

for (const status of [307, 308]) {
  test(`로그인 ${status} 응답은 비밀번호를 다음 주소로 재전송하지 않는다`, async t => {
    const requests = await redirectServer(t, status);
    await assert.rejects(login('contract@example.test', 'contract-only-password'), /서버 연결/);
    assert.deepEqual(requests, ['/api/v1/auth/login']);
  });

  test(`로그아웃 ${status} 응답은 인증 요청을 다음 주소로 재전송하지 않는다`, async t => {
    const requests = await redirectServer(t, status);
    await assert.rejects(logout('contract-only-token'), /서버 연결/);
    assert.deepEqual(requests, ['/api/v1/auth/logout']);
  });
}
