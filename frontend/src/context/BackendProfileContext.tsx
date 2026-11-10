/** 홈과 마이페이지가 같은 실제 회원 응답을 사용합니다. 없는 성장·코인 값은 null 그대로 유지합니다. */
import { createContext, useContext, type ReactNode } from 'react';
import { useBackend, type ApiResource } from '../hooks/useBackend';
import { PATHS, memberDecoder, type Member } from '../services/backend';
const Context = createContext<ApiResource<Member> | null>(null);
export function BackendProfileProvider({ children }: { children: ReactNode }) {
  const profile = useBackend(PATHS.me, memberDecoder);
  return <Context.Provider value={profile}>{children}</Context.Provider>;
}
export function useBackendProfile() { const value = useContext(Context); if (!value) throw new Error('회원 정보 공급자가 필요합니다.'); return value; }
