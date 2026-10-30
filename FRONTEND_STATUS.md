# 프론트엔드 진행 상황 및 로컬 설정 관리

마지막 확인: **2026-10-28 (한국 시간)**

프론트엔드의 현재 동작, 수정한 파일, 개인 PC에서만 관리할 설정, 다음 작업을 정리합니다. 날짜별 작업 이력은 [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md)에 이어서 작성합니다.

## 1. 저장소 사용 방향

- **프론트 저장소**: 화면·API 연결 코드와 개발 문서를 작성하고 커밋·푸시합니다.
- **백엔드 저장소**: 팀의 코드를 내려받아 로컬에서 실행하고 프론트 연동을 검증하는 용도로 우선 사용합니다. 백엔드 기능 수정·푸시는 별도 협의합니다.
- **개인 설정**: 각 저장소의 `.env`에 둡니다. 공유 코드에 본인 PC 주소나 비밀 값을 직접 넣지 않습니다.

두 저장소는 같은 `C:\Leren` 아래에 있어도 별도 Git 저장소입니다. 프론트에서 커밋·푸시한 내용이 백엔드에 함께 반영되지는 않습니다.

```text
C:\Leren\
├─ ProjectTeam02_Front\       # 주 개발·업로드 대상
│  ├─ FRONTEND_STATUS.md      # 현재 상태와 로컬 설정 관리
│  ├─ DEVELOPMENT_LOG.md       # 날짜별 개발 일지
│  └─ frontend\
│     ├─ .env                 # 본인 PC의 서버 주소: Git 제외
│     ├─ App.tsx
│     └─ src\services\auth.ts
├─ ProjectTeam02_Back\        # 팀 코드 내려받기·로컬 실행 중심
│  ├─ .env                    # 로컬 DB·JWT 설정: Git 제외
│  └─ .env.example            # 공유 예시: Git 추적 대상
└─ openrouter-test\           # 별도 OpenRouter 개인 연결 테스트
```

## 2. 현재 확인된 동작

**이메일 로그인 API 연결 테스트까지 완료했습니다.** 전체 인증 기능과 서비스 UI 완성이 완료된 상태는 아닙니다.

| 구분 | 확인한 결과 | 확인 범위 |
| --- | --- | --- |
| 백엔드·DB | 로컬 PostgreSQL 테이블 생성 및 Node.js 서버 실행 | 본인 PC 로컬 환경 |
| PC·아이폰 네트워크 | 같은 공유기의 유선 PC와 Wi-Fi 아이폰에서 `/health`의 `UP` 확인 | 임시 외부 주소 없이 내부 IP로 테스트 |
| Swagger 로그인 | HTTP 200, 사용자 정보·토큰 반환 | 서버 API 직접 호출 |
| Swagger 내 정보 조회 | Bearer 인증으로 HTTP 200 | 앱 내부 조회 기능과는 별도 |
| Swagger 로그아웃 | 로그아웃 뒤 기존 토큰의 접근 거부 확인 | 앱 내부 로그아웃 기능과는 별도 |
| 아이폰 앱 로그인 | 입력한 계정을 서버로 보내고 서버 닉네임을 성공 알림에 표시 | Expo Go 실제 기기 테스트 |
| 프론트 검사 | 타입 검사 및 캐시를 끈 ESLint 검사 통과 | 2026-10-28 검사 결과 |

현재 앱의 연결 흐름:

```text
LoginScreen 입력·로그인 버튼
→ App.tsx의 handleLogin
→ services/auth.ts의 login
→ POST /api/v1/auth/login
→ 백엔드의 DB 계정 확인·토큰 발급
→ 앱의 닉네임 성공 알림
```

**알림을 닫아도 로그인 화면에 남는 것이 현재 테스트 코드의 예정 동작입니다.** 앱에서 토큰을 보관하거나 다음 화면으로 이동하는 기능은 아직 없습니다.

## 3. 이번 프론트 코드 조정 사항

아래 파일은 팀과 공유할 코드입니다. 개인 PC에서 테스트했다고 해서 모두 개인 전용 변경은 아닙니다.

