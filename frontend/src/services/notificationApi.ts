/** OS 알림 권한과 Expo 푸시 토큰을 기존 기기 등록 API에 동기화합니다. */
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import type { DevicePushToken, NotificationPermissionsStatus } from 'expo-notifications';
import { backendRequest, object, bool, str } from './backend';

const DEVICE_PATH = '/api/v1/users/me/devices';
const DEVICE_UUID_KEY = 'leren-device-uuid';

export type PushPermission = { granted: boolean; canAskAgain: boolean };
export type PushRegistration = PushPermission & { registered: boolean };

export function supportsRemotePush(): boolean {
  return (Platform.OS === 'ios' || Platform.OS === 'android') &&
    Device.isDevice && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

let uuidTask: Promise<string> | undefined;
function getDeviceUuid(): Promise<string> {
  if (!uuidTask) {
    uuidTask = (async () => {
      const stored = await SecureStore.getItemAsync(DEVICE_UUID_KEY);
      if (stored) return stored;
      const uuid = Crypto.randomUUID();
      await SecureStore.setItemAsync(DEVICE_UUID_KEY, uuid);
      return uuid;
    })().catch(error => { uuidTask = undefined; throw error; });
  }
  return uuidTask;
}

const deviceDecoder = (value: unknown) => {
  const data = object(value);
  return {
    deviceId: str(data.deviceId),
    deviceUuid: str(data.deviceUuid),
    notificationPermission: bool(data.notificationPermission),
    pushTokenRegistered: bool(data.pushTokenRegistered),
    isActive: bool(data.isActive),
  };
};

// 세션 세대가 바뀌면 이전 권한/토큰 조회가 뒤늦게 완료되어도 등록하지 않습니다.
let activeToken: string | null = null;
let generation = 0;
let queue: Promise<unknown> = Promise.resolve();
let activeWrite: Promise<unknown> | null = null;

export function activatePushSession(accessToken: string): void {
  if (activeToken === accessToken) return;
  activeToken = accessToken;
  generation += 1;
  queue = Promise.resolve();
}

export function deactivatePushSession(accessToken: string): void {
  if (activeToken !== accessToken) return;
  activeToken = null;
  generation += 1;
  queue = Promise.resolve();
}

/** 로그아웃 전에 새 등록을 막고, 이미 전송한 PUT만 종료될 때까지 기다립니다. */
export async function pauseDeviceSync(accessToken: string): Promise<void> {
  deactivatePushSession(accessToken);
  if (activeWrite) await activeWrite.catch(() => undefined);
}

export function resumeDeviceSync(accessToken: string): void {
  activatePushSession(accessToken);
}

function withTimeout<T>(task: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('푸시 토큰 발급 시간이 초과되었어요. 다시 시도해 주세요.')), milliseconds);
  });
  return Promise.race([task, timeout]).finally(() => clearTimeout(timer));
}

async function registerDevice(
  accessToken: string,
  requestPermission: boolean,
  isCurrent: () => boolean,
  onPermission: (permission: PushPermission) => void,
  devicePushToken?: DevicePushToken,
): Promise<PushRegistration | null> {
  if (!isCurrent() || !supportsRemotePush()) return null;
  const Notifications = await import('expo-notifications');
  if (!isCurrent()) return null;

  // Android 13 이상에서는 권한 요청 전에 알림 채널을 준비합니다.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '학습 알림', importance: Notifications.AndroidImportance.HIGH, sound: 'default',
    });
  }
  if (!isCurrent()) return null;

  const granted = (permission: NotificationPermissionsStatus) =>
    permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  let permission = await Notifications.getPermissionsAsync();
  if (!isCurrent()) return null;
  if (requestPermission && !granted(permission) && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (!isCurrent()) return null;
  const permissionState = { granted: granted(permission), canAskAgain: permission.canAskAgain };
  onPermission(permissionState);
  const deviceUuid = await getDeviceUuid();
  if (!isCurrent()) return null;

  let pushToken: string | null = null;
  if (permissionState.granted) {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (typeof projectId !== 'string' || !projectId) throw new Error('Expo 프로젝트 ID가 설정되지 않았어요.');
    const result = await withTimeout(Notifications.getExpoPushTokenAsync({
      projectId, ...(devicePushToken ? { devicePushToken } : {}),
    }), 20000);
    pushToken = result.data;
  }
  if (!isCurrent()) return null;
  // 이전 세션이 시작한 PUT과 겹치지 않게 한 뒤 세션을 다시 확인합니다.
  if (activeWrite) await activeWrite.catch(() => undefined);
  if (!isCurrent()) return null;

  // 권한 거부/해제는 실제 상태를 기록하고 기존 푸시 토큰을 명시적으로 제거합니다.
  const write = backendRequest(accessToken, DEVICE_PATH, deviceDecoder, {
    method: 'PUT',
    body: {
      deviceUuid,
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      notificationPermission: permissionState.granted,
      pushToken,
      osVersion: Device.osVersion?.slice(0, 30) ?? null,
      appVersion: Constants.expoConfig?.version?.slice(0, 30) ?? null,
      deviceModel: Device.modelName?.slice(0, 100) ?? null,
    },
  });
  activeWrite = write;
  try {
    const result = await write;
    if (!isCurrent()) return null;
    if (result.deviceUuid !== deviceUuid || result.notificationPermission !== permissionState.granted ||
        !result.isActive || result.pushTokenRegistered !== permissionState.granted) {
      throw new Error('서버의 기기 등록 상태가 요청과 일치하지 않아요. 다시 시도해 주세요.');
    }
    return { ...permissionState, registered: permissionState.granted && result.pushTokenRegistered };
  } finally {
    if (activeWrite === write) activeWrite = null;
  }
}

/** 같은 세션의 등록은 순서대로 처리합니다. 오래된 세션의 대기 작업은 실행하지 않습니다. */
export function syncPushDevice(
  accessToken: string,
  requestPermission = false,
  onPermission: (permission: PushPermission) => void = () => {},
  devicePushToken?: DevicePushToken,
): Promise<PushRegistration | null> {
  const captured = generation;
  const isCurrent = () => activeToken === accessToken && generation === captured;
  const task = queue.then(() => registerDevice(accessToken, requestPermission, isCurrent, onPermission, devicePushToken));
  queue = task.catch(() => undefined);
  return task;
}
