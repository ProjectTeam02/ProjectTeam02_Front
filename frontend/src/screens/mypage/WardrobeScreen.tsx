/** 회원 API가 제공하는 현재 직업·장착만 조회하며, 보유·변경 API는 없는 것으로 안내합니다. */
import Screen from '../../components/ui/Screen';
import { ApiStatus, Unconnected } from '../../components/ui/ApiStatus';
import LerenCard from '../../components/common/LerenCard';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { useState } from 'react';
import LerenButton from '../../components/common/LerenButton';
import WardrobePreview from './WardrobePreview';
export default function WardrobeScreen() { const profile = useBackendProfile(); const p = profile.data; const [preview, setPreview] = useState(false); if (preview) return <WardrobePreview />; return <Screen title="직업·장착 코스튬" back tabs><ApiStatus resource={profile} label="직업·장착 조회" empty={!!p && !p.characterClass && p.equippedCostumes.length === 0} />{p && <><LerenCard title={p.characterClass?.name ?? '직업 데이터 없음'} description={p.equippedCostumes.map(c => c.name ?? '코스튬 이름 없음').join(', ') || '장착 코스튬 데이터 없음'} /></>}<Unconnected>전체 보유 코스튬 조회·직업 변경·코스튬 장착 API는 없습니다. 현재 장착 정보만 회원 조회 API로 표시합니다.</Unconnected>{__DEV__ && <LerenButton title="꾸미기 시안 보기 (서버 저장 안 됨)" variant="secondary" onPress={() => setPreview(true)} />}</Screen>; }
