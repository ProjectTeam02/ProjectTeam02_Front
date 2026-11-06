/** Swagger가 요청할 서버 origin을 검증합니다. 설정하지 않으면 기존 EC2 기본값을 유지합니다. */
module.exports = function apiPublicUrl(value) {
  if (value === undefined || value === '') return 'http://3.34.171.205';
  let url;
  try { url = new URL(value); } catch (_error) {
    throw new Error('API_PUBLIC_BASE_URL은 HTTP(S) 서버 origin이어야 합니다.');
  }
  if (typeof value !== 'string' || value !== value.trim()
    || !['http:', 'https:'].includes(url.protocol) || url.username || url.password
    || url.search || url.hash || url.pathname !== '/') {
    throw new Error('API_PUBLIC_BASE_URL에는 인증 정보·경로·쿼리 없이 HTTP(S) 서버 origin만 지정하세요.');
  }
  return url.origin;
};
