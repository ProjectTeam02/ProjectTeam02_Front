/** 기존 API 서버에 개발용 학습 카탈로그만 추가합니다. 인증·DB API는 교체하지 않습니다. */
const { createLearningPreviewRouter } = require('./learning.routes');

function mountDevelopmentLearning(app, {
  environment = process.env.NODE_ENV || 'development',
  enabled = process.env.ENABLE_DEV_LEARNING_DATA !== 'false',
  catalogLoader,
} = {}) {
  // 개발 실행에서는 기본 제공하고, 운영에서는 설정값과 관계없이 더미 정답·보상을 공개하지 않습니다.
  if (environment !== 'development' || !enabled) return false;
  app.use('/api/v1/dev-learning', createLearningPreviewRouter({ catalogLoader }));
  return true;
}

module.exports = { mountDevelopmentLearning };
