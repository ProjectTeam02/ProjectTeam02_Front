/** Swagger 서버 주소의 로컬 전환과 경로·인증 정보 거절을 외부 연결 없이 검증합니다. */
const assert = require('node:assert/strict');
const test = require('node:test');
const apiPublicUrl = require('../src/config/api-public-url');

test('공개 origin을 지정한 로컬 Swagger만 localhost를 쓰며 기본 EC2 주소를 보존한다', () => {
  assert.equal(apiPublicUrl(), 'http://3.34.171.205');
  assert.equal(apiPublicUrl(''), 'http://3.34.171.205');
  assert.equal(apiPublicUrl('http://localhost:3000'), 'http://localhost:3000');
  assert.equal(apiPublicUrl('https://api.example.test/'), 'https://api.example.test');
  for (const value of ['http://user:secret@localhost:3000', 'http://localhost:3000/api-docs',
    'http://localhost:3000?q=1', 'http://localhost:3000#section', 'file:///tmp/backend', ' invalid ']) {
    assert.throws(() => apiPublicUrl(value), /API_PUBLIC_BASE_URL/);
  }
});
