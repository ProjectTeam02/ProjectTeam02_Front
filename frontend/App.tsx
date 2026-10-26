/**
 * 앱의 현재 테스트 진입점입니다. 마법사를 선택한 직업 화면 한 개를 표시합니다.
 * TODO(로그인 구현): Expo Router로 인증 상태에 따른 초기 화면과 이동 흐름을 구성합니다.
 */
import { SafeAreaProvider } from 'react-native-safe-area-context';
import JobSelectionScreen from './src/screens/auth/JobSelectionScreen';

export default function App() {
  return (
    // 화면에서 기기 상단·하단의 안전 영역을 사용할 수 있도록 제공합니다.
    <SafeAreaProvider>
      {/* previewState는 테스트 표시용입니다. 실제 저장·이동 콜백은 아직 연결하지 않았습니다. */}
      <JobSelectionScreen previewState="mage" />
    </SafeAreaProvider>
  );
}
