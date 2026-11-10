/** 상태 조회와 실제 AI 생성 요청을 구분합니다. 생성은 정확히 true로 설정한 경우에만 허용합니다. */
const GENERATION_PATHS = new Set([
  '/api/v1/tutor/messages',
  '/api/v1/questions/generate',
  '/internal/v1/tutor/answer',
  '/internal/v1/questions/generate',
]);

export class AiGenerationDisabledError extends Error {
  readonly code = 'AI_GENERATION_DISABLED';
  constructor() {
    super('현재는 AI 연결 확인 모드입니다. 질문·문제 생성 요청은 비활성화되어 있어요.');
    this.name = 'AiGenerationDisabledError';
  }
}

/** 누락·대소문자·공백·다른 참값 표현을 활성화로 해석하지 않습니다. */
export function isAiGenerationEnabled(): boolean {
  return process.env.EXPO_PUBLIC_AI_REQUESTS_ENABLED === 'true';
}

/** 실제 fetch 직전에 호출합니다. 조회·대화방 생성 등 기존 Node API는 그대로 허용합니다. */
export function assertAiRequestAllowed(path: string, method = 'GET'): void {
  const pathname = new URL(path, 'https://policy.invalid').pathname.replace(/\/+$/, '');
  if (method.toUpperCase() === 'POST' && GENERATION_PATHS.has(pathname) && !isAiGenerationEnabled()) {
    throw new AiGenerationDisabledError();
  }
}
