# LEREN API 연결 진행 현황

확인일: 2026-11-06 · 실제 작업 폴더: `C:\Leren\ProjectTeam02_Front` · 로컬 작업 브랜치: `codex/kakao-local-migration-20261106`

현재 연결 대상은 `http://localhost:3000`의 백엔드와 Docker의 로컬 PostgreSQL입니다. 프론트는 `http://localhost:3001`에서 실행합니다. EC2·공개 HTTPS 배포의 동작을 검증한 결과는 아닙니다. 이번 작업에서 EC2·Caddy·원격 DB·카카오 설정·실제 환경변수는 수정하지 않았습니다.

## 사진처럼 옮겨 적을 요약

- [x] 이메일 회원가입·로그인·로그아웃: 실제 백엔드 연결. 회원가입 후에는 로그인 화면에서 로그인.
- [x] PC 웹 카카오 로그인: 앞선 작업에서 실제 계정 로그인 후 홈 복귀 확인. 휴대폰 앱 딥링크는 별도 미검증.
- [x] 홈·마이페이지·프로필 조회: 실제 회원·성장·지갑·완료 단계·직업·장착 응답 사용. 예시 Lv.12·840코인 제거. 없는 값은 ‘데이터 없음’ 표시.
- [x] 월별·날짜별 달력: 실제 조회 성공. 현재 테스트 계정의 학습 기록·일정은 없음.
- [x] 학습 이력 목록: 실제 조회 성공. 현재 테스트 계정 0건. 상세 조회 화면도 연결했으나 표시할 실제 기록은 없음.
- [x] 학습 알림 켜기·끄기: 실제 저장 성공, DB 반영 확인. 현재값 조회·시간 설정·푸시 발송은 별도 미구현.
- [x] 튜터 대화 목록·대화방 생성·메시지 목록·사용량: 실제 API 연결 및 확인. 생성한 대화방에는 메시지가 없음.
- [x] 승인된 문제 조회: API 도달 확인. 서버가 ‘승인된 문제가 없습니다’라는 404를 반환하므로 문제 없음 안내 표시. AI 문제 생성 완료를 의미하지 않음.
- [ ] 학습 일정 추가·수정·삭제: 프론트 요청과 화면 연결. 실제 주제·단계·개념 데이터/선택 목록이 없어 정상 저장·수정·삭제의 전체 과정은 미검증.
- [ ] 실제 AI 답변: 전송 코드 연결. FastAPI가 `DISCONNECTED`라 전송 버튼 제한. 실제 답변 성공은 미검증.
- [ ] 퀴즈 답안 채점·응시·단계 완료·보상: 채점 API는 있지만 응시 생성/문제 배정 API가 없어 연결 미완료.
- [ ] 비밀번호 재설정·프로필 수정·직업 변경·전체 보유 코스튬·상품/구매/장착·개념별 통계: 사용 가능한 백엔드 API가 없어 미연결.
- [ ] 정식 탐험/단계/개념/복습: 정식 목록·저장 API 없음. 개발용 카탈로그 및 메모리 시안으로 구분.

체크된 항목도 위에 적힌 조회·저장 범위까지만 완료입니다. “요청 코드 연결”과 “실제 데이터를 사용한 전체 과정 검증”은 구분했습니다.

## 기능별 근거와 남은 조건

아래 경로는 모두 `/api/v1` 기준입니다.

