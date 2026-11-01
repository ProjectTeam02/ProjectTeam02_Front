/**
 * 내려받은 테스트 구성의 개인 .env 두 개를 처음 한 번 만듭니다.
 * 기존 파일은 덮어쓰지 않고 JWT 서명 값은 PC마다 난수 생성합니다. 값 자체는 출력하지 않습니다.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const backend = path.resolve(__dirname, '..');
const frontend = path.resolve(backend, '../frontend');

function createIfMissing(target, buildContents) {
  if (fs.existsSync(target)) {
    console.log(`${path.relative(path.dirname(backend), target)}: 기존 파일 유지`);
    return;
  }
  // 먼저 존재 여부를 확인해도 다른 실행과 겹칠 수 있어 wx로 덮어쓰기를 막습니다.
  fs.writeFileSync(target, buildContents(), { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  console.log(`${path.relative(path.dirname(backend), target)}: 생성 완료(내용은 출력하지 않음)`);
}

createIfMissing(path.join(backend, '.env'), () => fs.readFileSync(path.join(backend, '.env.example'), 'utf8')
  .replace('replace-with-local-access-secret', crypto.randomBytes(32).toString('hex'))
  .replace('replace-with-local-refresh-secret', crypto.randomBytes(32).toString('hex')));
if (!fs.existsSync(frontend)) throw new Error('backend와 frontend를 같은 저장소에서 내려받아 실행해 주세요.');
createIfMissing(path.join(frontend, '.env'), () => [
  '# 같은 PC의 웹 테스트 기본값입니다. 휴대폰에서는 두 주소를 PC IPv4:3000으로 바꿉니다.',
  'EXPO_PUBLIC_API_URL=http://localhost:3000',
  'EXPO_PUBLIC_LEARNING_API_URL=http://localhost:3000',
  '',
].join('\n'));
