const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerConfig = require('./config/swagger.config');
const routes = require('./routes');
const AppError = require('./common/errors/AppError');
const errorMiddleware = require('./common/middleware/error.middleware');
const corsMiddleware = require('./common/middleware/cors.middleware');
const { mountDevelopmentLearning } = require('./modules/dev-learning/learning.mount');

const app = express();

const swaggerSpec = swaggerJsdoc(swaggerConfig);

app.use(corsMiddleware);
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Keep the earlier development URL working while exposing the agreed URL.
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

app.get('/health', (_req, res) => {
  res.json({ service: 'leren-backend', status: 'UP', timestamp: new Date().toISOString() });
});

// 개발에서만 임시 학습 JSON을 같은 3000번 서버로 제공합니다. 기존 인증·퀴즈 라우터는 유지합니다.
mountDevelopmentLearning(app);
app.use('/api/v1', routes);
app.use((_req, _res, next) => next(AppError.notFound('요청한 API를 찾을 수 없습니다.')));
app.use(errorMiddleware);

module.exports = app;
