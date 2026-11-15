/** 실제 코스튬 상품 목록과 구매 API를 연결합니다. 구매·코인 차감은 서버 응답만 사용합니다. */
import { useRef, useState } from 'react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import * as Crypto from 'expo-crypto';
import Screen from '../../components/ui/Screen';
import { Body, Empty, Notice, Row } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import { useBackend } from '../../hooks/useBackend';
import { useBackendAction } from '../../hooks/useBackend';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { COSTUME_PATHS, costumesDecoder, purchaseDecoder, type Costume } from '../../services/costumeApi';

export default function CostumeShopScreen() {
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [confirmItem, setConfirmItem] = useState<Costume | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const request = useRef<{ itemId: string; requestId: string } | null>(null);
  const profile = useBackendProfile();
  const shop = useBackend(`${COSTUME_PATHS.shop}?page=${page}&size=10`, costumesDecoder);
  const action = useBackendAction();
  const totalPages = shop.data ? Math.ceil(shop.data.total / shop.data.size) : 0;

  const purchase = (item: Costume) => {
    if (action.busy || item.owned || item.priceCoin === null) return;
    const balance = profile.data?.coinBalance;
    if (balance === null || balance === undefined) { setMessage('보유 코인을 확인한 뒤 다시 시도해 주세요.'); return; }
    if (balance < item.priceCoin) { setMessage('구매에 필요한 코인이 부족합니다.'); return; }
    setConfirmItem(item);
  };

  const confirmPurchase = async (item: Costume) => {
    if (action.busy || pendingItemId) return;
    setConfirmItem(null);
    setMessage(''); setPendingItemId(item.itemId);
    if (request.current?.itemId !== item.itemId) request.current = { itemId: item.itemId,
      requestId: `costume:${Crypto.randomUUID()}` };
    try {
      const result = await action.run(COSTUME_PATHS.purchase, purchaseDecoder, 'POST', request.current);
      if (result) {
        request.current = null;
        setMessage(`${item.name} 구매가 완료되었습니다. 남은 코인: ${result.coinBalance.toLocaleString()}개`);
        shop.reload(); profile.reload();
      }
    } finally { setPendingItemId(null); }
  };

  return <Screen title="코스튬 상점" back tabs>
    <ConfirmDialog visible={confirmItem !== null} title="코스튬 구매" message={confirmItem ? `${confirmItem.name}\n가격: ${confirmItem.priceCoin?.toLocaleString()}코인\n구매하면 실제 코인이 차감됩니다.` : ''} confirmLabel="구매하기" busy={action.busy || pendingItemId !== null} onCancel={() => setConfirmItem(null)} onConfirm={() => { if (confirmItem) void confirmPurchase(confirmItem); }} />
    <ApiStatus resource={profile} label="보유 코인" />
    {profile.data && <LerenCard title={`보유 코인 ${profile.data.coinBalance?.toLocaleString() ?? '확인 불가'}개`}
      description="코스튬을 구매하면 서버에서 코인이 차감됩니다." variant="info" />}
    <ApiStatus resource={shop} label="코스튬 상품 목록" empty={shop.data?.total === 0} />
    {!!message && <Notice tone="success">{message}</Notice>}
    {!!action.error && <Notice tone="error">구매 요청 확인 필요: {action.error} 구매 내역을 확인하기 전에는 반복해서 구매하지 마세요.</Notice>}
    {shop.data?.total === 0 && <Empty title="판매 중인 코스튬이 없어요" description="새로운 코스튬이 등록되면 이곳에서 확인할 수 있어요." />}
    {shop.data?.items.map(item => <LerenCard key={item.itemId} title={item.name}
      description={`${item.description ?? '코스튬 설명이 없습니다.'}\n분류: ${item.category}\n가격: ${item.priceCoin === null ? '구매 불가' : `${item.priceCoin.toLocaleString()}코인`}`}>
      <Body muted>{item.owned ? '이미 보유한 코스튬' : '구매 가능한 코스튬'}</Body>
      <LerenButton title={item.owned ? '보유 중' : item.priceCoin === null ? '구매 불가' : '구매하기'}
        disabled={item.owned || item.priceCoin === null || action.busy || pendingItemId !== null || profile.data?.coinBalance == null}
        loading={pendingItemId === item.itemId} onPress={() => purchase(item)} />
    </LerenCard>)}
    {totalPages > 1 && <Row>
      <LerenButton title="이전" style={{ flex: 1, width: undefined }} variant="secondary"
        disabled={page <= 1} onPress={() => setPage(v => v - 1)} />
      <LerenButton title={`다음 (${page}/${totalPages})`} style={{ flex: 1, width: undefined }} variant="secondary"
        disabled={page >= totalPages} onPress={() => setPage(v => v + 1)} />
    </Row>}
  </Screen>;
}
