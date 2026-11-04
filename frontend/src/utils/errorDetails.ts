/**
 * 화면에서 사용할 오류 정보 추출 유틸리티. 형태가 보장되지 않은 예외에서 문자열 코드·메시지·숫자 HTTP 상태만 읽습니다.
 */
export interface ErrorDetails {
  code?: string;
  message?: string;
  httpStatus?: number;
}

// null·문자열 등도 예외로 전달될 수 있어 객체인지 먼저 확인합니다.
function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

// 기존 화면이 사용하는 Error/response 형상을 안전하게 읽습니다. 최종 API 계약은 아닙니다.
export function getErrorDetails(error: unknown): ErrorDetails {
  const record = asRecord(error);
  // 일반 Error와 response.data를 가진 통신 오류를 함께 지원합니다.
  const response = asRecord(record?.response);
  const data = asRecord(response?.data);
  const directCode = typeof record?.code === 'string' ? record.code : undefined;

  // 직접 지정된 code를 우선하고, 없으면 서버 응답의 code를 사용합니다.
  return {
    code: directCode || (typeof data?.code === 'string' ? data.code : undefined),
    message: typeof record?.message === 'string' ? record.message : undefined,
    httpStatus: typeof response?.status === 'number' ? response.status : undefined,
  };
}
