/**
 * 이메일과 비밀번호를 백엔드에 보내 로그인합니다.
 * 서버 주소는 프론트 .env에서 읽고, 발급받은 토큰은 호출한 곳에 반환합니다.
 */

export interface LoginResult {
  user: {
    userId: string;
    nickname: string;
    email: string | null;
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

    if (!body.data.accessToken || !body.data.user?.userId) {
      throw new Error('서버의 로그인 응답 형식을 확인해 주세요.');
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