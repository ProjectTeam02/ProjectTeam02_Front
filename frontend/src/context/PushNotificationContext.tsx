/** 로그인, 앱 복귀 및 토큰 변경에 맞춰 실제 기기 알림을 동기화합니다. */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { DevicePushToken } from 'expo-notifications';
import { useAuth } from './AuthContext';
import { activatePushSession, deactivatePushSession, supportsRemotePush, syncPushDevice, type PushPermission, type PushRegistration } from '../services/notificationApi';

type PushContextValue = {
  supported: boolean;
  busy: boolean;
  permissionGranted: boolean | null;
  canAskAgain: boolean;
  registered: boolean;
  error: string;
  refresh: () => Promise<PushRegistration | null>;
  requestPermission: () => Promise<PushRegistration | null>;
};
const PushContext = createContext<PushContextValue | null>(null);

export function PushNotificationProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const supported = supportsRemotePush();
  const [permission, setPermission] = useState<PushPermission | null>(null);
  const [registered, setRegistered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(false);
  const revision = useRef(0);
  const pendingCount = useRef(0);

  const sync = useCallback(async (ask = false, token?: DevicePushToken): Promise<PushRegistration | null> => {
    if (!accessToken || !supported || !mounted.current) return null;
    const id = ++revision.current;
    pendingCount.current += 1;
    setBusy(true);
    setError('');
    setRegistered(false);
    const isLatest = () => mounted.current && revision.current === id;
    try {
      const result = await syncPushDevice(accessToken, ask, value => {
        if (isLatest()) setPermission(value);
      }, token);
      if (isLatest() && result) {
        setPermission(result);
        setRegistered(result.registered);
      }
      return result;
    } catch (cause) {
      if (isLatest()) setError(cause instanceof Error ? cause.message : '기기 알림을 연결하지 못했어요.');
      return null;
    } finally {
      pendingCount.current -= 1;
      if (isLatest()) setBusy(false);
    }
  }, [accessToken, supported]);

  useEffect(() => {
    mounted.current = true;
    setPermission(null);
    setRegistered(false);
    setBusy(false);
    setError('');
    if (!accessToken || !supported) return () => { mounted.current = false; revision.current += 1; };

    activatePushSession(accessToken);
    void sync();
    const appStateSubscription = AppState.addEventListener('change', state => {
      // 권한 팝업 복귀 중의 중복 조회를 피합니다. 실제 설정 복귀는 다시 조회합니다.
      if (state === 'active' && pendingCount.current === 0) void sync();
    });
    let cancelled = false;
    let tokenSubscription: { remove: () => void } | undefined;
    void import('expo-notifications').then(Notifications => {
      if (cancelled) return;
      Notifications.setNotificationHandler({ handleNotification: async () => ({
        shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
      }) });
      tokenSubscription = Notifications.addPushTokenListener(token => { void sync(false, token); });
    }).catch(() => {
      if (!cancelled) setError('알림 수신 기능을 초기화하지 못했어요.');
    });

    return () => {
      cancelled = true;
      mounted.current = false;
      revision.current += 1;
      appStateSubscription.remove();
      tokenSubscription?.remove();
      deactivatePushSession(accessToken);
    };
  }, [accessToken, supported, sync]);

  return <PushContext.Provider value={{
    supported, busy, permissionGranted: permission?.granted ?? null,
    canAskAgain: permission?.canAskAgain ?? false, registered, error,
    refresh: () => sync(), requestPermission: () => sync(true),
  }}>{children}</PushContext.Provider>;
}

export function usePushNotifications() {
  const context = useContext(PushContext);
  if (!context) throw new Error('PushNotificationProvider 안에서 사용해 주세요.');
  return context;
}
