# LEREN Frontend

LEREN의 프론트엔드 개발 저장소입니다. JavaScript와 Expo, React Native를 사용하며, 모바일 학습 화면과 퀴즈 전투, 복습, AI 튜터 등의 기능을 구현하기 위한 기본 폴더 구조를 구성했습니다.

현재 `test` 브랜치에는 Expo 초기 프로젝트와 폴더 구조가 준비되어 있습니다. `App.js`는 기본 예제 화면이며, `src`의 각 폴더에는 구조 유지를 위한 `.gitkeep`만 있습니다. 아래의 기능 설명은 앞으로 구현할 코드의 배치 기준입니다.

## 프로젝트 구조

```text
ProjectTeam02_Front/
├─ README.md
└─ frontend/
   ├─ assets/
   ├─ src/
   │  ├─ components/
   │  │  ├─ common/
   │  │  ├─ game/
   │  │  └─ learning/
   │  ├─ constants/
   │  ├─ context/
   │  ├─ hooks/
   │  ├─ mocks/
   │  ├─ navigation/
   │  ├─ screens/
   │  │  ├─ auth/
   │  │  ├─ game/
   │  │  ├─ home/
   │  │  ├─ learning/
   │  │  ├─ mypage/
   │  │  └─ tutor/
   │  ├─ services/
   │  └─ utils/
   ├─ .gitignore
   ├─ AGENTS.md
   ├─ App.js
   ├─ app.json
   ├─ index.js
   ├─ LICENSE
   ├─ package.json
   └─ package-lock.json
```

## 폴더별 역할

아래 경로는 `frontend/`를 기준으로 합니다.

| 경로 | 역할 및 예시 |
| --- | --- |
| `assets/` | 앱 아이콘, 캐릭터, 배경 이미지, 폰트 등 정적 리소스를 보관합니다. 현재는 Expo 기본 이미지가 있습니다. |
| `src/components/` | 화면에서 사용하는 재사용 가능한 UI 요소를 보관합니다. |
| `src/components/common/` | 여러 기능에서 공통으로 사용하는 버튼, 입력창, 카드, 팝업, 로딩 표시 등을 작성합니다. |
| `src/components/game/` | 캐릭터 표시, 몬스터 HP, 퀴즈 선택지, 보상 표시 등 게임 관련 UI를 작성합니다. |
| `src/components/learning/` | 개념 설명 카드, 학습 진행 표시, 복습 문항 카드 등 학습 관련 UI를 작성합니다. |
| `src/constants/` | 색상, 글꼴 크기, 공통 간격, 직업 종류 등 여러 곳에서 사용하는 고정값을 관리합니다. |
| `src/context/` | 로그인 사용자, 선택한 직업 등 여러 화면이 함께 사용하는 상태를 React Context로 제공하는 코드를 작성합니다. |
| `src/hooks/` | 사용자 정보 조회, 학습 진행도 처리 등 컴포넌트에서 반복되는 로직을 커스텀 훅으로 분리합니다. |
| `src/mocks/` | 서버 연결 전에 화면을 개발할 때 사용하는 예시 사용자, 학습 자료, 문제, 응답 데이터를 보관합니다. 실제 개인정보나 비밀키는 넣지 않습니다. |
| `src/navigation/` | 화면 이동 관련 공통 설정과 보조 로직을 관리합니다. 실제 라우팅을 구현할 때는 `AGENTS.md`의 개발 지침을 확인합니다. |
| `src/screens/` | 기능별 화면 UI를 작성합니다. 화면 전체 구성은 이곳에서 담당하고, 재사용할 부분은 `components`로 분리합니다. |
| `src/screens/auth/` | 로그인, 회원가입, 초기 직업 선택, 비밀번호 재설정 등 계정 관련 화면을 작성합니다. |
| `src/screens/game/` | 경제 탐험 지도, 스테이지 선택, 퀴즈 전투, 결과 및 보상 화면을 작성합니다. |
| `src/screens/home/` | 홈 대시보드, 오늘의 학습, 이어서 학습하기 등 앱의 시작 화면을 작성합니다. |
| `src/screens/learning/` | 개념 학습, 마이크로러닝, 복습·오답, 학습 달력 등 학습 관련 화면을 작성합니다. |
| `src/screens/mypage/` | 사용자 프로필, 학습 통계, 직업·보유 코스튬, 코스튬 상점, 설정 등 사용자 관리 화면을 작성합니다. |
| `src/screens/tutor/` | AI 튜터 대화, 답변 생성 중 표시, 대화 오류 등 AI 학습 보조 화면을 작성합니다. |
| `src/services/` | 로그인, 학습 자료 조회, 답안 제출, AI 질문 등 서버 API와 통신하는 코드를 작성합니다. |
| `src/utils/` | 날짜·숫자 표시, 입력값 검증 등 화면과 독립적으로 사용할 수 있는 공통 함수를 작성합니다. |

