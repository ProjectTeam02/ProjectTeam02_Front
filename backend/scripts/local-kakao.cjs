/**
 * PC 카카오 로그인 전용 환경·DB를 준비하고 루프백 API를 실행합니다.
 * 실제 프로젝트의 .env를 사용하며 EC2 compose와 분리하고 키·비밀번호는 출력하지 않습니다.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
const project = 'leren-kakao-local-20261106';
const container = `${project}-db`;
const purpose = 'kakao-local-20261106';
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', ...options });
  if (result.error || result.status !== 0) throw new Error('로컬 준비 명령이 실패했습니다. 위 상태를 확인하세요.');
  return result;
};
const npmRun = (script, config) => run(process.execPath,
  [path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), 'run', script],
  { env: runtime(config) });

function initialize() {
  if (fs.existsSync(envPath)) return console.log('전용 환경 파일이 이미 있습니다. 기존 값을 보존합니다.');
  const secret = () => crypto.randomBytes(32).toString('hex');
  const values = {
    NODE_ENV: 'development', HOST: '127.0.0.1', PORT: '3000', CORS_ORIGIN: 'http://localhost:3001',
    API_PUBLIC_BASE_URL: 'http://localhost:3000',
    DB_HOST: '127.0.0.1', DB_PORT: '55432', DB_NAME: 'leren_kakao_local', DB_USER: 'app_user',
    DB_PASSWORD: secret(), DB_MIGRATION_USER: 'migrator', DB_MIGRATION_PASSWORD: secret(),
    DB_AI_PASSWORD: secret(), POSTGRES_PASSWORD: secret(), DB_SSL: 'false', DB_SSL_CA: '',
    JWT_ACCESS_SECRET: secret(), JWT_REFRESH_SECRET: secret(),
    ACCESS_TOKEN_TTL_SECONDS: '900', REFRESH_TOKEN_TTL_SECONDS: '2592000',
    FASTAPI_BASE_URL: 'http://127.0.0.1:8000', FASTAPI_INTERNAL_TOKEN: '', FASTAPI_TIMEOUT_MS: '2000',
    KAKAO_REST_API_KEY: '', KAKAO_CLIENT_SECRET: '',
    KAKAO_ALLOWED_REDIRECT_URIS: 'http://localhost:3000/api/v1/auth/kakao/callback',
    KAKAO_OAUTH_CALLBACK_URL: 'http://localhost:3000/api/v1/auth/kakao/callback',
    KAKAO_APP_DEEP_LINK: 'http://localhost:3001/auth/callback',
    KAKAO_ALLOWED_APP_DEEP_LINKS: 'http://localhost:3001/auth/callback',
    KAKAO_OAUTH_STORE_MODE: 'memory', KAKAO_OAUTH_STATE_TTL_SECONDS: '300',
    KAKAO_OAUTH_EXCHANGE_TTL_SECONDS: '60', KAKAO_LEGACY_DIRECT_LOGIN_ENABLED: 'false',
  };
  fs.writeFileSync(envPath,
    '# PC 로컬 카카오 전용 비공개 파일입니다. 두 카카오 키만 직접 채우세요.\n'
    + Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n',
    { flag: 'wx', mode: 0o600 });
  console.log('전용 환경 파일 생성 완료. .env의 KAKAO_REST_API_KEY와 KAKAO_CLIENT_SECRET을 채우세요.');
}

function readConfig() {
  if (!fs.existsSync(envPath)) throw new Error('먼저 npm run local:kakao:init을 실행하세요.');
  const config = dotenv.parse(fs.readFileSync(envPath));
  const fixed = { NODE_ENV: 'development', HOST: '127.0.0.1', PORT: '3000', DB_HOST: '127.0.0.1',
    DB_PORT: '55432', DB_NAME: 'leren_kakao_local', DB_USER: 'app_user', DB_MIGRATION_USER: 'migrator',
    DB_SSL: 'false', CORS_ORIGIN: 'http://localhost:3001', API_PUBLIC_BASE_URL: 'http://localhost:3000',
    KAKAO_ALLOWED_REDIRECT_URIS: 'http://localhost:3000/api/v1/auth/kakao/callback',
    KAKAO_OAUTH_CALLBACK_URL: 'http://localhost:3000/api/v1/auth/kakao/callback',
    KAKAO_APP_DEEP_LINK: 'http://localhost:3001/auth/callback',
    KAKAO_ALLOWED_APP_DEEP_LINKS: 'http://localhost:3001/auth/callback',
    KAKAO_OAUTH_STORE_MODE: 'memory', KAKAO_LEGACY_DIRECT_LOGIN_ENABLED: 'false' };
  for (const [name, value] of Object.entries(fixed)) {
    if (config[name] !== value) throw new Error(`로컬 전용 설정 ${name}이(가) 달라 실행을 중단합니다.`);
  }
  for (const name of ['DB_PASSWORD', 'DB_MIGRATION_PASSWORD', 'DB_AI_PASSWORD', 'POSTGRES_PASSWORD', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
    if (!config[name] || config[name].length < 32) throw new Error(`${name} 로컬 비밀 값이 준비되지 않았습니다.`);
  }
  return config;
}

function runtime(config) {
  // 프로세스의 기존 DB_* 값보다 전용 파일을 우선하고 경로를 하위 빌드·마이그레이션에도 전달합니다.
  return { ...process.env, ...config, LEREN_ENV_FILE: envPath };
}

const composeArgs = ['compose', '--project-name', project, '--env-file', envPath, '-f', 'docker-compose.local-kakao.yml'];
function assertOwnedContainer() {
  const result = spawnSync('docker', ['inspect', '--format', '{{index .Config.Labels "leren.purpose"}}|{{index .Config.Labels "com.docker.compose.project"}}', container],
    { cwd: root, encoding: 'utf8' });
  if (result.status === 0 && result.stdout.trim() !== `${purpose}|${project}`) {
    throw new Error('같은 이름의 다른 컨테이너가 있어 변경하지 않습니다.');
  }
  if (result.status !== 0 && !/No such (object|container)/i.test(result.stderr || '')) {
    throw new Error('Docker에 접근하지 못했습니다. Docker Desktop 실행과 권한을 확인하세요.');
  }
  const volume = spawnSync('docker', ['volume', 'inspect', '--format', '{{index .Labels "leren.purpose"}}', `${project}-data`],
    { cwd: root, encoding: 'utf8' });
  if (volume.status === 0 && volume.stdout.trim() !== purpose) throw new Error('같은 이름의 다른 DB 볼륨이 있어 변경하지 않습니다.');
}

async function main() {
  const action = process.argv[2] || 'status';
  if (action === 'init') return initialize();
  const config = readConfig();
  if (action === 'status') {
    console.log(JSON.stringify({ environment: 'PC loopback only',
      api: 'http://localhost:3000', frontend: 'http://localhost:3001',
      redirectUri: config.KAKAO_OAUTH_CALLBACK_URL,
      kakaoRestApiKeyConfigured: Boolean(config.KAKAO_REST_API_KEY?.trim()),
      kakaoClientSecretConfigured: Boolean(config.KAKAO_CLIENT_SECRET?.trim()) }, null, 2));
    return;
  }
  if (action === 'db') {
    assertOwnedContainer();
    run('docker', [...composeArgs, 'up', '-d', '--wait', 'db'], { env: runtime(config) });
    // init SQL은 역할·스키마만, 기존 TypeORM 마이그레이션은 app 테이블을 준비합니다.
    npmRun('db:migrate', config);
    console.log('전용 로컬 DB와 마이그레이션 준비 완료. 기존 DB/EC2는 변경하지 않았습니다.');
    return;
  }
  if (action === 'start') {
    npmRun('db:build', config);
    if (!config.KAKAO_REST_API_KEY?.trim() || !config.KAKAO_CLIENT_SECRET?.trim()) {
      console.log('카카오 키가 비어 있습니다. API는 실행하지만 실제 카카오 로그인은 키 설정 후 재시작해야 합니다.');
    }
    run(process.execPath, ['src/server.js'], { env: runtime(config) });
    return;
  }
  if (action === 'stop-db') {
    assertOwnedContainer();
    run('docker', [...composeArgs, 'stop', 'db'], { env: runtime(config) });
    return;
  }
  throw new Error('사용법: local-kakao.cjs init | status | db | start | stop-db');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
