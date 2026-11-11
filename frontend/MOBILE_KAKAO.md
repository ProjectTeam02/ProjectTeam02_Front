# 모바일 카카오 로그인

웹·모바일이 공통 PKCE 검증과 일회용 코드 교환을 사용합니다. 모바일은 `expo-crypto`로 검증값을 만들고 `expo-web-browser`의 시스템 인증 창에서 결과를 기다립니다. 앱 복귀 주소는 `leren://auth/callback`, 개발 앱 ID는 Android/iOS 모두 `com.leren.frontend.dev`입니다.

## 설치·실행

프로젝트의 frontend 폴더에서 실행합니다. 새 PC에서는 먼저 Node.js 24, npm과 Android SDK/JDK를 준비하고 아래 순서를 따릅니다.

```powershell
npm.cmd ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npx.cmd expo run:android --device --port 3001
```

SDK/JDK 경로는 각 PC의 설치 위치를 사용합니다. USB 디버깅을 허용한 기기를 연결하고 기기의 승인 안내를 완료합니다. 네이티브 의존성이나 앱 설정이 바뀌면 개발 앱도 다시 빌드합니다.

이미 이번 설정의 개발 앱이 설치됐다면:

```powershell
npx.cmd expo start --dev-client --lan --port 3001
```

같은 네트워크에서 연결합니다. Expo Go에서는 이 앱의 leren scheme을 등록할 수 없어 카카오 인증을 시작하기 전에 안내합니다. Windows의 긴 빌드 경로는 `plugins/withAndroidShortObjectPaths.js`가 CMake 설정 260으로 보완하며 생성된 android 폴더에 수동 설정을 복사하지 않습니다.

로컬 빌드 환경이 없으면 Expo 계정과 프로젝트를 연결한 뒤 개발용 클라우드 빌드를 사용할 수 있습니다.

```powershell
npx.cmd eas-cli@latest build --profile development --platform android
```

iOS는 Apple 서명·기기 등록과 별도 개발용 빌드가 필요합니다. 이 명령들은 설치용이며 실제 카카오 인증 성공을 보장하지 않습니다.

## 서버와 확인 범위

- API origin은 `https://lerenapp.com`입니다. 백엔드·Docker·DB·AI를 새 PC에서 실행할 필요가 없습니다.
- 웹은 시작 요청에 `client: web`을 보내고 모바일은 기존 서버의 기본 모바일 흐름을 사용합니다. 서버의 허용 복귀 URL·웹 CORS·카카오 등록값도 클라이언트와 맞아야 합니다. 이번 변경에서는 서버/카카오 설정을 수정하지 않았습니다.
- 최신 `.env.example`과 EAS development는 AI 요청을 허용합니다. 이번 검증에서는 질문 전송·모델 생성을 실행하지 않았습니다.
- 기기에서 인증→앱 복귀→홈→실제 회원 조회, 취소 후 재시도, 앱 재시작 후 새 로그인을 확인해야 합니다. 알림 수신만으로 성공 판정하지 않습니다.
- 검증값과 토큰은 메모리에 둡니다. 인증 중 앱 종료·프로세스 재시작 시 처음부터 로그인합니다. 토큰 갱신/로그인 유지는 별도 기능입니다.
- 같은 leren scheme을 쓰는 앱이 여러 개 설치돼 있다면 이번 개발 앱으로 복귀하는지 확인합니다.
- 오류를 공유할 때 비밀번호·토큰·전체 콜백 URL은 제외하고 실패 단계와 안내 문구만 남깁니다.

## 자동 검사

```powershell
npm.cmd run typecheck
npm.cmd run lint -- --no-cache
npm.cmd test
```

모의 인증 창을 사용하는 테스트에서 원본 PKCE 검증값 교환, 재로그인 시 새 검증값, 취소, 잘못된 scheme/host/path, 중복 쿼리, 시도 불일치와 서버 교환 실패를 검사합니다. 실기기의 인증·복귀·서명/설치는 자동 계약 검사와 별도입니다.

공식 문서: [Expo SDK 58 WebBrowser](https://docs.expo.dev/versions/v58.0.0/sdk/webbrowser/), [Crypto](https://docs.expo.dev/versions/v58.0.0/sdk/crypto/).
