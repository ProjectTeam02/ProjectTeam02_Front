/** 기존 앱에 연결한 임시 학습 API와 기존 인증 경로의 공존을 검증합니다. DB 연결은 시작하지 않습니다. */
const assert = require('node:assert/strict');
const test = require('node:test');
const { mkdtemp, readFile, writeFile, unlink, rmdir } = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const express = require('express');
// 개인 .env 주소에 의존하지 않고 허용/비허용 Origin 동작을 검증합니다.
process.env.CORS_ORIGIN = 'http://localhost:3001';
process.env.NODE_ENV = 'development';
process.env.ENABLE_DEV_LEARNING_DATA = 'true';
const app = require('../src/app');
const { mountDevelopmentLearning } = require('../src/modules/dev-learning/learning.mount');
const { CATALOG_PATH, loadCatalog, validateCatalog } = require('../src/modules/dev-learning/learning.fixture');

async function withServer(callback, options) {
  let target = app;
  if (options) {
    target = express();
    mountDevelopmentLearning(target, { environment: 'development', ...options });
  }
  const server = target.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try { await callback(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

test('catalog has only region 1, two lessons and five distinct basic-economy boss questions', async () => {
  const catalog = await loadCatalog();
  assert.equal(catalog.schemaVersion, 1);
  assert.equal(catalog.source, 'figma-test-fixture');
  assert.deepEqual(catalog.regions.map((region) => region.id), [1]);
  assert.deepEqual(catalog.regions[0].lessons.map((lesson) => lesson.id), ['1-1', '1-2']);
  assert.equal(new Set(catalog.questions.map((question) => question.id)).size, 5);
  assert.equal(new Set(catalog.regions[0].boss.questionIds).size, 5);
  assert.deepEqual(catalog.battleRules, { normal: { hp: 2, maxQuestions: 3 }, boss: { hp: 4, maxQuestions: 5 } });
  assert(!catalog.questions.some((question) => ['bank', 'interest'].includes(question.id)));
  assert.deepEqual(catalog.rewards, { coins: 50, xp: 30, economyXp: 20 });
});

test('loader re-reads edited JSON rather than retaining module-cache contents', async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'leren-dev-learning-'));
  const tempFile = path.join(tempDirectory, 'stage-1.json');
  try {
    await writeFile(tempFile, await readFile(CATALOG_PATH));
    assert.equal((await loadCatalog(tempFile)).regions[0].title, '경제 기초');
    const edited = await loadCatalog(tempFile);
    edited.regions[0].title = '경제 기초 · 수정 확인';
    await writeFile(tempFile, JSON.stringify(edited));
    assert.equal((await loadCatalog(tempFile)).regions[0].title, '경제 기초 · 수정 확인');
  } finally {
    await unlink(tempFile).catch((error) => { if (error.code !== 'ENOENT') throw error; });
    await rmdir(tempDirectory);
  }
});

test('invalid question references, answer indexes and duplicate boss questions fail validation', async () => {
  const catalog = await loadCatalog();
  const badReference = structuredClone(catalog);
  badReference.regions[0].lessons[0].questionIds[0] = 'not-found';
  assert.throws(() => validateCatalog(badReference));
  const badAnswer = structuredClone(catalog);
  badAnswer.questions[0].answer = 99;
  assert.throws(() => validateCatalog(badAnswer));
  const duplicate = structuredClone(catalog);
  duplicate.regions[0].boss.questionIds[1] = duplicate.regions[0].boss.questionIds[0];
  assert.throws(() => validateCatalog(duplicate));
});

test('backend rejects fractional rewards and region cards without lessons, matching the frontend contract', async () => {
  const catalog = await loadCatalog();
  const fractionalReward = structuredClone(catalog);
  fractionalReward.rewards.coins = 1.5;
  assert.throws(() => validateCatalog(fractionalReward));
  const emptyRegion = structuredClone(catalog);
  emptyRegion.regions[0].lessons = [];
  assert.throws(() => validateCatalog(emptyRegion));
  const unpublished = structuredClone(catalog);
  unpublished.regions = []; unpublished.questions = [];
  assert.deepEqual(validateCatalog(unpublished).regions, []);
});

