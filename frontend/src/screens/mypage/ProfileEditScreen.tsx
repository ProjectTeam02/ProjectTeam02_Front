/** 조회 가능한 프로필만 표시합니다. 닉네임 수정 API가 없어 로컬 변경을 서버 저장으로 안내하지 않습니다. */
import Screen from '../../components/ui/Screen';
import { ApiStatus, Unconnected } from '../../components/ui/ApiStatus';
import LerenCard from '../../components/common/LerenCard';
import { useBackendProfile } from '../../context/BackendProfileContext';
export default function ProfileEditScreen() { const profile = useBackendProfile(); return <Screen title="프로필" back tabs><ApiStatus resource={profile} label="프로필 조회" />{profile.data && <LerenCard title={profile.data.nickname} description={profile.data.email} />}<Unconnected>닉네임·프로필 수정 API가 없습니다. 현재 화면에서는 조회만 가능합니다.</Unconnected></Screen>; }
