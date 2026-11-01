/** 개발용 카탈로그 조회 라우터입니다. 공식 stages/concepts/quizzes 라우트와 별도로 유지합니다. */
const express = require('express');
const { loadCatalog } = require('./learning.fixture');

function createLearningPreviewRouter({ catalogLoader = loadCatalog } = {}) {
  const router = express.Router();
  // 테스트 데이터의 수정 사항을 다음 조회에서 바로 확인할 수 있도록 HTTP 캐시도 막습니다.
  router.get('/catalog', async (_req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store');
      res.json({ success: true, data: await catalogLoader() });
    } catch (error) { next(error); }
  });
  // 파일 경로·JSON 원문 대신 화면에서 재시도할 수 있는 고정 오류만 반환합니다.
  router.use((_error, _req, res, _next) => res.status(500).json({
    success: false,
    message: '테스트 학습 데이터를 읽지 못했습니다. 백엔드의 stage-1.json을 확인해 주세요.',
    code: 'DEV_CATALOG_UNAVAILABLE',
  }));
  return router;
}

module.exports = { createLearningPreviewRouter };
