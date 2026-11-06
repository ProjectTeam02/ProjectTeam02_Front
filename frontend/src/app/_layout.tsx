/** 공통 진입점: 글꼴·인증·학습 상태와 개발용 읽기 API 확인 주소를 구성합니다. */
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// 사용하는 굵기만 가져와 앱에 불필요한 한글 글꼴 파일이 함께 묶이지 않게 합니다.
import { NotoSansKR_400Regular } from '@expo-google-fonts/noto-sans-kr/400Regular';
import { NotoSansKR_500Medium } from '@expo-google-fonts/noto-sans-kr/500Medium';
import { NotoSansKR_700Bold } from '@expo-google-fonts/noto-sans-kr/700Bold';
import { PixelifySans_700Bold } from '@expo-google-fonts/pixelify-sans/700Bold';
import { LearningProgressProvider } from '../context/LearningProgressContext';
import { LearningContentProvider } from '../context/LearningContentContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { fetchDevelopmentLearningCatalog } from '../services/devLearning';
import { BackendProfileProvider } from '../context/BackendProfileContext';
import { COLORS } from '../constants/theme';
export default function RootLayout() {
  const [loaded, error] = useFonts({ NotoSansKR_400Regular, NotoSansKR_500Medium, NotoSansKR_700Bold, PixelifySans_700Bold });
  if (!loaded && !error) return <View style={s.loading}><ActivityIndicator color={COLORS.primary} /><Text>화면을 준비하고 있어요.</Text></View>;
  return <SafeAreaProvider><AuthProvider><LearningContentProvider loader={fetchDevelopmentLearningCatalog}><AuthenticatedScreens /></LearningContentProvider></AuthProvider></SafeAreaProvider>;
}

/** 주소 직접 입력이나 뒤로 가기로 인증 없이 학습 화면에 들어가지 않게 합니다. 서버 권한 검사와는 별도입니다. */
function AuthenticatedScreens() {
  const { session, sessionRevision } = useAuth();
  return <BackendProfileProvider key={sessionRevision}><LearningProgressProvider><StatusBar style="dark" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.surface }, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="jobs" />
      <Stack.Screen name="api-test" />
      <Stack.Screen name="auth/callback" />
      <Stack.Protected guard={!!session}>
        {['home', 'explore', 'steps', 'lesson', 'quiz', 'result', 'review', 'tutor', 'mypage', 'calendar', 'statistics', 'wardrobe', 'shop', 'settings', 'profile', 'notifications', 'screens', 'connections'].map((name) => <Stack.Screen key={name} name={name} />)}
      </Stack.Protected>
    </Stack>
  </LearningProgressProvider></BackendProfileProvider>;
}
const s = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: COLORS.surface } });
