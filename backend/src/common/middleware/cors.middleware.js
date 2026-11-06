/**
 * 설정에 정확히 등록된 웹 origin의 API 호출과 사전 요청만 허용합니다.
 * 쿠키 인증을 사용하지 않으므로 credentials와 와일드카드 허용을 추가하지 않습니다.
 */
const env = require('../../config/env');

module.exports = function corsMiddleware(req, res, next) {
  const origin = req.get('Origin');
  const allowed = env.corsOrigin.split(',').map(value => value.trim()).filter(value => value && value !== '*');
  res.vary('Origin');
  if (!origin || !allowed.includes(origin)) return next();
  res.set('Access-Control-Allow-Origin', origin);
  if (req.method === 'OPTIONS') {
    const method = req.get('Access-Control-Request-Method');
    const headers = (req.get('Access-Control-Request-Headers') || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
    if (!['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(method)
      || headers.some(value => !['content-type', 'authorization', 'idempotency-key'].includes(value))) {
      return res.status(403).end();
    }
    res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
    res.set('Access-Control-Max-Age', '300');
    return res.status(204).end();
  }
  return next();
};
