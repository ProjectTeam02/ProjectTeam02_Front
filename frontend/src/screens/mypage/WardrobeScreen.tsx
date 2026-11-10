/** 현재 직업·장착 정보만 서버에서 조회하며, 미구현 변경 기능은 안내합니다. */
import Screen from '../../components/ui/Screen';
import { ApiStatus, Unconnected } from '../../components/ui/ApiStatus';
import LerenCard from '../../components/common/LerenCard';
import { useBackendProfile } from '../../context/BackendProfileContext';

export default function WardrobeScreen() {
  const profile = useBackendProfile();
  const member = profile.data;
  return <Screen title="직업·장착 코스튬" back tabs>
    <ApiStatus resource={profile} label="직업·장착 조회" empty={!!member && !member.characterClass && member.equippedCostumes.length === 0} />
    {member && <LerenCard title={member.characterClass?.name ?? '직업 데이터 없음'} description={member.equippedCostumes.map(item => item.name ?? '코스튬 이름 없음').join(', ') || '장착 코스튬 데이터 없음'} />}
    <Unconnected>전체 보유 코스튬 조회·직업 변경·코스튬 장착은 아직 연결되지 않았습니다.</Unconnected>
  </Screen>;
}
