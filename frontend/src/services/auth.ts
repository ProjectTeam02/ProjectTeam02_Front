/**
 * 이메일과 비밀번호를 백엔드에 보내 로그인합니다.
 * 서버 주소는 프론트 .env에서 읽고, 발급받은 토큰은 호출한 곳에 반환합니다.
 */

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

interface LoginResponse {
  success: boolean;
  data?: LoginResult;
  message?: string;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');

  if (!baseUrl) {
    throw new Error('프론트 .env의 서버 주소를 확인해 주세요.');
  }

  // 서버가 응답하지 않으면 15초 뒤 요청을 종료합니다.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });

    const body: LoginResponse = await response.json();

    // 실패 응답은 화면에서 안내할 수 있도록 예외로 전달합니다.
    if (!response.ok || !body.success || !body.data) {
      throw new Error(body.message || '로그인 요청에 실패했습니다.');
    }

    if (typeof body.data.accessToken !== 'string' || !body.data.accessToken
      || typeof body.data.refreshToken !== 'string' || !body.data.refreshToken
      || typeof body.data.user?.userId !== 'string' || !body.data.user.userId
      || typeof body.data.user.nickname !== 'string'
      || (body.data.user.email !== null && typeof body.data.user.email !== 'string')) {
      throw new Error('서버의 로그인 응답 형식을 확인해 주세요.');
    }
    // 성장 값은 서버가 제공한 경우만 사용합니다. 잘못된 값을 예시 레벨/EXP로 감추지 않습니다.
    for (const field of ['level', 'totalExp', 'economyLevel', 'economyExp'] as const) {
      const value = body.data.user[field];
      const minimum = field === 'level' || field === 'economyLevel' ? 1 : 0;
      if (value !== undefined && (typeof value !== 'number' || !Number.isInteger(value) || value < minimum)) {
        throw new Error('서버의 성장 정보 형식을 확인해 주세요.');
      }
    }

    // 비밀번호와 토큰은 콘솔에 출력하지 않습니다.
    return body.data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('서버 응답 시간이 초과됐어요.');
    }
    if (error instanceof TypeError) {
      throw new Error('서버 연결을 확인해 주세요. Wi-Fi와 백엔드 실행 상태를 확인하세요.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/** 기존 서버의 로그아웃 API로 세션을 폐기합니다. 연결 실패 시 화면에서 재시도를 안내합니다. */
export async function logout(accessToken: string): Promise<void> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (!baseUrl) throw new Error('프론트 .env의 서버 주소를 확인해 주세요.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    // 만료·폐기된 토큰이면 앱에 남은 인증 상태도 정리할 수 있습니다.
    if (response.status === 401) return;
    const body: { success?: boolean; message?: string } = await response.json();
    if (!response.ok || body.success !== true) throw new Error(body.message || '로그아웃하지 못했어요. 다시 시도해 주세요.');
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('서버 응답 시간이 초과됐어요. 다시 시도해 주세요.');
    if (error instanceof TypeError) throw new Error('서버 연결을 확인하고 로그아웃을 다시 시도해 주세요.');
    throw error;
  } finally { clearTimeout(timeout); }
}