| 기능 | 현재 상태 | 실제 확인 결과 / 남은 조건 |
|---|---|---|
| 회원 정보·성장·지갑·완료 단계 | 연결·조회 성공 | `GET /users/me` 200. 합성 계정 레벨 1은 서버 값. 지갑·직업은 null, 장착은 빈 목록으로 반환되어 임의 값 대신 없음 표시 |
| 프로필·직업·현재 장착 조회 | 연결·일부 값 없음 | 같은 회원 API 사용. 전체 보유 목록·수정 API는 아님 |
| 월 달력 | 연결·실제 기록 없음 | `GET /calendar?month=YYYY-MM` 200. 완료·예정 0, 월 이동 UI 확인 |
| 날짜별 기록/일정 | 연결·실제 기록 없음 | `GET /calendar/days/:date` 200. `learningRecords=[]`, `schedules=[]` |
| 학습 이력 | 연결·실제 기록 없음 | `GET /learning/history` 200, total=0. 페이지 이동 연결 |
| 학습 이력 상세 | 연결 코드 있음·표시할 기록 없음 | `GET /learning/history/:recordType/:recordId` 연결. 실제 소유 기록이 없어 정상 상세 응답의 로컬 서버 검증은 못함. 없는 ID 404를 성공/빈 결과로 오인하지 않음. 문항·선택 답·채점·해설 변환은 계약 검사 통과 |
| 학습 알림 켜기·끄기 | 연결·저장 검증 완료 | `PATCH /users/me/notifications` 200. 켜기/끄기 모두 확인, UI 켜기 저장 후 DB `reminder_enabled=true` 읽기 확인 |
| 알림 조회/시간/푸시 | 미구현 | 현재 저장값 GET, 시간 변경, 기기 권한·실제 발송 흐름 없음. 화면을 열 때 임의로 켜짐으로 표시하지 않음 |
| 일정 추가·수정·삭제 | 조건부 연결·전체 과정 미검증 | `POST /calendar/plans`, `PATCH/DELETE /calendar/plans/:planId`. 실제 일정은 goal·날짜·유형과 실제 topicId 및 stageId/conceptId 필요. 제목·시간만 저장하는 임시 모델 제거. 없는 대상으로 POST 시 422 확인. 정식 학습 목록 API 필요 |
| 일정 대상 선택 | 조회된 기록·일정에 한정 | 선택한 날짜의 실제 일정과 최근 최대 100개 학습 기록에서 대상 추출. 개발용 JSON의 예시 ID는 보내지 않음. 처음 쓰는 계정은 정식 목록 API가 없으면 대상 선택 불가 |
| 튜터 대화 목록 | 연결·조회 성공 | `GET /tutor/conversations` 200. 처음 0건, 테스트 대화 생성 후 실제 목록 표시 |
| 튜터 대화방 생성 | 연결·저장 검증 완료 | `POST /tutor/conversations` 201. DB enum에 맞춰 `entryPoint=NAV` 사용. 자동 생성하지 않고 버튼으로 생성 |
| 튜터 메시지 목록 | 연결·대화 내용 없음 | `GET /tutor/conversations/:id/messages` 200, total=0. 페이지 이동·근거 표시 연결 |
| 튜터 사용량 | 연결·조회 성공 | `GET /tutor/usage` 200. 합성 계정 하루 20회/남음 20회. 예시 4회 제거 |
| 튜터 실제 AI 답변 | 코드 연결·AI 서버 대기 | `POST /tutor/messages`의 실제 전송 코드 및 오류 처리 연결. 의존성 조회가 FastAPI DISCONNECTED이므로 UI 전송 제한. 예시 해설/타이머 답변 제거. 성공 응답 변환은 계약 검사만 통과 |
| 승인 문항 조회 | 연결·문제 없음 | `GET /quizzes/generate`가 정확한 NOT_FOUND/‘승인된 문제가 없습니다.’ 404 반환. 이 경우만 빈 문제 안내. 일반 404·401·503은 실패 처리 |
| 답안 제출 | 연결 미완료 | `POST /quizzes/:id/submit`은 소유한 attemptId가 필수인데, 이를 생성하는 공개 API가 없음. 임의 ID를 만들거나 로컬 채점을 서버 저장으로 안내하지 않음 |
| AI 문제 생성→저장 | 미구현 | generate는 DB의 승인 문항 1개 조회이며 AI 생성 요청이 아님. AI 생성 결과를 저장/승인/배정하는 공개 흐름 필요 |
| 정식 탐험/개념/복습/진행/보상 | 미연결 | `/dev-learning/catalog`은 `figma-test-fixture` 개발 자료. 정식 학습 및 복습 기록과 구분 |
| 프로필 수정·직업 변경·보유/상품/구매/장착·개념별 통계·비밀번호 재설정 | 미연결 | 사용 가능한 실제 라우트 없음. 수정/구매를 완료했다고 안내하지 않음. 전투·꾸미기 기존 시안은 개발 모드의 별도 미리보기로 보존 |

## 화면 안내 규칙

- 성공 + 데이터 있음: **API 연결 및 조회에 성공했습니다.**
- 성공 + 실제 목록이 비어 있음: **API는 연결되었으나 실제 데이터가 없어 표시되지 않습니다.**
- 일부 회원 값 null: 해당 항목을 **데이터 없음**으로 표시.
- 401·403·일반 404·422·503·잘못된 JSON·시간 초과·연결 실패: **API 요청 실패**와 이유 표시. 더미 데이터로 대체하지 않음. 401에는 로그인 화면 진입 버튼 제공.
- 미구현/시안: **아직 미연결** 또는 **개발 시안** 표시. 개발용 전투·꾸미기의 메모리 변경은 실제 회원 응답에 합치지 않음.

홈과 마이페이지에 **API 연결 현황** 진입점을 추가했습니다. 현재 로그인한 계정의 조회 결과를 실시간 확인할 수 있습니다. 이 화면을 여는 것만으로 저장·삭제·AI 전송을 실행하지 않습니다.

