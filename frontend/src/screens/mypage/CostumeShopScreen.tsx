/** 구매 API 없이 잔액을 차감하거나 구매 완료를 표시하지 않습니다. */
import Screen from '../../components/ui/Screen';
import { Unconnected } from '../../components/ui/ApiStatus';
import { useState } from 'react';
import LerenButton from '../../components/common/LerenButton';
import CostumeShopPreview from './CostumeShopPreview';
export default function CostumeShopScreen() { const [preview, setPreview] = useState(false); if (preview) return <CostumeShopPreview />; return <Screen title="코스튬 상점" back tabs><Unconnected>상품 목록·구매 API가 아직 없습니다. 서버 구매가 가능해지면 실제 상품과 잔액을 연결할 예정입니다.</Unconnected>{__DEV__ && <LerenButton title="상점 시안 보기 (서버 저장 안 됨)" variant="secondary" onPress={() => setPreview(true)} />}</Screen>; }
