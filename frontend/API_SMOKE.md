# Leren 읽기 전용 API 연동 테스트

별도 로컬 브랜치 `codex/leren-api-smoke-20261106`에서만 작업했습니다. 원본 프론트 `develop`과 EC2 설정은 변경하지 않았습니다. 기반 프론트 커밋은 `b4a0d15dc0b5e236996e0b19af34057a4c763dca`입니다.

## 실행

이 폴더에서 `.env.example`을 `.env.local`로 복사하고 `EXPO_PUBLIC_API_URL`을 **팀에서 확인한 HTTPS 도메인의 origin**으로 바꿉니다. 끝에 `/api/v1`을 붙이지 않습니다. 공개 환경변수에 JWT·비밀번호를 넣지 않습니다. 현재 EC2 IP의 HTTP 주소는 HTTPS IP로 리다이렉트되고 있으므로 도메인 확인 전에는 성공 주소로 사용할 수 없습니다.

```powershell
npm ci
npm run web
```

개발 화면 첫 페이지의 **API 연동 테스트 열기** 또는 `http://localhost:3001/api-test`로 진입합니다. **서버 연결 확인**은 `GET /health`를 검증합니다. 기존 계정으로 로그인한 뒤 홈의 **API 연동 테스트**로 돌아와 **실제 학습 이력 가져오기**를 누르면 메모리의 현재 JWT로 `GET /api/v1/learning/history?page=1&pageSize=10`을 호출합니다. 이력 화면은 서버 응답을 사용하며 조회 실패 시 오류를 표시합니다. 계정 생성·학습 시작·제출 API는 테스트에 포함하지 않았습니다.

CLI는 Node 24 이상에서 앱과 동일한 서비스로 테스트합니다. `.env.local`을 자동 로딩하지 않으므로 URL을 인자로 지정합니다.

```powershell
node scripts/api-smoke.mjs https://확인된-백엔드-도메인
node --test scripts/api-smoke.test.mjs
npm run typecheck
npm run lint
```

CLI 이력 조회는 현재 유효한 기존 테스트 계정 토큰을 프로세스 환경변수 `LEREN_TEST_ACCESS_TOKEN`에 전달한 경우만 실행합니다. 토큰은 파일·명령 이력·보고서에 기록하지 않습니다. 미제공 시 이력은 `SKIP`입니다. CLI는 health 상태와 이력 건수만 출력하며 응답 원문을 저장하지 않습니다.

## 확인한 계약과 제한

- `GET /health` → `{ service: 'leren-backend', status: 'UP', timestamp }`. 프로세스 생존 응답만 확인합니다. DB 준비, 배포 브랜치·SHA는 증명하지 않습니다.
- 인증된 `GET /api/v1/learning/history` → `{ success: true, data: { items, page, pageSize, total, totalPages } }`. 현재 백엔드는 JWT뿐 아니라 활성 UserSession도 검사합니다. 만료된 토큰의 401을 빈 목록으로 처리하지 않습니다.
- 백엔드 `main` `5c6cd21`에는 topics/stages/concepts/questions 조회 라우터가 연결되어 있지 않습니다. 탐험·퀴즈에 필요한 카탈로그를 추측하여 만들지 않고 `LearningContentProvider`를 미연결로 유지합니다. 기존 프론트는 이미 더미 카탈로그를 제거한 상태였습니다.
- `/api-test`는 개발용 주소이며 production에서는 첫 페이지로 이동합니다. 일반 로그인 흐름은 기존 실제 인증을 사용합니다.
- HTTPS 전환 중에는 HTTP 308, TLS 인증서, 도메인 불일치, 프록시 응답을 구분해야 합니다. 인증서 검사를 끄는 코드는 없습니다.
- 공개 health는 HTTP 진단도 허용하지만, 로그인·로그아웃·인증 이력 조회는 HTTPS만 허용합니다. 이 PC의 `localhost`, `127.0.0.1`, `[::1]` HTTP만 로컬 개발 예외로 둡니다. 원격 HTTP 주소에서는 로그인 진입 버튼도 숨깁니다. 리다이렉트 전 요청에 비밀번호·Bearer가 평문으로 실리는 일을 막기 위한 제한입니다.
- 웹은 브라우저 CORS를 적용합니다. 현재 확인한 백엔드 `app.js`에는 CORS middleware가 적용되지 않아, TLS가 복구되어도 다른 origin의 Expo web 요청이 막힐 수 있습니다. Authorization은 사전 요청도 필요합니다. Native의 네트워크 정책은 별도이므로 실기기 검증을 대신하지 않습니다.
- 로컬 계약 테스트의 모의 응답은 파서·실패 처리 검증이며 EC2 연동 성공의 증거가 아닙니다. 실제 성공 여부는 별도 실행 결과로 기록해야 합니다.

Expo SDK 58 문서와 환경변수 지침을 확인했습니다: [SDK 58](https://docs.expo.dev/versions/v58.0.0/), [환경변수](https://docs.expo.dev/guides/environment-variables/), [라우팅](https://docs.expo.dev/router/introduction/), [네트워크 정책](https://reactnative.dev/docs/network).

## 이번 실행 결과 (2026-11-06, 한국 시간)

- TypeScript 검사와 Expo lint 통과. 로컬 계약 검사 9개 통과(모의 응답 사용). `npx expo export --platform web`도 통과했고 `api-test` 경로가 웹 번들에 포함됐습니다. 브라우저 UI/실기기 검증과는 별도입니다.
- 실제 EC2 `http://3.34.171.205`에 앱과 동일한 서비스로 CLI를 실행했으나 health 연결 실패(exit 1). 별도 네트워크 진단은 HTTP 308 → HTTPS IP 리다이렉트 후 TLS 연결 실패를 확인했습니다. 유효한 HTTPS 도메인은 미확인입니다.
- 기존 테스트 계정/유효 JWT가 제공되지 않아 인증된 실제 이력 200 응답과 실기기 연동은 미검증입니다. 성공으로 표시하지 않았습니다.
- 실제 학습 카탈로그 API가 라우터에 없으므로 탐험·퀴즈의 전체 API 전환은 완료하지 않았습니다. 이번 변경은 공개 연결 확인과 구현된 학습 이력 GET의 최소 연동입니다.
