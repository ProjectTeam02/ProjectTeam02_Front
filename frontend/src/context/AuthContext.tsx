/**
 * 실제 이메일 로그인·로그아웃과 현재 사용자/토큰을 관리합니다.
 * 비밀번호는 보관하지 않으며 토큰은 메모리에만 둡니다. 새로고침·앱 재시작 후에는 다시 로그인합니다.
 */
import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { login, logout, type LoginResult } from '../services/auth';
import { clearKakaoWebFlow, getKakaoWebFlow } from '../services/kakao';

interface AuthState {
  session: LoginResult | null;
  sessionRevision: number;
  signIn: (email: string, password: string) => Promise<void>;
  startKakaoSignIn: () => Promise<void>;
  finishKakaoSignIn: () => Promise<void>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LoginResult | null>(null);
  const [sessionRevision, setSessionRevision] = useState(0);
  const pending = useRef(false);
  const kakaoCompletion = useRef<Promise<void> | null>(null);

  /** 웹은 같은 탭으로 이동하고, 모바일은 인증 창의 복귀 결과를 기다려 세션을 반영합니다. */
  const startKakaoSignIn = async () => {
    if (pending.current) throw new Error('인증 요청을 처리하고 있어요. 잠시 후 다시 시도해 주세요.');
    pending.current = true;
    kakaoCompletion.current = null;
    try {
      if (Platform.OS === 'web') { await getKakaoWebFlow().begin(); return; }
      // Router 콜백과 시작 화면이 같은 Promise를 기다리므로 exchange·세션 반영이 중복되지 않습니다.
      kakaoCompletion.current = (async () => {
        const { signInWithKakaoNative } = await import('../services/kakaoNative');
        const result = await signInWithKakaoNative();
        setSession(result);
        setSessionRevision(value => value + 1);
      })();
      await kakaoCompletion.current;
    } finally { pending.current = false; }
  };

  /** 콜백 화면이 재실행돼도 세션 반영과 일회용 코드 교환은 한 번만 처리합니다. */
  const finishKakaoSignIn = useCallback((): Promise<void> => {
    if (kakaoCompletion.current) return kakaoCompletion.current;
    if (Platform.OS !== 'web') return Promise.reject(new Error('이 앱에서 시작한 로그인 정보가 없어요. 로그인 화면에서 다시 시작해 주세요.'));
    kakaoCompletion.current = (async () => {
      if (pending.current) throw new Error('다른 인증 요청을 처리하고 있어요.');
      pending.current = true;
      try {
        const result = await getKakaoWebFlow().finish();
        setSession(result);
        setSessionRevision(value => value + 1);
      } finally { clearKakaoWebFlow(); pending.current = false; }
    })();
    return kakaoCompletion.current;
  }, []);

  const signIn = async (email: string, password: string) => {
    if (pending.current) throw new Error('인증 요청을 처리하고 있어요. 잠시 후 다시 시도해 주세요.');
    pending.current = true;
    try {
      const result = await login(email, password);
      setSession(result);
      // 같은 계정으로 다시 들어와도 이전 사용 중 생긴 임시 학습 기록을 이어 붙이지 않습니다.
      setSessionRevision((value) => value + 1);
    } finally { pending.current = false; }
  };

  const signOut = async () => {
    if (!session || pending.current) return;
    pending.current = true;
    try {
      await logout(session.accessToken);
      kakaoCompletion.current = null;
      setSession(null);
      setSessionRevision((value) => value + 1);
    } finally { pending.current = false; }
  };

  return <AuthContext.Provider value={{ session, sessionRevision, signIn, startKakaoSignIn, finishKakaoSignIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider 안에서 사용해 주세요.');
  return context;
}
