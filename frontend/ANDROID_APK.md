# Leren Android APK 빌드와 배포

EAS의 `apk` 프로필은 JavaScript 번들과 캐릭터 이미지를 포함하는 Android 릴리스 APK를 만듭니다. 설치한 앱은 Expo Go와 Metro 없이 시작합니다. 로그인·학습·AI 질문에는 인터넷과 운영 API가 필요합니다.

| 항목 | 값 |
| --- | --- |
| 팀 Expo 프로젝트 | `@leren/frontend` |
| Android 앱 ID | `com.leren.frontend.dev` |
| 앱 표시 이름 | `frontend` |
| 최초 EAS 배포 버전 | `1.0.0`, `versionCode` 1 |
| 운영 API | `https://lerenapp.com` |

## 배포용 APK 만들기

GitHub에서 내려받은 저장소 루트에서 `frontend/`로 이동합니다. 팀 Expo 계정으로 로그인하면 `app.json`에 연결된 프로젝트를 사용합니다.

```powershell
Set-Location frontend
npm.cmd ci
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build --platform android --profile apk
```

후속 배포에는 같은 앱 ID와 팀의 기존 Android 서명 키를 사용합니다. 새 APK를 배포할 때 `app.json`의 `expo.android.versionCode`를 올립니다. 빌드 상태가 `Finished`이면 EAS 완료 화면의 APK 링크를 테스터에게 공유합니다. 내부 배포 링크는 기본 설정에서 링크를 가진 사람이 다운로드할 수 있습니다. [Expo APK 빌드](https://docs.expo.dev/build-reference/apk/) · [내부 배포](https://docs.expo.dev/build/internal-distribution/) · [Android 앱 서명](https://developer.android.com/studio/publish/app-signing)

`apk` 프로필은 운영 API 주소와 `EXPO_PUBLIC_AI_REQUESTS_ENABLED=true`를 번들에 넣습니다. 운영 API 주소에는 `/api/v1` 경로를 붙이지 않습니다. 공개 값은 APK에서 읽을 수 있으므로 모델 공급자 키와 서버 인증정보는 서버 환경에서 관리합니다. [Expo 공개 환경변수](https://docs.expo.dev/guides/environment-variables/)

### 업로드 파일 확인

저장소 루트의 `.easignore`는 `frontend/` 소스·설정·에셋을 포함하고, 로컬 환경 파일·서명 파일·생성된 Android/iOS 폴더를 제외합니다. 업로드 크기가 비정상적으로 작거나 빌드가 준비 단계에서 종료되면 `frontend/`에서 아래 명령으로 업로드 대상의 로컬 복사본을 확인합니다.

```powershell
$archive = Join-Path $env:TEMP ('leren-eas-archive-' + [guid]::NewGuid().ToString('N'))
npx.cmd eas-cli@latest build:inspect --platform android --profile apk --stage archive --output $archive
```

복사본에 `frontend/package.json`, `frontend/app.json`, `frontend/src/`, `frontend/assets/characters/`가 있는지 확인합니다. Windows에서 EAS가 `frontend` 디렉터리를 건너뛰지 않도록 루트 허용 규칙은 `!/frontend`로 작성합니다. 최초 배포의 80바이트 압축 문제는 이 규칙을 고친 뒤 해결됐습니다. [Expo 업로드 검사](https://docs.expo.dev/build-reference/easignore/#check-which-files-eas-cli-uploads)

## 설치 및 테스트

1. Android 휴대폰에서 EAS 링크를 열고 다운로드한 APK를 눌러 설치합니다. Android가 설치 권한을 요청하면 APK를 연 브라우저나 파일 앱에 해당 권한을 허용합니다.
2. 에뮬레이터에서는 `frontend/`에서 `npx.cmd eas-cli@latest build:run --platform android`를 실행한 뒤 완료된 `apk` 빌드를 선택합니다. 앱 목록의 `frontend` 아이콘으로 다시 실행할 수 있습니다.
3. 로그인 후 **마이페이지 → 직업·장착 코스튬 → 직업 미리보기**에서 각 캐릭터의 선택 이미지를 확인합니다. 이미지 표시를 오프라인에서 바로 확인하려면 설치한 앱을 다음 링크로 엽니다.

   ```powershell
   adb shell am start -W -a android.intent.action.VIEW -d 'leren://jobs?preview=1' -p com.leren.frontend.dev
   ```

4. 네트워크 연결 상태에서 이메일 로그인·일반 퀴즈 응시·AI 튜터 질문을 확인합니다. 카카오를 사용하는 경우 인증 후 `leren://auth/callback`으로 복귀하는지 확인합니다.

`INSTALL_FAILED_UPDATE_INCOMPATIBLE`는 같은 앱 ID로 설치된 개발 앱의 서명이 EAS APK와 다를 때 발생합니다. 개발 앱의 데이터를 보존하려면 새 에뮬레이터를 사용합니다. 기존 에뮬레이터의 앱을 제거하면 해당 기기에 저장된 앱 데이터가 지워집니다. [Expo 설치 안내](https://docs.expo.dev/build-reference/apk/)

## Windows 로컬 릴리스 확인

Android Studio SDK, JDK와 프로젝트가 요구하는 NDK를 준비합니다. `frontend/`에서 다음을 실행합니다.

```powershell
$env:EXPO_PUBLIC_API_URL = 'https://lerenapp.com'
$env:EXPO_PUBLIC_AI_REQUESTS_ENABLED = 'true'
if (!(Test-Path android)) { npx.cmd expo prebuild --platform android --no-install }
Push-Location android
.\gradlew.bat :app:assembleRelease
Pop-Location
```

`android/app/build/outputs/apk/release/app-release.apk`가 로컬 확인용 파일입니다. 생성된 네이티브 폴더에 Expo 설정을 다시 적용할 때는 보존할 로컬 변경을 확인한 뒤 Prebuild의 `--clean` 옵션을 사용합니다. 팀 배포 파일은 EAS의 기존 팀 키로 서명합니다. [Expo 로컬 릴리스 빌드](https://docs.expo.dev/guides/local-app-production/)

Windows에서 `Filename longer than 260 characters`가 발생하면 더 짧은 체크아웃 경로를 사용하거나 Android Studio SDK Manager에서 CMake 3.31.6을 설치합니다. CMake를 변경할 때는 Windows의 긴 경로 지원을 켜고 로컬 Gradle 사용자 설정 `%USERPROFILE%\.gradle\gradle.properties`에 `android.cmakeVersion=3.31.6`을 지정합니다. [Expo Windows 경로 안내](https://docs.expo.dev/troubleshooting/windows-long-paths/)

## 캐릭터 이미지 교체

`frontend/assets/characters/`에서 아래 파일명을 유지합니다. 기존 원본은 투명 배경의 88×88 PNG입니다. 선택 화면에서 세 파일을 정적으로 불러오므로, 교체한 뒤 APK를 다시 빌드하면 새 이미지가 들어갑니다. [Expo 정적 에셋](https://docs.expo.dev/develop/user-interface/assets/)

| 직업 | 파일명 |
| --- | --- |
| 검사 | `leren_warrior.png` |
| 마법사 | `leren_mage.png` |
| 궁수 | `leren_archer.png` |

## 최초 배포 확인 범위

- 2026-11-11에 로컬 Gradle 릴리스 APK를 에뮬레이터에서 비행기 모드로 시작해 세 캐릭터의 선택 이미지를 확인했습니다.
- 2026-11-12에 데스크탑 작업본에서 팀 서명 APK를 빌드했습니다. Android 에뮬레이터 설치·시작과 Expo 계정 없이 다운로드되는 것을 확인했습니다. 작업 순서는 [개발일지](../개발일지.md#2026-11-12)에 있습니다.
- GitHub 반영 후보에서 타입 검사, 린트, 자동 테스트 66개를 통과했습니다. Android JavaScript 번들 검사에서 캐릭터 PNG 세 장과 운영 API 주소를 확인했고, EAS 업로드 검사에서 필요한 소스·설정·이미지를 확인했습니다.
- 실기기 이메일·카카오 로그인, 운영 계정으로 학습 완료, 실제 AI 모델 답변은 후속 확인 항목입니다.
