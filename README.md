# LEREN Frontend

Expo + React Native + TypeScript 기반 LEREN 모바일 프론트엔드 저장소입니다.

**현재는 아이폰 Expo Go에서 이메일 로그인 API 연결과 서버 닉네임 성공 알림까지 확인했습니다. 서비스 UI 다듬기, 토큰 보관·인증 상태 관리, 로그인 후 화면 이동은 추가 작업이 필요합니다.**

상태 기준일: 2026-10-28. 현재 동작과 개인 로컬 설정 관리는 [프론트 진행 상황](FRONTEND_STATUS.md), 날짜별 작업은 [개발 일지](DEVELOPMENT_LOG.md), 과거 전환 내역은 [TypeScript 전환 기록](TYPESCRIPT_MIGRATION.md)을 참고하세요.

## 실행 환경과 버전 담당 파일

iPhone에 설치된 Expo Go가 SDK 58을 사용하여, 프로젝트도 SDK 57에서 58로 업데이트했습니다.

| 패키지 | 이전 | 현재 |
| --- | --- | --- |
| expo | ~57.0.27 | ~58.0.19 |
| react-native | 0.86.3 | 0.88.0 |
| react | 19.2.3 | 19.3.0 |
| expo-status-bar | ~57.0.1 | ~58.0.4 |
| react-native-safe-area-context | ~5.7.0 | ~5.10.1 |
| @types/react | ~19.2.4 | ~19.3.0 |
| eslint-config-expo | ~57.0.2 | ~58.0.4 |

- `frontend/package.json`: 사용할 Expo SDK, React Native, React 및 관련 패키지 버전을 선언합니다. Expo와 React Native는 호환 조합으로 함께 관리합니다.
- `frontend/package-lock.json`: 하위 의존성까지 실제 설치 버전을 고정합니다. 팀원은 두 파일을 함께 받아 `npm ci`를 실행합니다.
- `frontend/app.json`: 앱 이름·아이콘·기기 설정과 플러그인을 관리합니다. `version: 1.0.0`은 앱 자체의 제품 버전이며 Expo SDK 번호가 아닙니다. SDK 58 정렬 과정에서 `expo-status-bar` 플러그인을 추가했습니다.
- `frontend/App.tsx`: 첫 화면을 구성합니다. 현재는 로그인 API 연결을 확인하는 테스트 진입점이며, 성공 시 서버 닉네임을 알림창에 표시합니다.

현재 Node.js v24.14.1 환경에서 검사했습니다. Expo Go는 프로젝트와 같은 SDK를 지원해야 하며, 향후 Expo Go 업데이트 시 호환성을 다시 확인합니다. SDK 58 조합 및 업그레이드 절차는 [Expo 공식 안내](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)를 따릅니다.

## 현재 구현된 범위

| 영역 | 준비된 것 | 아직 필요한 것 |
| --- | --- | --- |
| 개발 환경 | 기존 앱 소스 15개 TypeScript 전환, strict 타입 검사, ESLint | 새 코드에도 타입·주석 적용 |
| 공통 UI | 버튼·입력창·카드·링크 카드·선택지·체크·캐릭터 7개 | 최종 디자인과 기기별 화면 확인 |
| 로그인 | 기존 입력·로딩 UI, 이메일 로그인 POST 연결 및 실제 아이폰 성공 알림 확인 | UI 보완, 토큰 보관·인증 상태, 실패 원인 구분, 성공 후 이동 |
| 회원가입 | 입력/비밀번호 확인, 요청 중/성공/중복 오류 표시 | API·약관·비밀번호 정책·화면 이동 |
| 직업 선택 | 3종 캐릭터, 선택/미리보기/저장 중/실패/재시도 | 저장 API, 서버 코드 매핑, 완료 후 이동 |
| 탐험 지도 | 샘플 9개 지역, 선행관계 잠금, 팝업, 진행 표시 | 실제 학습 콘텐츠·진행도·이동 연결 |

`App.tsx`는 현재 **로그인 화면**을 표시하며 `onLogin`에 실제 서버 요청 함수를 전달합니다. 성공 알림을 닫아도 로그인 화면에 남습니다. 토큰 보관·자동 로그인·다음 화면 이동은 아직 연결하지 않았습니다. 직업 선택·가입 등 다른 화면의 저장·이동은 후속입니다.

화면의 간격·글꼴·색상·이미지 배치 등은 테스트 UI 기준입니다. TypeScript 검사와 번들 생성 성공은 최종 디자인 또는 실제 서비스 동작 검증 완료를 의미하지 않습니다.

