# PC 로컬 카카오 실제 로그인 준비

이 브랜치는 EC2와 별개로 API `http://localhost:3000`, Expo 웹 `http://localhost:3001`, Docker DB `127.0.0.1:55432`를 사용합니다. 현재 실제 실행 설정은 이 프로젝트의 루트 `.env` 한 곳에서 관리합니다. 이전 개인 설정은 C:/Leren/.migration-backup 에 보존했고, 원격 배포·공개 서버 DB는 변경하지 않습니다.

전용 환경의 `API_PUBLIC_BASE_URL=http://localhost:3000`은 로컬 Swagger `/api-docs/`의 Try it out도 로컬 API로 보냅니다. 이 설정이 없는 일반 실행의 기존 EC2 기본 주소는 유지합니다.

```powershell
npm run local:kakao:init
npm run local:kakao:status
npm run local:kakao:db
npm run local:kakao:start
```

`init`은 Git에 포함하지 않는 `.env`를 만들고 DB/JWT 난수를 생성합니다. 파일의 `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET` 두 값을 팀 카카오 앱의 실제 값으로 직접 채우세요. 키를 입력하거나 변경한 뒤 API를 재시작합니다. `status`는 키 값 대신 설정 여부만 출력합니다.

카카오디벨로퍼스에서 해당 REST API 키의 Redirect URI에 `http://localhost:3000/api/v1/auth/kakao/callback`을 추가해야 합니다. 기존 공개 Redirect URI는 삭제하지 않습니다. 현재 테스트는 PC 브라우저에서 진행하며, 휴대폰의 localhost는 이 PC가 아닙니다.

`db`는 소유 라벨이 일치하는 전용 컨테이너·볼륨만 만들거나 재사용하고 기존 TypeORM 마이그레이션을 적용합니다. 데이터를 삭제하는 down/remove 명령은 제공하지 않습니다. `npm run local:kakao:stop-db`는 DB를 멈추되 저장 데이터는 유지합니다.

정상 흐름은 프론트의 `POST /api/v1/auth/kakao/start` → 실제 카카오 로그인 → 백엔드 callback → `http://localhost:3001/auth/callback` → `POST /api/v1/auth/kakao/exchange`입니다. 팀의 네이티브 앱 복귀 계약은 `leren://auth/callback`이며, PC 웹 테스트에서는 같은 경로를 HTTP loopback origin으로 사용합니다. 클라이언트의 검증값은 시작한 브라우저 탭에 유지되어야 하며 일회용 코드만 앱 복귀 URL에 전달합니다. JWT나 카카오 토큰은 URL·보고서에 남기지 않습니다.

개발/test에서 정확한 loopback 호스트에 한해 HTTP 웹 복귀를 허용했습니다. 운영에서는 기존 상태 저장소 미구현 차단을 그대로 유지합니다. CORS는 `CORS_ORIGIN`의 완전 일치 origin과 지정한 메서드·헤더만 허용합니다. 기본 전용 값은 `http://localhost:3001`입니다.

`/health` 200은 프로세스 생존, 로그인 후 `/api/v1/users/me` 200은 발급 세션의 사용자 조회를 확인합니다. 실제 카카오 키와 사용자의 동의 없이 모의 테스트 통과를 실제 계정 로그인 성공으로 표시하지 않습니다. 카카오 키가 비어 있으면 로그인 시작은 503 설정 오류를 반환합니다.
