/** Expo 웹(3001)에서 API(3000)를 호출하도록 기존 CORS_ORIGIN 설정을 적용합니다. 인증은 Bearer 방식입니다. */
const config = require('../../config/cors.config');

module.exports = function corsMiddleware(req, res, next) {
  const requestOrigin = req.get('origin');
  const origins = config.origin.split(',').map((value) => value.trim());
  if (origins.includes('*')) res.set('Access-Control-Allow-Origin', '*');
  else {
    res.vary('Origin');
    if (requestOrigin && origins.includes(requestOrigin)) res.set('Access-Control-Allow-Origin', requestOrigin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
  // 쿠키를 보내지 않는 프론트 요청이므로 wildcard와 credentials를 함께 허용하지 않습니다.
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
};