## 프로젝트 구조

```text
ProjectTeam02_Front/
├─ README.md
├─ TYPESCRIPT_MIGRATION.md
├─ FRONTEND_STATUS.md         # 현재 동작·개인 설정·업로드 범위
├─ DEVELOPMENT_LOG.md          # 날짜별 변경·검증 기록
└─ frontend/
   ├─ App.tsx                  # 현재 테스트 화면 진입점
   ├─ index.js                 # Expo 등록용 JavaScript 시작 파일
   ├─ package.json
   ├─ package-lock.json
   ├─ tsconfig.json
   ├─ eslint.config.js
   ├─ app.json
   ├─ AGENTS.md                # 개발·한국어 설명 주석 규칙
   ├─ assets/characters/       # 검사·마법사·궁수 이미지
   └─ src/
      ├─ components/
      │  ├─ common/            # 공통 UI 7개(.tsx)
      │  ├─ game/              # StageCard.tsx, StagePath.tsx
      │  └─ learning/          # 아직 빈 폴더
      ├─ constants/theme.ts    # 공통 색상·간격·글꼴
      ├─ screens/
      │  ├─ auth/              # LoginScreen, SignupScreen, JobSelectionScreen(.tsx)
      │  ├─ game/              # ExplorationMapScreen.tsx
      │  ├─ home/              # 아래 4개는 아직 빈 폴더
      │  ├─ learning/
      │  ├─ mypage/
      │  └─ tutor/
      ├─ utils/errorDetails.ts # 오류 정보의 안전한 읽기
      ├─ services/auth.ts      # 이메일 로그인 요청·응답·시간 제한 처리
      ├─ context/              # 인증 등 공유 상태 코드 없음
      ├─ hooks/                # 아직 빈 폴더
      ├─ mocks/                # 아직 빈 폴더
      └─ navigation/           # 아직 빈 폴더
```

빈 폴더는 `.gitkeep`으로 유지합니다. 지도 샘플 값과 미리보기 데이터는 현재 각 화면 파일 안에 있습니다. 앞으로 추가할 Expo Router의 실제 경로 파일은 `src/app/`에 두고, 화면 UI는 `src/screens/`를 재사용합니다. 현재 Router는 설치·구성되지 않았습니다.

## 설치·실행·검사

Node.js와 npm, Git이 있는 환경에서 실행합니다. 아래 명령은 저장소를 내려받은 이후 기준입니다.

```powershell
cd C:\Leren\ProjectTeam02_Front\frontend
npm ci
npm run typecheck
npm run lint
npm start
```

SDK 57 개발 서버가 켜져 있다면 해당 터미널에서 `Ctrl + C`로 종료한 뒤 캐시를 비우고 다시 실행합니다.

```powershell
npm.cmd start -- --clear
```

재시작 후 새 QR 코드를 iPhone의 SDK 58 Expo Go에서 엽니다. 코드·번들 검증과 실제 휴대폰의 화면 동작 검증은 구분합니다.

- 팀원은 공유된 브랜치/PR을 받은 뒤 `npm ci`로 `package-lock.json` 기준 의존성을 설치합니다.
- `npm run typecheck`: TypeScript 오류 검사. `npm run lint`: Expo 코드 검사.
- `npm start`: 개발 서버 실행. 현재 로그인 연결 테스트 화면이 표시됩니다. 각자 `frontend/.env`에 접근 가능한 백엔드 주소를 설정해야 합니다.
- 기기·에뮬레이터 실행 후 UI와 입력·선택·오류 동작은 별도로 확인해야 합니다.

SDK 58에서 타입·코드 검사, Expo Doctor 20/20 검사 및 Android/iOS Hermes 번들 생성을 확인했습니다. 결과는 Git에서 제외되는 `frontend/dist/sdk58-check/`에 있습니다. 10월 28일에는 실제 아이폰에서 이메일 로그인 성공 알림까지 추가 확인했습니다. 디자인 원본과의 일치, 앱 내부 가입·내 정보·로그아웃·AI API 연결은 아직 완료하지 않았습니다. 검증 범위는 진행 상황과 개발 일지에서 확인합니다.

## 다음 작업: 이번 주 최우선은 로그인

