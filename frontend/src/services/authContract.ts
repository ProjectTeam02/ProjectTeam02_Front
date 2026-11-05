/** 이메일·카카오 로그인에서 공통으로 받는 세션 형식을 검증합니다. 응답을 임의의 사용자로 대체하지 않습니다. */
export interface LoginResult {
  user: {
    userId: string;
    nickname: string;
    email: string | null;
    level?: number;
    totalExp?: number;
    economyLevel?: number;
    economyExp?: number;
  };
  accessToken: string;
  refreshToken: string;
}

const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** 백엔드가 반환한 실제 토큰·사용자만 메모리 인증 상태로 받아들입니다. */
export function parseLoginResponse(body: unknown): LoginResult {
  if (!object(body) || body.success !== true || !object(body.data)) throw new Error('서버의 로그인 응답 형식이 올바르지 않아요.');
  const data = body.data;
  if (typeof data.accessToken !== 'string' || !data.accessToken || typeof data.refreshToken !== 'string' || !data.refreshToken
    || !object(data.user) || typeof data.user.userId !== 'string' || !data.user.userId || typeof data.user.nickname !== 'string'
    || !(data.user.email === null || typeof data.user.email === 'string')) throw new Error('서버의 로그인 응답 형식이 올바르지 않아요.');
  for (const field of ['level', 'totalExp', 'economyLevel', 'economyExp'] as const) {
    const value = data.user[field];
    const minimum = field === 'level' || field === 'economyLevel' ? 1 : 0;
    if (value !== undefined && (typeof value !== 'number' || !Number.isInteger(value) || value < minimum)) {
      throw new Error('서버의 성장 정보 형식을 확인해 주세요.');
    }
  }
  return data as unknown as LoginResult;
}
