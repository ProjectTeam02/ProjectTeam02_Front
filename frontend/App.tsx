/**
 * 예전 App.tsx import를 위한 호환 진입점입니다.
 * 실제 앱 시작은 index.js → expo-router/entry → src/app/_layout.tsx에서 관리합니다.
 * 이전 로그인 통신 함수는 src/services/auth.ts에 보존되어 있습니다.
 */
export { default } from './src/app/_layout';
