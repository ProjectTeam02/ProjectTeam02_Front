/**
 * 이메일 로그인 API 연결을 확인하는 테스트 진입점입니다.
 * 토큰 저장·자동 로그인·로그인 후 화면 이동은 아직 연결하지 않습니다.
 */
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './src/screens/auth/LoginScreen';
import { login } from './src/services/auth';

export default function App() {
  // 화면의 입력값을 서버로 보내고 실제 성공 응답을 확인합니다.
  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password);

    // 토큰은 표시하지 않고 서버에서 받은 닉네임만 보여줍니다.
    Alert.alert(
      '로그인 연결 성공',
      `${result.user.nickname}님, 백엔드 로그인에 성공했어요.`,
    );
  };

  return (
    <SafeAreaProvider>
      <LoginScreen onLogin={handleLogin} />
    </SafeAreaProvider>
  );
}