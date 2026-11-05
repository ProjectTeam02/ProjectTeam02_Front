/**
 * PC 웹에서 실제 카카오 인증을 시작하고 일회용 코드를 Leren 세션으로 교환합니다.
 * PKCE 검증값만 같은 탭의 sessionStorage에 잠시 보관하며, JWT·사용자 정보는 저장하거나 출력하지 않습니다.
 */
import { getAuthenticatedApiBaseUrl } from './apiConfig.ts';
import { parseLoginResponse, type LoginResult } from './authContract.ts';

const STORAGE_KEY = 'leren.kakao.pending.v1';
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
interface PendingLogin { verifier: string; attemptId: string; origin: string; createdAt: number; expiresAt: number }
interface BrowserDependencies {
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  crypto: Pick<Crypto, 'getRandomValues' | 'subtle'>;
  fetch: typeof fetch;
  now: () => number;
  currentUrl: () => string;
  replaceUrl: (cleanUrl: string) => void;
  navigate: (url: string) => void;
}

/** 브라우저 기본 암호화로 32바이트 검증값과 PKCE S256 challenge를 만듭니다. */
export async function createPkce(crypto: BrowserDependencies['crypto']): Promise<{ verifier: string; challenge: string }> {
  const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const verifier = encode(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  return { verifier, challenge };
}

/** 테스트에서도 같은 검증·일회성 교환 로직을 사용하고 브라우저 입출력만 대체합니다. */
export function createKakaoFlow(browser: BrowserDependencies) {
  let completion: Promise<LoginResult> | null = null;
  let starting = false;

  async function post(path: string, body: unknown, origin: string): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await browser.fetch(`${origin}${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body), signal: controller.signal, redirect: 'error',
      });
      if (!response.ok) {
        if (response.status === 503) throw new Error('백엔드의 카카오 로그인 설정이 준비되지 않았어요. 로컬 키와 콜백 설정을 확인해 주세요.');
        if (response.status === 401 || response.status === 422) throw new Error('카카오 로그인 정보가 만료됐거나 유효하지 않아요. 처음부터 다시 로그인해 주세요.');
        throw new Error(`카카오 로그인 요청에 실패했어요. (HTTP ${response.status})`);
      }
      if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) throw new Error('백엔드가 로그인 JSON 대신 다른 응답을 보냈어요. API 주소를 확인해 주세요.');
      try { return await response.json(); } catch { throw new Error('백엔드 로그인 응답이 올바른 JSON이 아니에요.'); }
    } catch (cause) {
      if (controller.signal.aborted) throw new Error('카카오 로그인 서버 응답 시간이 초과됐어요. 다시 시도해 주세요.');
      if (cause instanceof TypeError) throw new Error('로컬 백엔드에 연결하지 못했어요. 서버 실행 상태와 CORS 설정을 확인해 주세요.');
      throw cause;
    } finally { clearTimeout(timeout); }
  }

  return {
    async begin(): Promise<void> {
      if (starting) throw new Error('카카오 로그인을 준비하고 있어요. 잠시 기다려 주세요.');
      starting = true;
      completion = null;
      try {
        browser.storage.removeItem(STORAGE_KEY);
        const origin = getAuthenticatedApiBaseUrl();
        const { verifier, challenge } = await createPkce(browser.crypto);
        const response = await post('/api/v1/auth/kakao/start', { codeChallenge: challenge, codeChallengeMethod: 'S256' }, origin);
        if (!object(response) || response.success !== true || !object(response.data)) throw new Error('카카오 로그인 시작 응답 형식이 올바르지 않아요.');
        const data = response.data;
        if (typeof data.authorizationUrl !== 'string' || typeof data.loginAttemptId !== 'string' || !UUID.test(data.loginAttemptId)
          || typeof data.expiresIn !== 'number' || !Number.isInteger(data.expiresIn) || data.expiresIn < 1 || data.expiresIn > 600) {
          throw new Error('카카오 로그인 시작 응답 형식이 올바르지 않아요.');
        }
        let authorization: URL;
        try { authorization = new URL(data.authorizationUrl); } catch { throw new Error('카카오 인증 주소가 올바르지 않아요.'); }
        const callback = `${origin}/api/v1/auth/kakao/callback`;
        if (authorization.origin !== 'https://kauth.kakao.com' || authorization.pathname !== '/oauth/authorize'
          || authorization.username || authorization.password || authorization.hash
          || ['response_type', 'client_id', 'redirect_uri', 'state'].some(key => authorization.searchParams.getAll(key).length !== 1)
          || authorization.searchParams.get('response_type') !== 'code' || !TOKEN.test(authorization.searchParams.get('state') || '')
          || !authorization.searchParams.get('client_id') || authorization.searchParams.get('redirect_uri') !== callback) {
          throw new Error('백엔드가 반환한 카카오 인증 주소 또는 콜백 주소가 올바르지 않아요.');
        }
        const now = browser.now();
        const pending: PendingLogin = { verifier, attemptId: data.loginAttemptId, origin, createdAt: now, expiresAt: now + data.expiresIn * 1000 };
        browser.storage.setItem(STORAGE_KEY, JSON.stringify(pending));
        browser.navigate(authorization.toString());
      } catch (cause) {
        try { browser.storage.removeItem(STORAGE_KEY); } catch { /* 저장소 접근이 막힌 경우에도 원래 오류를 유지합니다. */ }
        throw cause;
      } finally { starting = false; }
    },

    /** StrictMode 재실행에도 같은 교환 Promise를 돌려줘 일회용 코드를 중복 전송하지 않습니다. */
    finish(): Promise<LoginResult> {
      if (completion) return completion;
      // 오류·취소·잘못된 요청도 즉시 주소에서 민감한 쿼리를 지운 뒤 검증합니다.
      const url = new URL(browser.currentUrl());
      browser.replaceUrl(url.pathname);
      const rawPending = browser.storage.getItem(STORAGE_KEY);
      browser.storage.removeItem(STORAGE_KEY);
      completion = (async () => {
        const origin = getAuthenticatedApiBaseUrl();
        const values = url.searchParams;
        if (url.pathname !== '/auth/callback' || url.hash || [...values.keys()].some(key => !['loginAttemptId', 'loginCode', 'error'].includes(key))
          || [...new Set(values.keys())].some(key => values.getAll(key).length !== 1)) throw new Error('카카오 로그인 복귀 주소가 올바르지 않아요. 처음부터 다시 시작해 주세요.');
        let pending: unknown;
        try { pending = rawPending ? JSON.parse(rawPending) : null; } catch { pending = null; }
        if (!object(pending) || typeof pending.verifier !== 'string' || !TOKEN.test(pending.verifier)
          || typeof pending.attemptId !== 'string' || !UUID.test(pending.attemptId) || pending.origin !== origin
          || typeof pending.createdAt !== 'number' || typeof pending.expiresAt !== 'number'
          || !Number.isFinite(pending.createdAt) || !Number.isFinite(pending.expiresAt)
          || browser.now() < pending.createdAt || browser.now() >= pending.expiresAt
          || pending.expiresAt - pending.createdAt > 600000
          || values.get('loginAttemptId') !== pending.attemptId) {
          throw new Error('이 탭에서 시작한 카카오 로그인 정보가 없거나 만료됐어요. 처음부터 다시 시작해 주세요.');
        }
        if (values.has('error')) {
          if (values.has('loginCode')) throw new Error('카카오 로그인 복귀 응답이 올바르지 않아요.');
          throw new Error(values.get('error') === 'login_cancelled' ? '카카오 로그인을 취소했어요.' : '카카오 인증 또는 회원 등록을 완료하지 못했어요. 백엔드 설정을 확인해 주세요.');
        }
        const loginCode = values.get('loginCode');
        if (!loginCode || !TOKEN.test(loginCode)) throw new Error('카카오 로그인 교환 코드가 올바르지 않아요. 처음부터 다시 시작해 주세요.');
        const response = await post('/api/v1/auth/kakao/exchange', {
          loginCode, codeVerifier: pending.verifier, loginAttemptId: pending.attemptId,
        }, origin);
        return parseLoginResponse(response);
      })();
      return completion;
    },
  };
}

let webFlow: ReturnType<typeof createKakaoFlow> | undefined;
/** 세션이 AuthContext로 전달된 후 서비스의 중복 방지 Promise가 토큰을 계속 붙잡지 않게 합니다. */
export function clearKakaoWebFlow(): void { webFlow = undefined; }

/** 실제 PC 브라우저에서만 로컬 웹 흐름을 엽니다. 네이티브 성공을 흉내 내지 않습니다. */
export function getKakaoWebFlow() {
  if (typeof window === 'undefined' || !window.location || !window.crypto?.subtle) {
    throw new Error('이번 카카오 테스트는 PC 브라우저에서 진행해 주세요. localhost:3001로 접속하면 실제 계정으로 로그인할 수 있어요.');
  }
  let storage: Storage;
  try { storage = window.sessionStorage; } catch { throw new Error('브라우저의 탭 저장소가 차단돼 있어요. 저장소 사용을 허용한 PC 브라우저에서 다시 시도해 주세요.'); }
  webFlow ??= createKakaoFlow({ storage, crypto: window.crypto, fetch: (...args) => fetch(...args),
    now: Date.now, currentUrl: () => window.location.href,
    replaceUrl: cleanUrl => window.history.replaceState(window.history.state, '', cleanUrl), navigate: url => window.location.assign(url) });
  return webFlow;
}
