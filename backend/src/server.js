/**
 * 백엔드 서버 실행
 * 백엔드 작업: 환경변수 로딩·DB 연결·HTTP 서버 실행을 관리
 * 주의: 기존 포트와 DB 연결 실패 처리를 유지한다.
 */
/**
 * 백엔드 서버 실행 파일
 * 백엔드 작업: 환경변수 로딩, DB 연결, HTTP 서버 실행 상태 관리
 * 주의: 기존 포트와 DB 연결 실패 처리 정책 유지
 */
// 전용 로컬 실행기의 환경 파일을 우선하며 일반 실행의 기존 기본값은 유지합니다.
require('dotenv').config(process.env.LEREN_ENV_FILE ? { path: process.env.LEREN_ENV_FILE } : {});

const app = require('./app');
const { connectDatabase } = require('./config/database');

const port = process.env.PORT || 3000;

connectDatabase()
  .then(() => {
    const server = app.listen(port, process.env.HOST || undefined, () => {
      console.log(`Server listening on port ${port}`);
    });
    // 기존 실행과 포트가 겹치면 원인을 명확히 안내합니다.
    server.on('error', error => {
      console.error(error.code === 'EADDRINUSE' ? `${port}번 백엔드 포트가 이미 사용 중입니다.` : '백엔드를 시작하지 못했습니다.');
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