| 파일 | 현재 조정 내용 | 후속 확인 |
| --- | --- | --- |
| [`frontend/App.tsx`](frontend/App.tsx) | 직업 선택 마법사 미리보기 대신 로그인 화면 표시. `onLogin`에 서버 요청 함수 연결 | 정식 로그인 상태·라우팅 구성 시 테스트 진입점 변경 |
| [`frontend/src/services/auth.ts`](frontend/src/services/auth.ts) | `EXPO_PUBLIC_API_URL`에서 서버 주소를 읽음. 로그인 POST, 응답 타입·기본 검사, 15초 제한, 오류 전달 | 토큰 관리·내 정보·로그아웃·갱신 요청은 후속 |
| [`frontend/tsconfig.json`](frontend/tsconfig.json) | `types: ["react", "node"]`로 `process` 타입을 인식하도록 설정 | 팀원도 타입 검사 실행 |
| [`frontend/src/screens/auth/LoginScreen.tsx`](frontend/src/screens/auth/LoginScreen.tsx) | 기존 입력·검증·로딩·콜백 구조를 활용. 이번 연결에서 디자인 수정하지 않음 | 모든 실패를 계정 오류로 표시하는 부분은 보완 필요 |

백엔드 성공 응답은 `{ success: true, data: { user, accessToken, refreshToken } }` 형태입니다. 토큰 값 자체를 문서·화면·콘솔에 남기지 않습니다.

## 4. 개인 설정과 공유 설정 구분

| 항목 | 관리 위치 | GitHub 업로드 여부 |
| --- | --- | --- |
| PC의 백엔드 접속 주소 | `frontend/.env`의 `EXPO_PUBLIC_API_URL` | 현재 `.gitignore`로 제외 |
| JWT 서명용 비밀 값·로컬 DB 접속 정보 | 백엔드 `.env` | 현재 `.gitignore`로 제외 |
| OpenRouter 실제 키 | 개인 테스트 또는 AI 서버의 `.env` | 프론트에 넣지 않음 |
| 환경변수 항목명·예시 문구 | `.env.example` 또는 문서 예시 | 공유 가능. 실제 비밀 값은 금지 |
| `App.tsx`·`auth.ts`·`tsconfig.json` | 프론트 소스·설정 | 공유 대상 |
| `node_modules`·`.expo`·번들 결과 | 자동 생성 폴더 | 현재 프론트 `.gitignore`로 제외 |

프론트 `.env`의 형식:

```dotenv
EXPO_PUBLIC_API_URL=http://<PC의-IPv4-주소>:3000
```

- 각자 PC의 실제 내부 IP로 바꿉니다. DHCP·네트워크 변경으로 주소가 달라지면 다시 확인합니다.
- 실제 아이폰에서 `localhost`는 PC를 가리키지 않습니다. 같은 공유기에서 접근 가능한 PC 주소를 사용합니다.
- `.env`에 내용을 입력한 뒤 저장했는지 확인합니다. 이번 테스트에서는 빈 파일로 저장되어 접속 실패가 발생했습니다.
- `EXPO_PUBLIC_` 변수는 앱에 포함되는 값입니다. 서버 주소를 넣는 용도이며 OpenRouter 키나 JWT 비밀 값을 넣지 않습니다.
- 로그인 후 서버가 발급한 사용자 토큰을 저장·갱신하는 것은 별도 기능입니다. 이를 `.env`에 고정해서 넣지 않습니다.

### 현재 발견한 백엔드 개인 변경

2026-10-28 Git 점검에서 백엔드 `.env.example`의 `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` 두 항목이 수정된 상태를 확인했습니다. 실제 값 형태이며 현재 백엔드 `.env`의 값과는 다릅니다. 실제 사용 여부는 확인하지 않았습니다.

이 파일은 Git 추적 대상이므로 개인 설정 보관용으로 사용하지 않습니다. **다음 백엔드 업데이트 전, 해당 두 항목을 아래 예시 문구로 되돌리고 개인 값은 `.env`에만 관리하는 것이 정리할 사항입니다.** 이 문서 작성 시 해당 파일을 자동 변경하지는 않았습니다.

```dotenv
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
```

백엔드를 푸시하지 않아도 추적 파일의 개인 수정은 이후 업데이트와 충돌할 수 있습니다. `.gitignore`에 추가하는 것만으로 이미 추적 중인 `.env.example`의 변경이 제외되지는 않습니다.

## 5. 프론트 커밋 전 확인

아래 명령은 **프론트 저장소 루트**에서 실행합니다.

```powershell
cd C:\Leren\ProjectTeam02_Front
git status --short
git diff --stat
git check-ignore -v frontend/.env
git ls-files -- frontend/.env
```

