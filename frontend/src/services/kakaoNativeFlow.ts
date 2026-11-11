/** 모바일 인증 창의 결과를 검증하고 기존 PKCE·일회용 코드 교환 흐름을 재사용합니다. */
import { createKakaoFlow } from './kakao.ts';
import type { LoginResult } from './authContract.ts';

export const KAKAO_APP_RETURN = 'leren://auth/callback';
type FlowDependencies = Parameters<typeof createKakaoFlow>[0];
interface NativeDependencies {
  crypto: FlowDependencies['crypto'];
  fetch: typeof fetch;
  openAuthSession: (url: string, redirect: string) => Promise<{ type: string; url?: string }>;
}

/** 검증값은 이번 인증 동안 메모리에만 둡니다. 앱 종료·재시작 후의 콜백은 재로그인이 필요합니다. */
export async function runNativeKakaoSignIn(deps: NativeDependencies): Promise<LoginResult> {
  const pending = new Map<string, string>();
  let authorizationUrl = '';
  let callbackUrl = '';
  const flow = createKakaoFlow({
    crypto: deps.crypto, fetch: deps.fetch, now: Date.now,
    storage: { getItem: key => pending.get(key) ?? null, setItem: (key, value) => { pending.set(key, value); }, removeItem: key => { pending.delete(key); } },
    navigate: url => { authorizationUrl = url; },
    currentUrl: () => callbackUrl, replaceUrl: () => { callbackUrl = ''; },
  });
  try {
    await flow.begin();
    const result = await deps.openAuthSession(authorizationUrl, KAKAO_APP_RETURN);
    if (result.type === 'cancel' || result.type === 'dismiss') throw new Error('카카오 로그인을 취소했어요. 다시 시작할 수 있어요.');
    if (result.type !== 'success' || !result.url) throw new Error('카카오 인증을 완료하지 못했어요. 처음부터 다시 로그인해 주세요.');
    let returned: URL;
    try { returned = new URL(result.url); } catch { throw new Error('카카오 로그인 복귀 주소가 올바르지 않아요.'); }
    // prefix 일치만 믿지 않고 등록한 scheme·host·path 전체를 검사합니다.
    if (returned.protocol !== 'leren:' || returned.host !== 'auth' || returned.pathname !== '/callback'
      || returned.username || returned.password || returned.hash) throw new Error('카카오 로그인 복귀 주소가 올바르지 않아요.');
    // 외부 이동 없이 공통 웹 검증기의 경로 표현으로만 변환합니다. 쿼리·시도 ID 검증은 그대로 수행합니다.
    callbackUrl = `https://leren.invalid/auth/callback${returned.search}`;
    return await flow.finish();
  } finally { pending.clear(); callbackUrl = ''; }
}
