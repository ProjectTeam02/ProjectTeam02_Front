# 실제 작업 폴더에서 로컬 카카오 로그인

실제 프로젝트는 C:\Leren\ProjectTeam02_Front 이며 인증·학습 서버 설정은 frontend/.env 한 곳에서 읽습니다. 예시 환경파일과 .env.local은 실행 설정으로 사용하지 않습니다.

- EXPO_PUBLIC_API_URL=http://localhost:3000
- EXPO_PUBLIC_LEARNING_API_URL=http://localhost:3000

기존 개발용 학습 JSON은 백엔드의 /api/v1/dev-learning/catalog에서 제공하며 실제 카카오 회원·세션·학습 이력 API와 구분됩니다. 기존 화면과 테스트 데이터는 유지했습니다.

## 실행

Docker Desktop을 켠 뒤 백엔드 터미널에서:

```powershell
cd C:\Leren\ProjectTeam02_Back
npm.cmd run local:kakao:db
npm.cmd run local:kakao:start
```

프론트 터미널에서:

```powershell
cd C:\Leren\ProjectTeam02_Front\frontend
npm.cmd run web -- --localhost
```

브라우저 http://localhost:3001 에서 카카오로 시작하기를 누릅니다. 실제 카카오 키·Client Secret·DB/JWT 값은 백엔드 루트 .env에만 저장하며 Git에서 제외됩니다. 프론트 .env에는 공개 API origin만 둡니다.

카카오→백엔드 콜백은 http://localhost:3000/api/v1/auth/kakao/callback 이고 PC 웹 복귀는 http://localhost:3001/auth/callback 입니다. 팀의 네이티브 합의 주소 leren://auth/callback과 구분합니다. 이번 확인 범위는 PC 브라우저입니다.

2026-11-06 실제 폴더에서 사용자 카카오 재로그인·홈 복귀·보호된 학습 이력 조회까지 확인했습니다. 프론트 타입 검사·lint·20개 계약 검사·웹 빌드, 백엔드 132개 검사(1개 별도 조건 skip)가 통과했습니다. 이전 전 설정과 미커밋 작업은 C:\Leren\.migration-backup 및 백엔드 보존 브랜치에 남겼습니다.

로그인은 start → 카카오 인증 → callback → 앱 복귀 → exchange 순서입니다. 검증값은 같은 탭에 잠시 보관하고 JWT는 메모리에만 두므로 새로고침 후 다시 로그인해야 합니다. 키·토큰·인가 코드를 공유하지 않습니다.

## 검사

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:kakao
node --test scripts/api-smoke.test.mjs
```
## 앱 회원가입 API 연결 (2026-11-06)

회원가입 화면은 POST /api/v1/auth/signup으로 이메일·비밀번호·비밀번호 확인·닉네임을 전송합니다. HTTP 201과 실제 회원 응답이 확인된 경우에만 가입 완료 화면을 표시합니다. 중복 이메일(409), 입력 오류(422), 서버·통신 실패를 완료로 처리하지 않습니다.

이번 동선은 회원가입 완료 → 로그인하기 → 기존 이메일 로그인입니다. 가입 응답의 토큰으로 자동 로그인하지 않으며, 비밀번호·토큰을 파일이나 영구 저장소에 남기지 않습니다. 직업 선택·학습 저장 API 연결은 이번 변경에 포함하지 않았습니다.

실제 앱 화면에서 합성 테스트 계정 가입과 같은 계정 로그인, 중복 이메일 거절을 확인했고 DB에 해당 회원 1개가 저장됐습니다. 타입 검사·lint·전체 인증 계약 테스트 26개·웹 빌드가 통과했습니다. 신규 회원가입 계약 검사는 npm.cmd run test:signup으로 실행합니다.
