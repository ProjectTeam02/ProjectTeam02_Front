# 데스크탑 이전과 최신 노트북 작업 반영

2026-11-11 한국 시간에 노트북 공유 폴더의 작업을 원격 `develop`을 기준으로 선별해 [PR #10](https://github.com/ProjectTeam02/ProjectTeam02_Front/pull/10)에 반영했습니다. 11월 12일 APK 배포 절차는 [Android APK 가이드](ANDROID_APK.md)에 기록했습니다.

## PC 폴더와 GitHub 구조

PC에서 `leren-share`는 동기화용 상위 폴더입니다. GitHub에서는 `ProjectTeam02_Front`의 내부가 저장소 루트입니다. 클론한 폴더를 열면 루트의 `README.md`, `.easignore`와 `frontend/`가 바로 보입니다. 이 문서의 실행 명령과 파일 경로는 저장소 루트를 기준으로 합니다.

## 11월 11일 반영 범위

- 이미 main에 병합된 PR #8의 정식 API·오류 구분·리다이렉트 차단·회귀 테스트·SDK 호환 업데이트를 유지합니다.
- 모바일 카카오의 암호화/시스템 인증 창, leren 딥링크 복귀, 공통 PKCE 코드 교환과 성공 후 홈 이동을 추가합니다.
- 개발 앱 ID·EAS development·Windows CMake 경로 플러그인과 모바일 인증 테스트를 포함합니다.
- 탐험 하위 화면에서 강조된 탐험 탭을 누르면 탐험 목록으로 돌아가도록 수정합니다.
- 노트북 최신 설정과 동일하게 AI 질문 전송을 허용하고 실행 문서를 맞춥니다. 실제 모델 호출 검증은 수행하지 않습니다.

기존 로컬 test 계열 브랜치 전체를 병합하지 않습니다. 원격에 이미 있는 학습 API·공통 요청·테스트는 재사용합니다. 오래된 비밀번호 재설정/구매 완료 시안, 개발용 문제 JSON/로더, 갤러리, 미사용 로컬 AI 중계, 동봉 backend는 이번 반영에서 제외합니다.

## 필요한 파일

새 PC에서는 최신 `develop` 또는 `main`을 내려받고 `frontend/`에서 `npm ci`를 실행합니다. 저장소 루트의 `.easignore`는 EAS 빌드에 사용할 파일을 선택합니다. `frontend/`에는 코드·에셋·플러그인·테스트·잠금 파일·Expo/EAS 설정과 실행 문서가 있습니다.

실제 `.env`는 공유하지 않으며 `.env.example`로 새로 만듭니다. 공개 설정은 API=https://lerenapp.com과 AI 요청 허용 여부입니다. 개발용 학습 카탈로그 주소는 필요 없습니다. 키·JWT·DB 인증정보는 넣지 않습니다.

node_modules, .expo, dist, android/ios 생성물, Gradle/CMake 캐시와 local.properties는 올리지 않습니다. 새 PC에서 npm ci로 설치하고 모바일 개발 앱은 [MOBILE_KAKAO.md](MOBILE_KAKAO.md)에 따라 빌드합니다.

## 남은 검증

실제 Android/iOS 인증·복귀·회원 조회, 운영 계정의 전체 학습 흐름과 키보드/UI 확인은 #3에서 계속 추적합니다. 도구 의존성 보안 권고는 #7에서 유지합니다. 이번 변경의 계약 검사·번들 생성은 실서버·실기기 성공이나 다른 팀원의 승인을 뜻하지 않습니다.

## 11월 11일 검증 결과

- 최종 잠금 파일로 npm ci 새 설치, 타입 검사, lint, 전체 테스트 66개 통과.
- Expo SDK 호환 검사 통과. 공통 config와 Android introspection에서 leren scheme 및 CMake 경로 설정 260 확인.
- 웹·Android·iOS JavaScript export 통과 (`--no-bytecode`). 기본 export는 Windows의 애플리케이션 제어 정책이 새 Hermes 컴파일러 실행을 차단하여 바이트코드 생성에서 실패했습니다. 보안 설정은 변경하지 않았으며 바이트코드/네이티브 설치 검증은 미완료입니다. 배포 설정에서 Hermes를 비활성화한 것은 아닙니다.
- npm audit: moderate 10, high/critical/low 0. 직접 원인 glob·minimatch 2개 권고는 기존 #7에서 추적합니다.
- 업로드 대상의 알려진 키·JWT·개인키 패턴 탐지 없음. 정적 검사가 모든 비밀값 부재를 보증하지는 않습니다.

11월 10일의 과거 통합 기록은 MAIN_INTEGRATION.md에 보존합니다. 이번 PR에도 실제 검증 범위와 제한사항을 기록합니다.
