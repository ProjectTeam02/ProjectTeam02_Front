/** 구매 API가 연결되기 전에는 잔액 차감이나 구매 완료를 표시하지 않습니다. */
import Screen from '../../components/ui/Screen';
import { Unconnected } from '../../components/ui/ApiStatus';

export default function CostumeShopScreen() {
  return <Screen title="코스튬 상점" back tabs><Unconnected>상품 목록·구매 API가 아직 연결되지 않았습니다. 준비되면 실제 상품과 잔액을 확인할 수 있습니다.</Unconnected></Screen>;
}
