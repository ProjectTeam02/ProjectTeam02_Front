# LEREN Frontend

Expo SDK 58 + React Native + TypeScript로 만든 LEREN 프론트입니다. **develop은 일반 개발 코드**, 이후 만들 **test는 develop에 백엔드·임시 JSON·테스트 구성을 더한 브랜치**로 사용합니다. 기존 test의 이력은 develop으로 이어받습니다.

## 현재 구현 범위

| 영역 | 구현한 내용 | 아직 연결하지 않은 부분 |
| --- | --- | --- |
| 계정 | 초기 화면, 실제 이메일 로그인·로그아웃, 메모리 세션, 학습/개인 화면 접근 제어 | 앱 회원가입·카카오·아이디 찾기·메일/비밀번호 재설정·자동 로그인·토큰 갱신 |
| 홈·학습 | 홈·지역 지도·학습 단계·개념·퀴즈·결과·복습 화면, 공통 학습 모델/공급 함수 접점 | 정식 학습 API·문제 공급·서버 채점·진도/보상/복습 기록 저장 |
| 개인 화면 | 마이페이지·달력/일정·통계·직업/의상·상점·프로필·알림 설정 화면 | 계정별 기록·구매·설정 저장·기기 알림 발송 |
| 튜터 | 질문 입력·학습 맥락·전송 준비 안내 | 실제 AI 답변·대화 이력·근거·사용량 API |

피그마 4번 페이지를 바탕으로 제품 화면 21개를 구현했습니다. 화면 UI는 `frontend/src/screens/`, 주소는 `frontend/src/app/`에서 관리합니다. 현재 화면이 있다는 것이 모든 서버 기능의 구현 완료를 의미하지 않습니다.

develop에는 더미 문제 JSON, `/api/v1/dev-learning/catalog` 호출, 예시 프로필/코인/일정/완료 기록, 화면 목록(Gallery), 강제 미리보기 상태를 포함하지 않습니다. 학습 공급 함수를 아직 연결하지 않아 학습 화면은 **학습 콘텐츠 연결 준비 중**을 표시합니다. 없는 스테이지나 API 주소를 임의로 만들지 않습니다. 홈·개인 화면·튜터의 기본 화면은 계속 확인할 수 있습니다.

## 폴더와 주요 파일

```text
ProjectTeam02_Front/
├─ README.md
├─ 프론트엔드_진행상황.md
├─ 개발일지.md
├─ 타입스크립트_전환기록.md
└─ frontend/
   ├─ index.js                 # expo-router/entry
   ├─ App.tsx                  # 이전 import 호환
   ├─ package.json / package-lock.json
   ├─ app.json / AGENTS.md
   └─ src/
      ├─ app/                  # _layout.tsx·주소 파일
      ├─ screens/              # auth·home·game·learning·mypage·tutor
      ├─ components/           # common·game·ui
      ├─ context/
      │  ├─ AuthContext.tsx    # 실제 인증·메모리 토큰
      │  ├─ LearningContentContext.tsx # 공급 함수·로딩/오류/미연결
      │  └─ LearningProgressContext.tsx # 빈 상태에서 시작하는 로컬 진행·설정
      ├─ services/auth.ts      # 로그인/로그아웃 HTTP·응답 검증
      ├─ services/learning.ts  # LearningCatalogLoader 타입
      ├─ types/learning.ts     # 화면 모델(정식 공개 DTO 아님)
      └─ constants/theme.ts    # 색상·간격·한글 글꼴
```

현재 버전은 expo ~58.0.19, react-native 0.88.0, react 19.3.0입니다. Router·Noto Sans KR·Pixelify Sans·웹 의존성을 SDK 58 조합에 추가했습니다. 버전 선언은 package.json, 실제 설치 버전은 package-lock.json, 앱 플러그인은 app.json이 관리합니다. SDK 58 업그레이드 자체는 앞선 커밋 이력에 있습니다.

## 설치와 실행

처음 받은 경우 frontend에서 패키지를 설치합니다.

```powershell
cd C:\Leren\ProjectTeam02_Front\frontend
npm.cmd ci
```

`frontend/.env.example`을 참고해 개인 `.env`에 인증 백엔드 기본 주소를 지정합니다.

```dotenv
EXPO_PUBLIC_API_URL=http://<백엔드-주소>:3000
```

휴대폰의 localhost는 PC가 아닙니다. 같은 네트워크에서 접근할 수 있는 PC 주소를 사용하고, PC 웹은 localhost를 사용할 수 있습니다. 실제 주소/비밀번호/키/토큰은 공유 소스나 문서에 넣지 않습니다.

기존 인증 백엔드와 DB를 먼저 준비하고 실제 가입된 계정으로 로그인합니다. 로컬 백엔드는 기존 백엔드 폴더에서 Docker DB를 켠 뒤 `npm.cmd run dev`를 사용합니다. 계정이 없으면 Swagger의 회원가입 API로 만듭니다. develop에는 백엔드를 동봉하지 않습니다. 웹 테스트 시 백엔드 CORS 허용 목록에 프론트 주소(http://localhost:3001 등)를 등록합니다.

```powershell
npm.cmd start -- --clear
```

프론트는 3001번, 백엔드는 3000번을 사용합니다. 웹은 실행 후 w를 누르거나 `npm.cmd run web`을 사용합니다. 실제 휴대폰은 같은 SDK 58을 지원하는 Expo Go로 엽니다. Expo 구성은 [SDK 58 공식 문서](https://docs.expo.dev/versions/v58.0.0/)와 [Router 인증 안내](https://docs.expo.dev/router/advanced/authentication/)를 참고합니다.

## 저장과 종료

사용자 이메일·닉네임·성장 정보 초기값은 실제 로그인 응답을 사용합니다. 코인·직업·일정·설정과 이후 화면 진행 변경은 메모리 상태이며 정식 저장 API가 아닙니다. 새로고침·앱 재시작·로그인/로그아웃 시 로컬 상태가 초기화됩니다. 토큰도 메모리에만 두어 재시작 후 다시 로그인합니다.

프론트/백엔드는 각각 실행한 터미널에서 Ctrl+C로 종료합니다. `docker compose up -d db`로 켠 로컬 DB는 백엔드 폴더에서 `docker compose stop db`로 따로 중지합니다. 기존 DB 볼륨이 남아 있으면 가입 계정은 유지되어 재가입할 필요가 없습니다. 계정은 GitHub 코드와 함께 공유되지 않습니다.

## 검사와 문서

```powershell
npm.cmd run typecheck
npm.cmd run lint -- --no-cache
```

현재 상태·화면 파일·커밋 단위는 [프론트 진행 상황](프론트엔드_진행상황.md), 날짜별 결과는 [개발일지](개발일지.md), 과거 TS/SDK 작업은 [전환 기록](타입스크립트_전환기록.md)을 확인합니다. 더미를 포함했던 과거 검증 결과는 당시 구성의 결과이며 develop 재검증과 구분합니다.

## 공유 규칙

기존 Markdown 네 개만 갱신합니다. 새 테스트용 Markdown, backend 폴더·더미 JSON·Gallery는 이후 test에서 추가합니다. 이번 단계에서 test를 새로 만들지 않습니다. 개인 .env·node_modules·.expo·dist·키·로그·DB 볼륨은 올리지 않습니다.

팀 커밋 규칙상 모듈 설치는 build, 새 화면/동작은 feat, 문서/설명 주석은 docs, 자동 검증 코드는 test로 분류합니다. 한국어 설명 주석을 기본으로 작성하고 실제 API 연결/임시 로컬 상태/TODO를 구별합니다. frontend/AGENTS.md를 따릅니다.