## 검증 결과

- 실제 로컬 API: 회원/월 달력/날짜별 기록/학습 이력/튜터 목록/사용량 200, 대화방 생성 201, 메시지 빈 목록 200, 알림 켜기/끄기 저장 200.
- 실제 로컬 실패 응답: 없는 학습 대상으로 일정 저장 422, 없는 학습 상세 404, 잘못된 토큰 401. 오류를 성공으로 바꾸지 않음.
- 의존성: DB CONNECTED / FastAPI DISCONNECTED. HTTP 200이어도 AI 정상 동작으로 표시하지 않음.
- 실제 UI: 합성 계정 로그인→홈/마이페이지, 현황 화면, 달력 월 이동·대상 없음, 학습 이력 0건, 알림 저장, 튜터 대화 생성·빈 메시지, 실제 문제 없음, 별도 전투 시안 안내 확인.
- 자동 계약 검사 38개 통과, TypeScript·lint·웹 export 통과.
- 일정 CRUD의 실제 성공, 실제 학습 이력 상세의 정상 서버 응답, 실제 문제 채점, 실제 AI 답변, 휴대폰 네이티브·공개 EC2 HTTPS는 미검증.
- 합성 로컬 계정 1개와 테스트 대화방 2개를 만들었으며, 실제 사용자의 기록은 변경하지 않음. 테스트용 임시 비밀번호 파일은 검증 후 삭제. 비밀번호·토큰·카카오 키는 보고서에 기록하지 않음.

## 변경 파일

기준 폴더: `C:\Leren\ProjectTeam02_Front\frontend`

- `src/services/backend.ts`: 인증 공통 요청, 타임아웃/취소/오류, 실제 응답 변환.
- `src/hooks/useBackend.ts`, `src/context/BackendProfileContext.tsx`: 조회/저장 상태, 중복 클릭 방지, 사용자·조건 변경 시 지난 응답 제외.
- `src/components/ui/ApiStatus.tsx`, `HistoryRecords.tsx`, `Screen.tsx`: 연결 상태·기록 상세·시안 안내.
- `src/screens/home/HomeScreen.tsx`, `src/screens/mypage/{MyPage,Calendar,Statistics,NotificationSettings,ProfileEdit,Wardrobe,CostumeShop,Settings}Screen.tsx`: 실제 조회/저장 또는 미연결 안내.
- `src/screens/tutor/TutorScreen.tsx`, `src/screens/learning/QuizBattleScreen.tsx`: 실제 튜터·문제 API, 의존성 제한.
- `src/screens/dev/ApiConnectionsScreen.tsx`, `src/app/connections.tsx`, `src/app/_layout.tsx`: 로그인 후 실시간 연결 현황 화면, 예시 성장 초기값 주입 제거.
- `src/screens/mypage/{Wardrobe,CostumeShop}Preview.tsx`, `src/screens/learning/QuizBattlePreview.tsx`: 기존 시안 보존. 자동 대체 데이터로 사용하지 않음.
- `scripts/backend-api.test.mjs`, `package.json`, `API_INTEGRATION.md`: 검증 명령과 현황 문서.

## 실행 방법

Docker Desktop을 실행하고, 각각 별도 터미널에서 실행합니다.

```powershell
# 백엔드: 실제 .env를 그대로 사용
cd C:\Leren\ProjectTeam02_Back
npm.cmd run local:kakao:db
npm.cmd run local:kakao:start
```

```powershell
# 프론트
cd C:\Leren\ProjectTeam02_Front\frontend
npm.cmd run web -- --localhost
```

브라우저에서 `http://localhost:3001` 접속→실제 계정 로그인→홈 또는 마이페이지의 **API 연결 현황** 선택. 새로고침하면 메모리 토큰이 사라지므로 다시 로그인해야 합니다. 토큰 자동 갱신·로그인 유지 기능은 이번 범위에서 추가하지 않았습니다.

```powershell
# 프론트 검사
npm.cmd run typecheck
npm.cmd run lint
node --test scripts/backend-api.test.mjs scripts/api-smoke.test.mjs scripts/kakao-local.test.mjs scripts/signup.test.mjs
```

공개 서버로 전환할 때는 실제 API origin을 `EXPO_PUBLIC_API_URL`에 지정하고 프론트를 재시작/재빌드해야 합니다. `/api-docs` 주소를 넣는 방식이 아닙니다. 서버의 동일 API 배포·DB 데이터·CORS·카카오 백엔드 콜백/앱 복귀 주소도 맞아야 합니다. 개발용 카탈로그 주소를 정식 학습 API라고 간주해서는 안 됩니다.
