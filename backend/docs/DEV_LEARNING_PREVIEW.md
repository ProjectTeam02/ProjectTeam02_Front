# 기존 인증 서버의 개발용 임시 학습 API

**공유 범위(2026-11-01):** 사용자는 프론트 develop에 일반 개발 코드, 프론트 test에 더미 포함 테스트 구성을 두기로 했습니다. 아래 임시 학습 모듈은 테스트 전용 자료이며 현재는 이 백엔드 저장소에 있습니다. 프론트 test-support 폴더로의 패키징/브랜치 분리는 아직 하지 않았습니다. 기존 인증 백엔드와 DB를 사용하는 실행 구조는 유지합니다.

기준일: 2026-11-01. 기존 인증 API를 유지하면서 같은 서버에 화면 테스트용 학습 조회를 추가했습니다. 별도 서버 실행 명령/파일은 제거했습니다.

## 실행

Docker Desktop을 켠 뒤 기존 DB와 백엔드를 실행합니다. 처음 받은 PC는 팀 DB 안내에 따라 의존성 설치·개인 .env·필요한 마이그레이션을 준비합니다. 기존 DB 데이터는 유지합니다.

```powershell
cd C:\Leren\ProjectTeam02_Back
docker compose up -d db
npm.cmd run dev
```

- 백엔드 3000, 프론트 Expo/웹 3001을 사용합니다.
- 실제 로그인: POST /api/v1/auth/login
- 테스트 계정 생성: Swagger의 POST /api/v1/auth/signup. 프론트 회원가입 화면은 미연결입니다.
- 학습 카탈로그: GET /api/v1/dev-learning/catalog
- 상태: GET /health / 문서: GET /api-docs
- NODE_ENV가 development(미지정 기본값 포함)일 때 임시 학습 API를 제공합니다. ENABLE_DEV_LEARNING_DATA=false면 끄며 production/test에서는 설정과 무관하게 꺼집니다.
- CORS_ORIGIN에는 프론트 웹 주소(http://localhost:3001 등)를 허용합니다. 쉼표로 여러 주소를 지정할 수 있습니다. 인증은 Bearer 토큰이며 쿠키는 사용하지 않습니다.

프론트의 EXPO_PUBLIC_API_URL과 EXPO_PUBLIC_LEARNING_API_URL을 같은 백엔드 기본 주소로 지정합니다. 휴대폰은 같은 네트워크 PC 주소를 사용합니다. 실제 주소·JWT 비밀 값·비밀번호를 문서나 공유 파일에 넣지 않습니다.

## 파일 역할

| 파일 | 역할 |
| --- | --- |
| src/server.js | DB 연결 후 기존 API 서버 시작 |
| src/app.js | 기존 인증·공식 API 유지 및 개발용 학습 경로 등록 |
| src/modules/dev-learning/learning.mount.js | 개발 환경과 활성화 설정 확인 |
| src/modules/dev-learning/learning.routes.js | JSON 조회·캐시 금지·안전한 오류 응답 |
| src/modules/dev-learning/learning.fixture.js | 요청마다 JSON 재읽기·형식/참조 검증 |
| src/modules/dev-learning/data/stage-1.json | 지도 첫 지역·개념·문제·출제 순서·예시 보상 |
| src/common/middleware/cors.middleware.js | 기존 서버에 웹 연결 허용 설정 적용 |

## 콘텐츠와 계약

현재 지도 1번 경제 기초와 1-1(선택과 기회비용), 1-2(돈의 역할), 보스의 서로 다른 5문제만 제공합니다. 보스 출제 순서는 가치의 저장 → 희소성 → 기회비용 → 교환의 매개 → 가치의 척도입니다. 피그마 4번 페이지를 기준으로 채운 테스트용 예시이며 최종 교육 콘텐츠가 아닙니다.

응답은 `{success:true,data:{schemaVersion:1,source:'figma-test-fixture',regions,questions,battleRules,rewards}}`입니다. 정답(answer)도 제공해 프론트에서 임시 채점합니다. 운영용 공개 문제·서버 채점 DTO로 사용하지 않습니다. 잘못된 JSON/깨진 참조는 고정 오류로 응답하며 파일 경로나 원문을 노출하지 않습니다.

DB에서는 지도 지역이 Topic, 하위 1-1/1-2/1-BOSS가 Stage입니다. 임시 regions/lessons를 최종 DB DTO와 동일시하지 않습니다. 학습·채점·보상·복습 기록은 프론트 메모리이며 DB 저장을 하지 않습니다. 인증 성공 여부와 학습 기록 저장 완료는 별개입니다. 기존 공식 quizzes API에는 더미를 섞지 않습니다.

## 검증

```powershell
npm.cmd run db:build
node --test test/app.test.js test/dev-learning-preview.test.js
```

위 검사는 DB 연결 없이 기존 앱의 학습·Swagger·인증 검증/권한 경로, 웹 CORS, 실패 응답, 운영/설정 해제 시 학습 경로 비활성화를 확인합니다. 실제 인증은 로컬 DB와 기존 로그인/로그아웃 API로 별도 확인합니다. 학습 API를 정식 구현으로 교체할 때는 임시 경로를 제거하고 프론트 services/learning.ts에서 실제 공개 DTO를 화면 모델로 변환합니다.
