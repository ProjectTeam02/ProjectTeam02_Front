/** API 조회 성공·빈 데이터·실패·미연결을 같은 문구와 재시도 동작으로 구분합니다. */
import { Notice } from './Primitives';
import LerenButton from '../common/LerenButton';
import type { ApiResource } from '../../hooks/useBackend';
import { router } from 'expo-router';
export function ApiStatus<T>({ resource, label, empty = false }: { resource: ApiResource<T>; label: string; empty?: boolean }) {
  if (resource.status === 'idle') return <Notice>{label} · 로그인이 필요합니다.</Notice>;
  if (resource.status === 'loading') return <Notice>{label} · API 조회 중입니다.</Notice>;
  if (resource.status === 'error') {
    // 미구현 경로·통신 장애·인증 실패를 성공한 빈 조회와 섞지 않습니다.
    const unavailable = resource.errorCode === 'API_NOT_CONNECTED';
    const failure = unavailable ? 'API 미연결' : resource.errorCode === 'NETWORK_ERROR' ? '서버 연결 실패' : resource.errorCode === 'TIMEOUT' ? '서버 응답 시간 초과' : resource.httpStatus === 401 ? '로그인 필요' : 'API 요청 실패';
    return <><Notice tone={unavailable ? 'info' : 'error'}>{label} · {failure}: {resource.error}</Notice>{resource.httpStatus === 401 && <LerenButton title="로그인 화면 열기" onPress={() => router.push('/login')} />}<LerenButton title={`${label} 다시 조회`} variant="secondary" onPress={resource.reload} /></>;
  }
  return <><Notice tone="success">{label} · {empty ? 'API는 연결되었으나 실제 데이터가 없어 표시되지 않습니다.' : 'API 연결 및 조회에 성공했습니다.'}</Notice><LerenButton title={`${label} 새로고침`} variant="secondary" onPress={resource.reload} /></>;
}
export function Unconnected({ children }: { children: string }) { return <Notice>아직 미연결 · {children}</Notice>; }
