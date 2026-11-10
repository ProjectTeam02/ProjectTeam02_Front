# 프론트 의존성 보안 검토

검토일: 2026-11-10 KST. 관련 추적 이슈: [#7](https://github.com/ProjectTeam02/ProjectTeam02_Front/issues/7).

## 적용한 변경

- Expo SDK는 58을 유지하고 `expo`를 58.0.23으로 올렸습니다. `expo install --fix`가 안내한 Expo Linking 58.0.16, Router 58.0.30, Splash Screen 58.0.13, React Native 0.88.1, Safe Area Context 5.11.1을 함께 반영했습니다.
- 새 Expo CLI 58.1.19는 기존 Zod 직접 의존성을 제거하고, Expo Config 58.0.11은 기존 deepmerge 의존성을 제거합니다.
- Expo CLI의 node-forge는 기존 `^1.4.0` 범위 안에서 1.4.3으로 갱신했습니다. 현재 npm audit에서 이 패키지의 권고는 더 이상 보고되지 않습니다.
- ESLint React Hooks 플러그인은 `^3.25.0 || ^4.0.0`을 허용하므로 Zod를 4.6.7로 갱신했습니다. 강제 override 없이 기존 선언 범위를 만족합니다.
- glob은 기존 `^13.0.0` 범위 안에서 13.0.7로 갱신했습니다.
- SDK를 낮추는 `npm audit fix --force`나 상위 패키지의 선언 범위를 벗어나는 override는 적용하지 않았습니다.

## 재검사 결과와 한계

이번 작업 시작 시 잠금 파일의 npm audit 결과는 **18개 영향 패키지 항목: high 3, moderate 14, low 1, critical 0**이었습니다. 11월 4일 #7에 기록된 24개는 그때의 잠금 파일과 보안 데이터 기준이며 이번 측정값과 구분합니다.

최종 잠금 파일을 2026-11-10에 다시 조회한 결과는 **10개 영향 패키지 항목: moderate 10, high 0, critical 0, low 0**입니다. 10개의 서로 다른 취약점이라는 뜻은 아닙니다. 직접 원인은 아래 두 권고이며, Expo·ESLint 상위 패키지 항목까지 전파하여 합산됩니다. 의존성 갱신 직후 조회의 12개에서 바뀌었으므로 PR은 가장 최근 측정값을 사용합니다.

`expo install --check`는 **Dependencies are up to date**를 반환했습니다. `npm ls`로 node-forge 1.4.3, Zod 4.6.7, glob 13.0.7, minimatch 10.2.6을 확인했습니다. 타입 검사·lint·전체 프론트 테스트·웹/Android/iOS export 결과는 같은 변경의 PR 검증 기록을 따릅니다. 번들 검증은 실기기 설치·서명·배포 검증을 대신하지 않습니다.

## 남아 있는 두 권고

| 원인 | 확인한 실행 경로 | 현재 판단·완화 |
| --- | --- | --- |
| [glob 취소 이후 파일 탐색 지속](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) | Expo CLI의 프로젝트 파일 탐색, prebuild 템플릿 처리, Expo Fingerprint의 `.gitignore` 탐색. CLI `anyMatchAsync`는 실제로 AbortController와 globStream을 함께 사용하므로 취소 경로가 전혀 없다고 판단하지 않습니다. | 파일 시스템 탐색이 예상보다 오래 지속되어 개발·빌드 프로세스의 자원을 소모할 수 있습니다. 알려진 수정 계열은 14.0.2 이상이나 현재 Expo 58은 glob 13을 요구합니다. 신뢰할 수 있는 체크아웃·템플릿만 빌드하고, 빌드 작업에 외부 프로세스 시간 제한을 적용하며, 불신하는 저장소·비정상적으로 큰 파일 트리에서 Expo 명령을 실행하지 않습니다. |
| [minimatch 패턴 증폭](https://github.com/advisories/GHSA-g3hv-75wg-m249) | Expo Fingerprint의 ignore 패턴과 glob 전이 경로, TypeScript ESLint의 프로젝트 매칭. 확인한 Fingerprint 및 ESLint 직접 호출은 `{ dot: true }`를 사용하며 `optimizationLevel >= 2`를 지정하지 않습니다. glob 내부 경로까지 무위험으로 단정하지 않습니다. | 알려진 수정 계열은 11.0.1 이상이나 Expo Fingerprint·glob·TypeScript ESLint는 현재 10 계열을 요구합니다. 외부 입력으로 glob/ignore 패턴을 만들지 않고 빌드 설정 변경을 검토합니다. 불신하는 저장소를 다루는 빌드는 별도로 격리하고 CPU·메모리·시간을 제한합니다. |

`frontend/src`에서 glob·minimatch·node-forge·Zod를 직접 import하는 앱 코드는 발견하지 못했습니다. 현재 확인한 경로는 개발·정적 번들 생성 도구입니다. Expo 자체가 npm의 production 의존성이므로 `npm audit --omit=dev`만으로 모바일 앱 실행 노출 여부를 판단하면 안 됩니다. 또한 직접 import가 없다는 사실만으로 전체 실행 경로의 무위험을 보증하지 않습니다.

**#7은 이 두 도구 권고의 호환 수정이 남아 있으므로 열린 상태로 유지합니다.** 프론트 통합 PR은 남은 위험과 완화책을 명시하고, 후속 Expo/ESLint 업데이트에서 glob 14·minimatch 11 호환을 공식 지원하면 잠금 파일 재생성, 새 설치, audit, 타입·lint·테스트와 세 플랫폼 export를 다시 확인합니다.

## 근거

- [Expo SDK 58 문서](https://docs.expo.dev/versions/v58.0.0/), [Expo CLI 의존성 설치·검증](https://docs.expo.dev/more/expo-cli/#installing-dependencies)
- [Zod 권고와 수정 버전](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
- 설치된 패키지의 `package.json`, CLI/Fingerprint/TypeScript ESLint 코드와 이번 `npm audit --json`, `npm ls` 결과. 원본 검사 출력은 저장소 외부 작업 기록에 보관합니다.
