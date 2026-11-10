/** 실제 가입 API와 별개인 계약 검사입니다. 실패 응답이 가입 완료로 처리되지 않는지 확인합니다. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { signup } from '../src/services/signup.ts';

const values = { email: ' test@example.test ', password: 'local-contract-password', passwordConfirm: 'local-contract-password', nickname: ' 가입검사 ' };
const created = { success: true, data: { user: { userId: 'created-user', nickname: '가입검사', email: 'test@example.test' }, accessToken: 'contract-access', refreshToken: 'contract-refresh' } };
test.beforeEach(() => { process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000'; });

test('정확한 signup 경로로 입력을 전송하고 201의 실제 회원 정보만 돌려준다', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'http://localhost:3000/api/v1/auth/signup');
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    assert.deepEqual(JSON.parse(options.body), { ...values, email: 'test@example.test', nickname: '가입검사' });
    return Response.json(created, { status: 201 });
  });
  assert.deepEqual(await signup(values), created.data.user);
});
test('중복 이메일 409를 성공으로 처리하지 않는다', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ success: false, code: 'CONFLICT' }, { status: 409 }));
  await assert.rejects(signup(values), /이미 가입된 이메일/);
});
test('검증 오류와 서버 실패를 가입 완료로 처리하지 않는다', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ success: false }, { status: 422 }));
  await assert.rejects(signup(values), /입력한/);
  mock.mock.mockImplementation(async () => Response.json({ success: false }, { status: 503 }));
  await assert.rejects(signup(values), /HTTP 503/);
});
test('성공 코드나 필수 응답 계약이 틀리면 실패한다', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json(created, { status: 200 }));
  await assert.rejects(signup(values), /HTTP 200/);
  mock.mock.mockImplementation(async () => Response.json({ success: true, data: { user: created.data.user } }, { status: 201 }));
  await assert.rejects(signup(values), /응답 형식/);
});
test('HTML·깨진 JSON·연결 실패를 구분해 안내한다', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => new Response('<html>proxy</html>', { status: 502 }));
  await assert.rejects(signup(values), /JSON/);
  mock.mock.mockImplementation(async () => new Response('{', { status: 201, headers: { 'content-type': 'application/json' } }));
  await assert.rejects(signup(values), /응답을 읽지/);
  mock.mock.mockImplementation(async () => { throw new TypeError('network'); });
  await assert.rejects(signup(values), /연결하지/);
});
test('외부 HTTP 주소에는 비밀번호를 전송하지 않는다', async t => {
  process.env.EXPO_PUBLIC_API_URL = 'http://api.example.test';
  const mock = t.mock.method(globalThis, 'fetch', () => { throw new Error('전송되면 안 됨'); });
  await assert.rejects(signup(values), /HTTPS/);
  assert.equal(mock.mock.callCount(), 0);
});