test('HTTP catalog returns the success envelope without DB or authorization', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/dev-learning/catalog`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.data.regions[0].title, '경제 기초');
    assert.equal(body.data.questions.length, 5);
  });
});

test('same server CORS permits catalog GET and real auth POST preflight without cookies', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/dev-learning/catalog`, { headers: { Origin: 'http://localhost:3001' } });
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3001');
    assert.equal(response.headers.get('access-control-allow-credentials'), null);
    const preflight = await fetch(`${baseUrl}/api/v1/dev-learning/catalog`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:3001', 'Access-Control-Request-Method': 'GET' } });
    assert.equal(preflight.status, 204);
    assert.match(preflight.headers.get('access-control-allow-methods'), /GET/);
    const loginPreflight = await fetch(`${baseUrl}/api/v1/auth/login`, {method:'OPTIONS', headers:{ Origin:'http://localhost:3001', 'Access-Control-Request-Method':'POST', 'Access-Control-Request-Headers':'content-type,authorization' }});
    assert.equal(loginPreflight.status, 204);
    assert.match(loginPreflight.headers.get('access-control-allow-methods'), /POST/);
    assert.match(loginPreflight.headers.get('access-control-allow-headers'), /Authorization/);
    const blocked = await fetch(`${baseUrl}/api/v1/dev-learning/catalog`, { headers: { Origin: 'https://unlisted.example' } });
    assert.equal(blocked.headers.get('access-control-allow-origin'), null);
  });
});

test('unprepared next stages are not replaced by the first region', async () => {
  await withServer(async (baseUrl) => {
    for (const url of ['/api/v1/dev-learning/regions/2', '/api/v1/dev-learning/not-found']) {
      const response = await fetch(`${baseUrl}${url}`);
      assert.equal(response.status, 404);
      assert.equal((await response.json()).code, 'NOT_FOUND');
    }
  });
});

test('failed fixture reads use a safe JSON error without exposing file contents', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/dev-learning/catalog`);
    const body = await response.json();
    assert.equal(response.status, 500);
    assert.equal(body.code, 'DEV_CATALOG_UNAVAILABLE');
    assert(!JSON.stringify(body).includes('private-path'));
  }, { catalogLoader: async () => { throw new Error('private-path'); } });
});


// 별도 서버 실행 파일 없이 실제 app.js 설정에서 운영/명시적 해제가 적용되는지 새 프로세스로 확인합니다.
for (const [environment, enabled] of [['production', 'true'], ['test', 'true'], ['development', 'false']]) {
  test(`actual app hides fixture data in ${environment} with ENABLE_DEV_LEARNING_DATA=${enabled}`, () => {
    const child = spawnSync(process.execPath, ['-e', `
      const app = require('./src/app');
      const server = app.listen(0, '127.0.0.1', async () => {
        try {
          const base = 'http://127.0.0.1:' + server.address().port;
          const catalog = await fetch(base + '/api/v1/dev-learning/catalog');
          const auth = await fetch(base + '/api/v1/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body:'{}'});
          if (catalog.status !== 404 || auth.status !== 422) process.exitCode = 1;
        } catch { process.exitCode = 1; }
        finally { server.closeAllConnections(); server.close(); }
      });
    `], { cwd: path.join(__dirname, '..'), env: { ...process.env, NODE_ENV: environment, ENABLE_DEV_LEARNING_DATA: enabled }, timeout: 5000, encoding: 'utf8', windowsHide: true });
    assert.equal(child.status, 0, child.stderr);
  });
}

test('same app exposes Swagger and existing auth validation while learning catalog works', async () => {
  await withServer(async (baseUrl) => {
    assert.equal((await fetch(`${baseUrl}/api-docs`)).status, 200);
    const health = await fetch(`${baseUrl}/health`).then((response) => response.json());
    assert.equal(health.service, 'leren-backend');
    const login = await fetch(`${baseUrl}/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(login.status, 422);
    const profile = await fetch(`${baseUrl}/api/v1/users/me`);
    assert.equal(profile.status, 401);
    assert.equal((await fetch(`${baseUrl}/api/v1/dev-learning/catalog`)).status, 200);
  });
});
