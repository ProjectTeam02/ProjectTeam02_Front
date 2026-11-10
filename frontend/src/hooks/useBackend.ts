/** 계정·조회 조건이 바뀌면 지난 데이터를 숨기고 이전 요청을 취소합니다. 저장 요청은 자동 재시도하지 않습니다. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BackendError, backendRequest, type Decoder } from '../services/backend';
export type ApiResource<T> = { status: 'idle' | 'loading' | 'success' | 'error'; data: T | null; error: string; errorCode?: string; httpStatus?: number; reload: () => void };
export function useBackend<T>(path: string | null, decode: Decoder<T>): ApiResource<T> {
  const { session } = useAuth();
  const token = session?.accessToken;
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ key: string; token: string; data: T | null; error: string; errorCode?: string; httpStatus?: number } | null>(null);
  const key = `${path}:${version}`;
  useEffect(() => {
    if (!path || !token) return;
    const controller = new AbortController();
    backendRequest(token, path, decode, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setResult({ key, token, data, error: '' });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setResult({ key, token, data: null, error: error instanceof Error ? error.message : '요청에 실패했습니다.', errorCode: error instanceof BackendError ? error.code : undefined, httpStatus: error instanceof BackendError ? error.status : undefined });
    });
    return () => controller.abort();
  }, [path, decode, key, token]);
  const reload = useCallback(() => setVersion(v => v + 1), []);
  if (!path || !token) return { status: 'idle', data: null, error: '', reload };
  if (result?.key !== key || result.token !== token) return { status: 'loading', data: null, error: '', reload };
  return { status: result.error ? 'error' : 'success', data: result.data, error: result.error, errorCode: result.errorCode, httpStatus: result.httpStatus, reload };
}

/** 연속 클릭을 즉시 막고 화면 이탈 이후에는 저장 결과를 반영하지 않습니다. */
export function useBackendAction() {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => { pending.current?.abort(); }, [session]);
  const run = async <T,>(path: string, decode: Decoder<T>, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown, idempotencyKey?: string): Promise<T | null> => {
    if (pending.current || !session) return null;
    const controller = new AbortController(); pending.current = controller; setBusy(true); setError('');
    try { const data = await backendRequest(session.accessToken, path, decode, { method, body, signal: controller.signal, idempotencyKey }); return controller.signal.aborted ? null : data; }
    catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '저장 요청에 실패했습니다.'); return null; }
    finally { pending.current = null; if (!controller.signal.aborted) setBusy(false); }
  };
  return { busy, error, run };
}
