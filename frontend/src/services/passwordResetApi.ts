/** 파일 수정중임*/
/** 로그인하지 않은 사용자도 사용할 수 있는 비밀번호 재설정 API입니다. */
import { BackendError, object } from './backend.ts';
import { getAuthenticatedApiBaseUrl } from './apiConfig.ts';

const request = async <T,>(path: string, body: Record<string, string>, decode: (value: unknown) => T): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${getAuthenticatedApiBaseUrl()}${path}`, {
      method: 'POST', redirect: 'error', signal: controller.signal,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = object(await response.json());
    if (!response.ok || payload.success !== true) throw new BackendError(
      typeof payload.message === 'string' ? payload.message : '비밀번호 재설정 요청에 실패했습니다.',
      response.status, typeof payload.code === 'string' ? payload.code : '',
    );
    return decode(payload.data);
  } catch (error) {
    if (error instanceof BackendError) throw error;
    throw new BackendError(controller.signal.aborted ? '서버 응답 시간이 초과되었습니다.' : '서버 연결에 실패했습니다.');
  } finally { clearTimeout(timer); }
};

export const requestPasswordReset = (email: string) => request('/api/v1/auth/password-reset/request', { email }, value => {
  const data = object(value);
  if (data.accepted !== true) throw new BackendError('재설정 요청 응답이 올바르지 않습니다.');
  return { accepted: true };
});

export const confirmPasswordReset = (resetToken: string, newPassword: string) =>
  request('/api/v1/auth/password-reset/confirm', { resetToken, newPassword }, value => {
    const data = object(value);
    if (data.reset !== true) throw new BackendError('비밀번호 변경 응답이 올바르지 않습니다.');
    return { reset: true };
  });
