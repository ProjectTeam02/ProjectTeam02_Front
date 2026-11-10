/** 실제 회원·성장·지갑·장착 조회를 표시합니다. null은 예시 레벨이나 코인으로 바꾸지 않습니다. */
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Heading, LinkRow, Notice } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import { useBackendProfile } from '../../context/BackendProfileContext';
import LerenCard from '../../components/common/LerenCard';
export default function MyPageScreen() {
  const profile = useBackendProfile(); const p = profile.data;
  return <Screen title="마이페이지" back tabs>
    <ApiStatus resource={profile} label="내 회원 정보" />
    {p && <><Heading>{p.nickname}</Heading><Body muted>{p.email}</Body>
      <LerenCard title={`전체 레벨 ${p.level ?? '데이터 없음'} · 경제 레벨 ${p.economyLevel ?? '데이터 없음'}`} description={`보유 코인 ${p.coinBalance?.toLocaleString() ?? '데이터 없음'} · 완료 단계 ${p.completedStageCount}개\n직업: ${p.characterClass?.name ?? '데이터 없음'}\n장착: ${p.equippedCostumes.map(c => c.name ?? '이름 없음').join(', ') || '장착 데이터 없음'}`} />
      {(p.level === null || p.coinBalance === null || p.characterClass === null || p.equippedCostumes.length === 0) && <Notice>API는 연결되었습니다. 성장·지갑·직업·장착 중 실제 값이 없는 항목은 ‘데이터 없음’으로 표시합니다.</Notice>}
    </>}
    <LinkRow title="학습 통계·이력" subtitle="실제 서버 기록 조회" onPress={() => router.push('/statistics')} />
    <LinkRow title="학습 달력" subtitle="기록과 예정 일정" onPress={() => router.push('/calendar')} />
    <LinkRow title="직업·장착 코스튬" subtitle="서버에 저장된 현재 장착 조회" onPress={() => router.push('/wardrobe')} />
    <LinkRow title="코스튬 상점" subtitle="구매 API 준비 중" onPress={() => router.push('/shop')} />
    <LinkRow title="프로필·설정" subtitle="알림 · 계정 관리" onPress={() => router.push('/settings')} />
    <LinkRow title="API 연결 현황" subtitle="연결 성공 · 데이터 없음 · 미연결 확인" onPress={() => router.push('/connections')} />
  </Screen>;
}
