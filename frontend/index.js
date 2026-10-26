/**
 * Expo가 앱을 시작할 때 읽는 JavaScript 등록 파일입니다.
 * 확장자가 없는 ./App import는 App.tsx를 찾습니다. 화면 구성은 App.tsx에서 담당합니다.
 */
import { registerRootComponent } from 'expo';
import App from './App';

// 앱의 최상위 컴포넌트를 Expo 실행 환경에 등록합니다.
registerRootComponent(App);
