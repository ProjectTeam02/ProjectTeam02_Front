/** 홈 요약은 실제 회원 응답만 사용하며, 정식 API와 개발용 학습 자료를 명확히 구분합니다. */
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Heading, LinkRow, Notice } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LearningContentState from '../../components/ui/LearningContentState';
import LerenCard from '../../components/common/LerenCard';
import { useBackendProfile } from '../../context/BackendProfileContext';
export default function HomeScreen() {
  const profile = useBackendProfile(); const p = profile.data;
  return <Screen title="홈" back={false} tabs>
    <ApiStatus resource={profile} label="내 회원 정보" />
    {p && <LerenCard variant="info"><Heading>{p.nickname}님, 오늘도 한 걸음!</Heading><Body>전체 레벨 {p.level ?? '데이터 없음'} · 경제 레벨 {p.economyLevel ?? '데이터 없음'}</Body><Body>완료 단계 {p.completedStageCount}개 · 보유 코인 {p.coinBalance?.toLocaleString() ?? '데이터 없음'}</Body><Body muted>직업: {p.characterClass?.name ?? '데이터 없음'}</Body></LerenCard>}
    <LinkRow title="실제 학습 문제" subtitle="승인된 문제 API 조회" onPress={() => router.push('/quiz')} />
    <LinkRow title="학습 통계·이력" subtitle="서버에 저장된 나의 기록" onPress={() => router.push('/statistics')} />
    <LinkRow title="학습 달력" subtitle="서버 기록·일정 조회" onPress={() => router.push('/calendar')} />
    <LinkRow title="API 연결 현황" subtitle="연결 결과와 준비 중인 기능" onPress={() => router.push('/connections')} />
    <Notice>개발용 학습 미리보기: 탐험 지도·개념·복습은 테스트 카탈로그를 사용합니다. 정식 학습 목록과 진행도 저장은 아직 미연결입니다.</Notice>
    <LearningContentState><LinkRow title="개발용 탐험 지도" subtitle="정식 데이터와 구분되는 시안" onPress={() => router.push('/explore')} /></LearningContentState>
    {__DEV__ && <LinkRow title="API 연동 테스트" subtitle="서버 연결·인증 진단" onPress={() => router.push('/api-test')} />}
  </Screen>;
}
