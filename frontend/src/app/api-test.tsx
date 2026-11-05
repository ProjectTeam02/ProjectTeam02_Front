/** 개발 중에만 실제 API의 읽기 연동을 확인하는 별도 주소입니다. */
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import ApiTestScreen from '../screens/dev/ApiTestScreen';

export default function ApiTestRoute() {
  const { sessionRevision } = useAuth();
  if (!__DEV__) return <Redirect href="/" />;
  // 계정이 바뀌면 이전 계정의 이력과 진행 중인 요청을 함께 정리합니다.
  return <ApiTestScreen key={sessionRevision} />;
}