Figma의 선택 전·선택 후·정답·오답·빈 기록·오류 등은 화면의 상태 예시입니다. 상태마다 별도 화면 파일을 만들기보다, 같은 화면에서 데이터와 상태에 따라 표시하도록 구성합니다.

## 주요 파일

| 파일 | 역할 |
| --- | --- |
| `App.js` | 현재 앱의 최상위 컴포넌트입니다. 초기 예제 화면이 들어 있으며, 앞으로 앱의 전체 구성을 연결합니다. |
| `index.js` | `App.js`를 Expo 앱으로 등록하는 진입 파일입니다. |
| `app.json` | 앱 이름, 아이콘, 화면 방향, 플랫폼별 설정 등을 관리합니다. |
| `package.json` | 프로젝트 정보, 필요한 패키지, 실행 명령을 관리합니다. |
| `package-lock.json` | 패키지의 정확한 버전을 기록해 팀원이 같은 의존성을 설치할 수 있도록 합니다. |
| `.gitignore` | 개발 캐시, 설치된 패키지, 환경변수 등 Git에 올리지 않을 파일을 지정합니다. |
| `AGENTS.md` | 코딩 에이전트가 참고할 Expo·React Native 개발 지침입니다. |
| `LICENSE` | 프로젝트의 라이선스 내용을 담고 있습니다. |
| `.gitkeep` | 빈 폴더를 Git에 포함하기 위한 빈 파일입니다. 실행 코드가 아니며, 실제 코드가 추가되면 제거할 수 있습니다. |

## 설치 및 실행

Node.js와 npm, Git이 설치된 환경에서 진행합니다.

처음 저장소를 내려받는 경우:

```bash
git clone --branch test https://github.com/ProjectTeam02/ProjectTeam02_Front.git
cd ProjectTeam02_Front/frontend
npm ci
npm start
```

이미 저장소를 내려받았다면, 저장소 루트에서 `test` 브랜치로 이동한 뒤 실행합니다. 브랜치 이동 전 작업 중인 변경 사항을 정리해 주세요.

```bash
git switch test
git pull --ff-only
cd frontend
npm ci
npm start
```

`npm ci`는 `package-lock.json`을 기준으로 필요한 패키지를 설치하며, 각 팀원의 컴퓨터에 `node_modules`를 생성합니다. 패키지 설정이 바뀌지 않았다면 이후에는 `frontend` 폴더에서 `npm start`로 실행할 수 있습니다.

## Git에 공유하지 않는 파일

- `node_modules/`: 각 개발 환경에서 설치하는 패키지입니다.
- `.expo/`: Expo의 로컬 개발 상태와 캐시입니다.
- `dist/`, `web-build/`: 생성된 빌드 결과물입니다.
- `.env`, `.env.*`: 실제 환경변수 파일입니다. 필요한 변수 이름과 예시값은 `.env.example`에 작성해 공유합니다.
- 기타 로그, 인증서, 생성 파일: 기존 `.gitignore` 규칙을 따릅니다.

`package.json`, `package-lock.json`, 앱 코드와 설정, `assets` 이미지는 함께 공유합니다. 앱 아이콘을 교체할 때는 `app.json`에서 사용하는 경로도 확인합니다.
