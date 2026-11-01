require('dotenv').config();

const app = require('./app');
const { connectDatabase } = require('./config/database');

const port = process.env.PORT || 3000;

connectDatabase()
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
    // 중복 실행은 DB 연결 성공 뒤 비동기로 발생하므로 별도 안내합니다.
    server.on('error', (error) => {
      console.error(error.code === 'EADDRINUSE'
        ? `${port}번 백엔드 포트를 이미 사용 중입니다. 기존 백엔드를 종료한 뒤 다시 실행해 주세요.`
        : `백엔드 시작 실패: ${error.message}`);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
