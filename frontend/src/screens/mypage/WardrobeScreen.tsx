/** 현재 직업·장착 정보를 서버에서 조회하고 앱에 포함된 직업 이미지 미리보기로 이동합니다. */
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { ApiStatus, Unconnected } from '../../components/ui/ApiStatus';
import { LinkRow } from '../../components/ui/Primitives';
import LerenCard from '../../components/common/LerenCard';
import { useBackendProfile } from '../../context/BackendProfileContext';

export default function WardrobeScreen() {
  const profile = useBackendProfile();
  const member = profile.data;
  return <Screen title="직업·장착 코스튬" back tabs>
    <ApiStatus resource={profile} label="직업·장착 조회" empty={!!member && !member.characterClass && member.equippedCostumes.length === 0} />
    {member && <LerenCard title={member.characterClass?.name ?? '직업 데이터 없음'} description={member.equippedCostumes.map(item => item.name ?? '코스튬 이름 없음').join(', ') || '장착 코스튬 데이터 없음'} />}
    <LinkRow title="직업 미리보기" subtitle="검사·마법사·궁수 이미지 보기" onPress={() => router.push({ pathname: '/jobs', params: { preview: '1' } })} />
    <Unconnected>전체 보유 코스튬 조회·직업 변경·코스튬 장착은 아직 연결되지 않았습니다.</Unconnected>
  </Screen>;
}
