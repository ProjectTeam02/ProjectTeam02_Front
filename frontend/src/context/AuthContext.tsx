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

  /** 외부 카카오 화면으로 이동하기 전에 일회용 검증값만 같은 브라우저 탭에 보관합니다. */
  const startKakaoSignIn = async () => {
    if (Platform.OS !== 'web') throw new Error('이번 카카오 테스트는 PC 브라우저 localhost:3001에서 진행해 주세요. 휴대폰 앱 인증은 아직 연결하지 않았어요.');
    if (pending.current) throw new Error('인증 요청을 처리하고 있어요. 잠시 후 다시 시도해 주세요.');
    pending.current = true;
    kakaoCompletion.current = null;
    try { await getKakaoWebFlow().begin(); } finally { pending.current = false; }
  };

  /** 콜백 화면이 재실행돼도 세션 반영과 일회용 코드 교환은 한 번만 처리합니다. */
  const finishKakaoSignIn = useCallback((): Promise<void> => {
    if (kakaoCompletion.current) return kakaoCompletion.current;
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
