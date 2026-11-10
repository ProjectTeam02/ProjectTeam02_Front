/** 앱 회원가입 입력을 실제 백엔드로 전송하고, 서버가 생성한 회원 정보만 반환합니다. */
import { getAuthenticatedApiBaseUrl } from './apiConfig.ts';
import { parseLoginResponse } from './authContract.ts';

export interface SignupValues {
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
}
export interface SignupAccount { userId: string; email: string | null; nickname: string }

/** 가입 완료를 서버의 201 응답으로 확인합니다. 비밀번호·토큰은 기록하거나 저장하지 않습니다. */
export async function signup(values: SignupValues): Promise<SignupAccount> {
  const baseUrl = getAuthenticatedApiBaseUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: values.email.trim(), password: values.password,
        passwordConfirm: values.passwordConfirm, nickname: values.nickname.trim() }),
      signal: controller.signal,
      redirect: 'error',
    });
    if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
      throw new Error('회원가입 서버가 올바른 JSON을 반환하지 않았어요. 서버 주소를 확인해 주세요.');
    }
    let body: unknown;
    try { body = await response.json(); } catch { throw new Error('회원가입 서버 응답을 읽지 못했어요. 다시 확인해 주세요.'); }
    if (response.status === 409) throw new Error('이미 가입된 이메일입니다. 로그인하거나 다른 이메일을 입력해 주세요.');
    if (!response.ok || response.status !== 201) {
      if (response.status === 422) throw new Error('입력한 이메일·비밀번호·닉네임을 확인해 주세요.');
      throw new Error(`회원가입을 완료하지 못했어요. 잠시 후 다시 시도해 주세요. (HTTP ${response.status})`);
    }
    const { user } = parseLoginResponse(body);
    // 가입 직후에는 완료 안내를 보여주고 명시적으로 로그인합니다. 응답 토큰은 보관하지 않습니다.
    return { userId: user.userId, email: user.email, nickname: user.nickname };
  } catch (cause) {
    if (controller.signal.aborted) throw new Error('회원가입 응답 시간이 초과됐어요. 가입이 처리됐을 수 있으니 로그인으로 확인해 주세요.');
    if (cause instanceof TypeError) throw new Error('회원가입 서버에 연결하지 못했어요. 서버 실행 상태와 네트워크를 확인해 주세요.');
    throw cause;
  } finally { clearTimeout(timeout); }
}
