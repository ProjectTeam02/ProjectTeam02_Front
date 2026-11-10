/**
 * 앱과 동일한 읽기 서비스를 사용해 실제 서버의 health 및 선택적인 내 학습 이력을 확인합니다.
 * 새 계정·학습 기록을 만들지 않으며 토큰과 학습 응답 원문을 출력하지 않습니다.
 * Node 24 이상에서 실행: node scripts/api-smoke.mjs https://확인된-도메인
 */
const address = process.argv[2] || process.env.EXPO_PUBLIC_API_URL;
if (!address) {
  console.error('사용법: node scripts/api-smoke.mjs https://확인된-도메인');
  process.exitCode = 1;
} else {
  process.env.EXPO_PUBLIC_API_URL = address;
  const { getApiBaseUrl, getBackendHealth, getLearningHistory } = await import('../src/services/apiSmoke.ts');
  try {
    // 주소는 공개 설정이지만 인증 정보가 섞이면 getApiBaseUrl이 먼저 거부합니다.
    console.log(`대상: ${getApiBaseUrl()}`);
    const health = await getBackendHealth();
    console.log(`health: PASS (${health.service}, ${health.status}) — DB 준비/SHA 검증은 별도`);
    if (process.env.LEREN_TEST_ACCESS_TOKEN) {
      const history = await getLearningHistory(process.env.LEREN_TEST_ACCESS_TOKEN);
      console.log(`history: PASS (수신 ${history.items.length}건, 전체 ${history.total}건)`);
    } else {
      console.log('history: SKIP (기존 계정의 테스트 토큰이 제공되지 않음)');
    }
  } catch (cause) {
    console.error(`FAIL: ${cause instanceof Error ? cause.message : '연결 실패'}`);
    process.exitCode = 1;
  }
}
