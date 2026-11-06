# LEREN Frontend — test

`test` 브랜치는 Expo 프론트와 **함께 검증한 백엔드 소스**를 한 번에 내려받기 위한 구성입니다. `frontend/`에서 앱을, `backend/`에서 API와 로컬 Docker DB를 실행합니다.

설치·실행은 [테스트 방법.md](테스트%20방법.md)를 따릅니다. 백엔드 동봉 원본은 [backend/SOURCE_COMMIT](backend/SOURCE_COMMIT)에 기록했습니다. 백엔드 저장소의 브랜치를 자동으로 추적하는 submodule이 아니라 이번 검증 버전의 소스 사본입니다.

현재 실제 연결 범위는 이메일 가입/로그인/로그아웃, PC 웹 카카오 로그인, 회원 정보, 달력, 학습 이력, 학습 알림 켜기/끄기, 튜터 대화/사용량, 승인 문항 조회입니다. 실제 데이터가 없거나 DB/AI 의존성이 준비되지 않은 기능은 화면에서 구분합니다. 홈·마이페이지의 **API 연결 현황**에서 현재 계정의 조회 결과를 볼 수 있습니다.

일정 저장은 실제 학습 대상이 필요하고, 퀴즈 채점은 응시 시작 API가, AI 답변은 별도 AI 서비스가 필요합니다. 화면이나 요청 코드가 있다는 이유로 전체 기능 완료를 의미하지 않습니다. 개발용 학습·전투·꾸미기 시안에는 서버 기록과 구분되는 안내를 표시합니다.

개인 `.env`·카카오 키·JWT 비밀 값·DB 데이터·계정·`node_modules`·빌드 결과는 포함하지 않습니다. 새 PC는 `.env`와 DB를 새로 준비해야 합니다. 프론트의 `EXPO_PUBLIC_*`에는 공개 서버 주소만 넣습니다.

구조: `frontend/src/app/`는 Expo Router 주소, `frontend/src/screens/`는 화면, `frontend/src/services/`는 인증 및 API 요청, `frontend/src/context/`와 `src/hooks/`는 인증·조회 상태를 관리합니다. 기존 개발 기록과 코드 이력은 유지합니다.