- `check-ignore`에서는 `.env`를 제외하는 규칙이 표시되는지 확인합니다.
- `ls-files`에는 `.env`가 표시되지 않아야 합니다. 이미 추적 중이라면 `.gitignore`만으로 해결된 것으로 간주하지 않습니다.
- 공유할 파일만 선택합니다. 이번 연결 코드와 문서 기준 예시는 아래와 같습니다. 이후 작업에서는 실제 변경 목록에 맞게 조정합니다.

```powershell
git add frontend/App.tsx frontend/src/services/auth.ts frontend/tsconfig.json
git add DEVELOPMENT_LOG.md FRONTEND_STATUS.md README.md
git diff --cached --name-only
git diff --cached
```

마지막 명령은 로컬에서 직접 확인하는 용도입니다. 예상하지 않은 파일이나 실제 비밀 값이 보이면 커밋 전에 제외·정리합니다. 확인 화면을 채팅에 그대로 공유하지 않습니다.

팀 커밋 규칙에 따라 로그인 연결 코드는 `feat`, 개발 일지·진행 문서는 `docs`를 사용합니다. 가능하면 변경 목적별로 나누어 커밋합니다. 위 파일 선택 명령은 설명용이며, 문서 작성 과정에서 스테이징·커밋·푸시는 하지 않았습니다.

## 6. 평소 다시 실행하는 방법

Docker Desktop을 실행한 뒤 백엔드와 프론트를 **서로 다른 터미널**에서 실행합니다.

백엔드 터미널:

```powershell
cd C:\Leren\ProjectTeam02_Back
docker compose up -d db
npm.cmd run dev
```

프론트 터미널:

```powershell
cd C:\Leren\ProjectTeam02_Front\frontend
npm.cmd start -- --clear
```

패키지·DB 구조가 바뀌지 않았다면 매번 재설치하거나 마이그레이션을 다시 준비할 필요는 없습니다. 위 명령은 로컬 설정과 최초 DB 준비가 끝난 현재 환경 기준입니다.

## 7. 백엔드를 새로 내려받을 때

1. `ProjectTeam02_Back`에서 현재 브랜치와 `git status --short`로 개인 변경을 확인합니다.
2. `.env.example` 등 추적 파일에 넣은 개인 설정을 먼저 정리합니다. 다른 작업이 있을 수 있으므로 전체 변경을 한꺼번에 삭제하지 않습니다.
3. 팀에서 안내한 브랜치의 최신 코드를 받습니다. 현재 로컬 실행 기준은 `main`입니다.
4. 새 `.env.example`에 추가된 항목을 기존 개인 `.env`와 비교해 필요한 항목만 반영합니다. 실제 비밀 값을 담은 `.env`를 예시 파일로 복사하지 않습니다.
5. `package-lock.json`이 바뀌었다면 `npm.cmd ci`, 새 마이그레이션이 추가됐다면 팀 안내에 따라 `npm.cmd run db:migrate`를 실행합니다.
6. 서버 재실행 후 Swagger 로그인과 프론트 로그인 연결을 다시 확인합니다.

`docker compose down -v`는 로컬 DB 볼륨과 저장 데이터를 삭제합니다. 단순 코드 업데이트나 VS Code 재시작 때 실행할 명령이 아닙니다.

## 8. 다음 프론트 작업

- [ ] 계정 오류·서버 연결 실패·시간 초과 안내 구분
- [ ] 로그인 토큰 보관 및 인증 상태 관리
- [ ] 로그인 성공 후 화면 이동
- [ ] 앱 내부 내 정보 조회·로그아웃 연결
- [ ] 자동 로그인·토큰 갱신 구현 및 실패 상황 검증
- [ ] 로그인 UI 디자인·간격·상태별 화면 보완

다른 화면·카카오·AI Tutor·퀴즈의 기능 보완은 위 로그인 흐름과 구분하여 진행합니다. 백엔드 패키지 취약점 4건은 별도 영향 분석이 남아 있으며 프론트 연결 성공만으로 해소된 것으로 간주하지 않습니다.

## 9. 이 문서 갱신 방법

- 진행 상황이 바뀌면 확인일, 현재 동작, 남은 작업을 함께 갱신합니다.
- 그날 변경한 파일·문제·검증 결과는 [개발 일지](DEVELOPMENT_LOG.md)의 해당 날짜에 추가합니다.
- 커밋·PR 링크는 실제 생성된 뒤 넣습니다. 로컬 테스트 성공과 배포 완료를 구분합니다.
