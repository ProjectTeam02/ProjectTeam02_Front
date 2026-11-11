/** 설치형 앱의 안전한 난수·SHA256·시스템 인증 창을 모바일 로그인에 연결합니다. */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { runNativeKakaoSignIn } from './kakaoNativeFlow';

export function signInWithKakaoNative() {
  // Expo Go는 프로젝트의 leren scheme을 등록하지 않으므로 인증 시작 전에 안내합니다.
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw new Error('카카오 로그인은 Expo Go에서 앱으로 돌아올 수 없어요. 개발용 설치 앱에서 실행해 주세요.');
  }
  return runNativeKakaoSignIn({
    crypto: { getRandomValues: bytes => Crypto.getRandomValues(bytes),
      subtle: { digest: (_algorithm, bytes) => Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes) } },
    fetch: (...args) => fetch(...args),
    openAuthSession: (url, redirect) => WebBrowser.openAuthSessionAsync(url, redirect),
  });
}
