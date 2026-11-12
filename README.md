# LEREN Frontend

Expo SDK 58 · React Native · TypeScript 프론트엔드입니다. 백엔드·DB·AI는 서버에서 별도로 관리하며 이 저장소의 main에는 해당 실행 소스를 포함하지 않습니다.

## 설치·실행

저장소 루트에서 시작합니다. Node.js 24 LTS와 npm을 사용합니다.

```powershell
cd frontend
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm start
```

웹은 `npm run web`으로 실행합니다. 모바일 카카오 로그인은 Expo Go가 아닌 개발용 설치 앱이 필요합니다. Android 첫 설치는 SDK·JDK와 기기를 준비한 뒤 `npx.cmd expo run:android --device --port 3001`, 설치 후에는 `npx.cmd expo start --dev-client --lan --port 3001`을 사용합니다. [모바일 실행 안내](frontend/MOBILE_KAKAO.md)를 확인하세요. `.env.example`의 기본 주소는 `https://lerenapp.com`입니다. 서버 CORS와 계정·학습 데이터가 준비되어야 실제 기능을 사용할 수 있습니다. `.env`를 바꾸면 앱을 다시 로드하고 배포 번들은 다시 생성하세요.

프론트 공개 설정에는 서버 주소와 기능 설정만 넣습니다. 비밀 키와 인증정보는 서버에서 관리합니다. `.env.example`과 EAS의 `development`·`apk` 프로필은 `EXPO_PUBLIC_AI_REQUESTS_ENABLED=true`로 질문 전송을 허용합니다. 연결 확인만 하려면 해당 값을 `false`로 지정합니다. 계정별 질문 한도와 실제 모델 호출은 서버에서 처리합니다.

## Android APK

팀 EAS 프로젝트 `@leren/frontend`의 `apk` 프로필로 독립 실행 APK를 빌드할 수 있습니다. 설치한 앱은 Expo Go나 Metro 없이 실행합니다. APK 생성, 설치, 링크 배포와 문제 해결은 [Android APK 가이드](frontend/ANDROID_APK.md)를 확인하세요.

## 구현 및 연결 범위

- 이메일 회원가입·로그인·로그아웃, 웹·모바일 카카오 PKCE 인증과 앱 복귀 코드. 토큰은 메모리에만 보관합니다.
- 회원·성장·지갑·현재 직업/장착, 달력·학습 이력, 일정 저장, 알림 켜기/끄기 요청.
- 마이페이지에서 검사·마법사·궁수 직업 이미지 미리보기. 세 이미지는 앱에 함께 포함됩니다.
- 공개 주제 → 단계 → 개념 → 일반 퀴즈 응시/복원 → 답안 제출·서버 채점 → 저장된 결과/보상 조회.
- 튜터 대화 목록·생성·이력·사용량과 메시지 요청 코드. 최신 예시 설정은 사용자가 보낸 질문의 서버 전송을 허용합니다.
- 데이터 없음·API 미연결·로그인 필요·요청 실패를 구분합니다. 실패를 예시 데이터로 바꾸지 않습니다.

요청 코드 연결은 운영 환경의 전체 성공을 의미하지 않습니다. 보스 응시·복습 저장·프로필/직업 변경·코스튬 구매/장착·비밀번호 재설정·기기 알림 발송은 남은 기능입니다. 모바일 카카오의 실제 기기 인증·복귀는 별도 확인이 필요합니다. 미구현 기능에서 저장·구매·재설정 완료를 표시하지 않습니다.

## 검증과 문서

```powershell
npm run typecheck
npm run lint -- --no-cache
npm test
npx expo export --platform all
```

- [현재 API 연결 범위](frontend/API_INTEGRATION.md)
- [정식 학습·퀴즈 흐름](frontend/LEARNING_INTEGRATION.md)
- [통합 검증 기록](frontend/MAIN_INTEGRATION.md)
- [의존성 보안 검토](frontend/DEPENDENCY_SECURITY.md)
- [PC 작업 폴더와 GitHub 저장소 구조](frontend/DESKTOP_TRANSFER.md)
- [프론트엔드 진행 상황](프론트엔드_진행상황.md) · [개발일지](개발일지.md)

`frontend/src/app/`은 Expo Router 주소, `src/screens/`는 화면, `src/services/`는 요청·응답 검증, `src/context/`와 `src/hooks/`는 계정·조회 상태를 관리합니다.

정식 API 연동은 [PR #8](https://github.com/ProjectTeam02/ProjectTeam02_Front/pull/8), 모바일 카카오와 개발 앱 설정은 [PR #10](https://github.com/ProjectTeam02/ProjectTeam02_Front/pull/10)에서 통합했습니다. 실계정·실기기 검증은 #3, 남은 의존성 권고는 #7에서 추적합니다.