| 순서 | 해야 할 일 | 완료 기준 |
| --- | --- | --- |
| 1 | 백엔드와 로그인 지원 범위·공개 DTO·오류·JWT·성공 이동 협의 | 요청/응답 예시, 테스트 서버·계정, 담당 범위가 기록됨 |
| 2 | 로그인 테스트 UI를 실제 디자인에 맞게 보완 | 레이아웃·여백·버튼·오류 안내와 기기별 배치 확인 |
| 3 | Expo Router로 로그인 진입 및 합의된 화면 이동 구성 | 로그인에 접근하고 성공 후 올바른 화면으로 이동 |
| 4 | 완료한 로그인 통신을 바탕으로 인증 상태 연결 | 토큰 보관·갱신 정책 적용, 내 정보·로그아웃 연동 |
| 5 | 실패·반복 클릭·재시도·키보드·스크롤 테스트 | 기기에서 결과 기록, 검사 통과 후 PR 리뷰 |

현재는 이메일·비밀번호 로그인 우선이며 카카오는 후속입니다. 최소 로그인 연결 확인을 바탕으로 UI와 인증 흐름을 보완합니다. 이메일 인증번호·메일 링크 발송 기능의 구현 완료를 뜻하지는 않습니다.

### 이미 확인된 보완점

다음은 아직 수정되지 않은 후속 항목입니다.

- 로그인: 카카오 버튼 표시가 이메일·비밀번호 입력 완료에 종속되어 있어 독립 로그인 진입 방식으로 조정할지 결정해야 합니다.
- 로그인: 네트워크/서버 장애도 계정 정보 오류로 표시하므로 실제 오류 코드에 따라 나눠야 합니다.
- 회원가입: HTTP 409를 이메일 중복으로 먼저 처리해 닉네임 중복이 잘못 표시될 수 있습니다. 구체 코드 우선으로 조정해야 합니다.
- 직업 선택: 저장 실패 안내가 '마법사'로 고정되어 있어 실제 선택값에 맞춰야 합니다.
- 탐험 지도: 번호 1~9, 선행관계, 3단계 진행 표시는 샘플입니다. 실제 서버 데이터로 교체해야 합니다.

### 로그인 이후

회원가입·약관·직업 저장 → 홈·학습 콘텐츠·진행도 → AI Tutor 대화·출처·사용량 → 퀴즈·보상·복습·설정 순으로 기능별 이슈와 PR을 나눕니다. 우선순위는 팀 일정에 따라 조정합니다.

프론트는 **Node.js 공개 API**를 호출합니다. AI 내부 API와 모델 제공업체 키는 서버 전용입니다. 서버가 할 대화 저장·권한·사용량·중복 방지를 프론트만으로 구현하지 않습니다. 알려진 공개 경로와 미정 계약은 [전환 기록의 다음 작업](TYPESCRIPT_MIGRATION.md#이제부터-해야-할-일)을 참고하세요.

## 코드 작성·리뷰 규칙

- JSX 화면/컴포넌트는 `.tsx`, 일반 함수·상수·타입은 `.ts`로 작성합니다. 시작 파일 `index.js`와 도구 설정 `eslint.config.js`는 JavaScript를 유지합니다.
- 한국어 주석으로 파일 목적, 주요 함수·상태·이벤트·콜백의 흐름을 설명합니다. 동작이 바뀌면 주석도 갱신합니다. 자세한 지침은 `frontend/AGENTS.md`를 확인합니다.
- 기존 화면 콜백 타입, DB 테이블, AI 내부 DTO를 프론트의 최종 공개 API 형식으로 간주하지 않습니다.
- Figma의 상태마다 파일을 만들기보다 같은 화면의 입력·로딩·오류·성공 상태로 구성합니다.
- PR에는 변경한 범위, 테스트 결과, 미검증/미완료 항목을 구분해 적습니다. 파일 이름 변경도 함께 커밋합니다.

## Git에 공유할 것

코드·설정·`package.json`·`package-lock.json`·문서·이미지 리소스를 공유합니다. `.gitignore`에 따라 `node_modules/`, `.expo/`, `dist/`, 로그, 실제 `.env`와 키 파일은 제외합니다. 필요한 변수 이름은 실제 값 없이 `.env.example`로 공유할 수 있습니다.

브랜치 이동이나 원격 변경 병합 전에는 현재 수정 파일을 확인합니다. TypeScript 전환과 주석·문서 정리는 `7919399`, SDK 58 호환 환경 정비는 `d50eda7` 커밋으로 로컬 이력에서 확인했습니다. 이번 로그인 연결 및 문서 변경의 커밋·푸시는 별도입니다. 로그인 기능은 `feat`, 문서 기록은 `docs`를 사용합니다. 프론트 중심 업로드와 백엔드 로컬 실행·업데이트 방침은 [진행 상황 문서](FRONTEND_STATUS.md)를 따릅니다.
