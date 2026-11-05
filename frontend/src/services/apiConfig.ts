/** 모든 인증·조회 요청에 쓰는 API origin을 검증합니다. 비밀 값은 공개 환경변수에 넣지 않습니다. */
export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
  if (!configured) throw new Error('EXPO_PUBLIC_API_URL에 백엔드 주소를 지정해 주세요.');
  let url: URL;
  try { url = new URL(configured); } catch { throw new Error('백엔드 주소는 http:// 또는 https://로 시작해야 해요.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('백엔드 주소에는 경로·인증 정보 없이 서버 주소만 넣어 주세요.');
  }
  return configured;
}

/** 인증 정보는 HTTPS 또는 이 PC의 loopback HTTP에만 보냅니다. */
export function getAuthenticatedApiBaseUrl(): string {
  const baseUrl = getApiBaseUrl();
  const url = new URL(baseUrl);
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('로그인에는 HTTPS 또는 이 PC의 localhost 주소가 필요해요. 원격 HTTP로 인증 정보를 보내지 않습니다.');
  }
  return baseUrl;
}
