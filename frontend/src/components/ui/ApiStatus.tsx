/** API 조회 성공·빈 데이터·실패·미연결을 같은 문구와 재시도 동작으로 구분합니다. */
import { Notice } from './Primitives';
import LerenButton from '../common/LerenButton';
import type { ApiResource } from '../../hooks/useBackend';
import { router } from 'expo-router';
export function ApiStatus<T>({ resource, label, empty = false }: { resource: ApiResource<T>; label: string; empty?: boolean }) {
  if (resource.status === 'idle') return <Notice>{label} · 로그인이 필요합니다.</Notice>;
  if (resource.status === 'loading') return <Notice>{label} · API 조회 중입니다.</Notice>;
  if (resource.status === 'error') return <><Notice tone="error">{label} · API 요청 실패: {resource.error} 데이터 없음으로 처리하지 않았습니다.</Notice>{resource.httpStatus === 401 && <LerenButton title="로그인 화면 열기" onPress={() => router.push('/login')} />}<LerenButton title={`${label} 다시 조회`} variant="secondary" onPress={resource.reload} /></>;
  return <><Notice tone="success">{label} · {empty ? 'API는 연결되었으나 실제 데이터가 없어 표시되지 않습니다.' : 'API 연결 및 조회에 성공했습니다.'}</Notice><LerenButton title={`${label} 새로고침`} variant="secondary" onPress={resource.reload} /></>;
}
export function Unconnected({ children }: { children: string }) { return <Notice>아직 미연결 · {children}</Notice>; }
