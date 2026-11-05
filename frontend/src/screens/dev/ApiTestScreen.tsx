/**
 * 별도 작업 브랜치에서 공개 health와 현재 사용자의 학습 이력 GET을 수동 확인합니다.
 * 성공 응답만 화면에 표시하며 기록을 생성하거나 더미 학습 콘텐츠를 공급하지 않습니다.
 */
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Heading, Notice } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import { useAuth } from '../../context/AuthContext';
import { getApiBaseUrl, getAuthenticatedApiBaseUrl, getBackendHealth, getLearningHistory, type BackendHealth, type LearningHistoryPage } from '../../services/apiSmoke';

const statusLabels = { IN_PROGRESS: '진행 중', PASSED: '통과', FAILED: '실패', ABANDONED: '중단' };

export default function ApiTestScreen() {
  const { session } = useAuth();
  const pending = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState<'health' | 'history' | null>(null);
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [history, setHistory] = useState<LearningHistoryPage | null>(null);
  const [error, setError] = useState('');
  let address: string;
  try { address = getApiBaseUrl(); } catch (cause) { address = cause instanceof Error ? cause.message : '서버 주소를 지정해 주세요.'; }
  let authenticationNotice = '';
  try { getAuthenticatedApiBaseUrl(); } catch (cause) { authenticationNotice = cause instanceof Error ? cause.message : 'HTTPS 도메인을 확인해 주세요.'; }
  useEffect(() => () => { pending.current?.abort(); }, []);

  // 요청 중 중복 실행을 막고 화면을 떠난 후에는 늦게 도착한 결과를 표시하지 않습니다.
  const check = async (kind: 'health' | 'history') => {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(kind); setError('');
    if (kind === 'health') setHealth(null); else setHistory(null);
    try {
      if (kind === 'health') {
        const result = await getBackendHealth(controller.signal);
        if (!controller.signal.aborted) setHealth(result);
      } else {
        const result = await getLearningHistory(session?.accessToken || '', controller.signal);
        if (!controller.signal.aborted) setHistory(result);
      }
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '요청에 실패했어요.');
    } finally {
      if (!controller.signal.aborted) setBusy(null);
      pending.current = null;
    }
  };

  return <Screen title="API 연동 테스트" onBack={() => router.replace(session ? '/home' : '/')}>
    <Notice>개발 전용 · GET 조회만 수행합니다. 서버에 새 학습 기록을 저장하지 않습니다.</Notice>
    <Body>{address}</Body>
    <Heading>백엔드 연결</Heading>
    <LerenButton title="서버 연결 확인" onPress={() => { void check('health'); }} loading={busy === 'health'} disabled={busy !== null} />
    {health && <Notice tone="success">실제 /health 응답: {health.status} · {health.timestamp}{'\n'}프로세스 응답만 확인했어요. 데이터베이스 준비 상태와 배포 커밋은 별도 확인이 필요합니다.</Notice>}
    <Heading>내 학습 이력</Heading>
    <Body muted>기존 계정으로 로그인한 세션을 사용합니다. 첫 페이지 10건만 가져옵니다.</Body>
    <LerenButton title="실제 학습 이력 가져오기" onPress={() => { void check('history'); }} loading={busy === 'history'} disabled={!session || !!authenticationNotice || busy !== null} />
    {!!authenticationNotice && <Notice>{authenticationNotice}</Notice>}
    {!session && !authenticationNotice && <LerenButton title="기존 계정으로 로그인" variant="secondary" onPress={() => router.push('/login')} />}
    {history && <>
      <Notice tone="success">서버 조회 성공 · 전체 {history.total}건 · 현재 페이지 {history.items.length}건</Notice>
      {history.items.length === 0 && <Body>서버에 저장된 학습 이력이 없습니다.</Body>}
      {history.items.map(item => <Notice key={item.recordId}>{item.stageTitle || '스테이지 정보 없음'} · {statusLabels[item.status]}{'\n'}{item.learningDate || '학습일 없음'} · 제출 {item.submittedCount}개 / 정답 {item.correctCount}개</Notice>)}
    </>}
    {!!error && <Notice tone="error">{error}</Notice>}
    <Notice>현재 확인한 백엔드에는 학습 카탈로그 조회 API가 연결되어 있지 않습니다. 탐험·퀴즈 콘텐츠 연동은 해당 API 계약 확정 후 진행합니다.</Notice>
  </Screen>;
}
