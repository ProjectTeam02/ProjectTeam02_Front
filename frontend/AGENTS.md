This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## 설명 주석 기본 규칙 (사용자 요청)

- 새로 작성하거나 수정하는 코드에는 한국어 설명 주석을 기본으로 작성합니다. 이 규칙은 이후 다른 대화에서의 개발에도 적용합니다.
- 파일 상단에 목적과 책임을 설명하고, 주요 함수/컴포넌트와 상태 변경·이벤트·API 콜백의 흐름을 이해할 수 있게 주석을 답니다.
- 자명한 문법을 매 줄 반복하는 주석은 피하고, 왜 필요한지와 다른 코드에 어떻게 연결되는지 설명합니다.
- 테스트용 UI/샘플 데이터/미연결 콜백은 실제 기능과 구분합니다. TODO는 남은 작업을 구체적으로 적고 구현 완료를 암시하지 않습니다.
- 동작을 바꾸면 관련 주석도 함께 갱신하며, 주석에 비밀번호·토큰·API 키를 기록하지 않습니다.
- JSON 파일처럼 주석을 허용하지 않는 형식에는 주석을 삽입하지 않고 README 또는 관련 문서에서 설명합니다.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
