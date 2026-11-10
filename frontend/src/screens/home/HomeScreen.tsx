/** 홈 요약은 실제 회원 응답만 사용하며, 정식 API와 개발용 학습 자료를 명확히 구분합니다. */
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Heading, LinkRow, Notice } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenCard from '../../components/common/LerenCard';
import { useBackendProfile } from '../../context/BackendProfileContext';
export default function HomeScreen() {
  const profile = useBackendProfile(); const p = profile.data;
  return <Screen title="홈" back={false} tabs>
    <ApiStatus resource={profile} label="내 회원 정보" />
    {p && <LerenCard variant="info"><Heading>{p.nickname}님, 오늘도 한 걸음!</Heading><Body>전체 레벨 {p.level ?? '데이터 없음'} · 경제 레벨 {p.economyLevel ?? '데이터 없음'}</Body><Body>완료 단계 {p.completedStageCount}개 · 보유 코인 {p.coinBalance?.toLocaleString() ?? '데이터 없음'}</Body><Body muted>직업: {p.characterClass?.name ?? '데이터 없음'}</Body></LerenCard>}
    <LinkRow title="경제 학습 시작하기" subtitle="주제·학습 내용·퀴즈" onPress={() => router.push('/explore')} />
    <LinkRow title="학습 통계·이력" subtitle="서버에 저장된 나의 기록" onPress={() => router.push('/statistics')} />
    <LinkRow title="학습 달력" subtitle="서버 기록·일정 조회" onPress={() => router.push('/calendar')} />
    <LinkRow title="API 연결 현황" subtitle="연결 결과와 준비 중인 기능" onPress={() => router.push('/connections')} />
    <Notice>학습 완료와 보상은 서버가 채점한 결과를 사용합니다. 복습 화면은 별도 미리보기입니다.</Notice>
  </Screen>;
}
