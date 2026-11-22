/** 실제 코스튬 상품 목록과 구매 API를 연결합니다. 구매·코인 차감은 서버 응답만 사용합니다. */
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../../constants/theme';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import * as Crypto from 'expo-crypto';
import Screen from '../../components/ui/Screen';
import { Body, Empty, Heading, LinkRow, Notice, Row } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import { useBackendAction } from '../../hooks/useBackend';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { COSTUME_PATHS, costumesDecoder, costumeDecoder, purchaseDecoder, inventoryDecoder, type Costume } from '../../services/costumeApi';
import { CostumeArt, CostumeTile, CostumeShowcase, costumeGrid } from '../../components/game/CostumeDisplay';
import { useLearningQuery } from '../../hooks/useLearningQuery';

export default function CostumeShopScreen() {
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ item: Costume; balance: number; spent: number | null } | null>(null);
  const [message, setMessage] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  const [confirmItem, setConfirmItem] = useState<Costume | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const request = useRef<{ itemId: string; requestId: string } | null>(null);
  const profile = useBackendProfile();
  const shop = useLearningQuery(`${COSTUME_PATHS.shop}?page=${page}&size=10`, costumesDecoder);
  const detail = useLearningQuery(detailId ? COSTUME_PATHS.detail(detailId) : null, costumeDecoder);
  const action = useBackendAction();
  // 공용 코스튬은 서버가 반환한 페이지의 상품을 모두 표시합니다.
  const displayedItems = shop.data?.items ?? [];
  const inventory = useLearningQuery(COSTUME_PATHS.inventory, inventoryDecoder);
  const totalPages = shop.data ? Math.ceil(shop.data.total / shop.data.size) : 0;

  const purchase = (item: Costume) => {
    if (action.busy || item.owned || item.priceCoin === null) return;
    const balance = profile.data?.coinBalance;
    if (balance === null || balance === undefined) { setNoticeError(true); setMessage('보유 코인을 확인한 뒤 다시 시도해 주세요.'); return; }
    if (balance < item.priceCoin) { setNoticeError(true); setMessage('구매에 필요한 코인이 부족합니다.'); return; }
    setConfirmItem(item);
  };

  const confirmPurchase = async (item: Costume) => {
    if (action.busy || pendingItemId) return;
    setConfirmItem(null);
    setNoticeError(false); setMessage(''); setPendingItemId(item.itemId);
    if (request.current?.itemId !== item.itemId) request.current = { itemId: item.itemId,
      requestId: `costume:${Crypto.randomUUID()}` };
    try {
      const result = await action.run(COSTUME_PATHS.purchase, purchaseDecoder, 'POST', request.current);
      if (result) {
        request.current = null;
        setReceipt({ item, balance: result.coinBalance, spent: item.priceCoin });
        shop.reload(); detail.reload(); inventory.reload(); profile.reload();
      }
    } finally { setPendingItemId(null); }
  };

  const balance = profile.data?.coinBalance;
  const item = detail.data;
  const missing = item?.priceCoin != null && balance != null ? Math.max(0, item.priceCoin - balance) : 0;
  const priceLabel = (product: Costume) => product.owned ? '보유 중' : product.priceCoin === null ? '구매 불가' : product.priceCoin.toLocaleString() + ' 코인';
  const [featured, ...others] = displayedItems;
  const dismiss = () => { setDetailId(null); setMessage(''); };
  if (receipt) return <Screen title="구매 완료" tabs onBack={() => setReceipt(null)}>
    <CostumeArt item={receipt.item} size={150} height={202} />
    <Heading>{receipt.item.name}</Heading><Body>내 옷장에 추가했어요.</Body>
    <LerenCard variant="reward">{receipt.spent !== null && <Body>사용한 코인 · {receipt.spent.toLocaleString()}개</Body>}
      <Body>남은 코인 · {receipt.balance.toLocaleString()}개</Body></LerenCard>
    <LerenButton title="내 옷장 보기" onPress={() => router.push('/wardrobe')} />
    <LerenButton title="상점으로" variant="secondary" onPress={() => { setReceipt(null); dismiss(); }} />
  </Screen>;
  return <Screen title={detailId ? '코스튬 상세' : '코스튬 상점'} tabs onBack={detailId ? dismiss : undefined}>
    <ConfirmDialog visible={!!confirmItem} title="코스튬을 구매할까요?" message={confirmItem?.name ?? ''} confirmLabel="구매하기" busy={action.busy || !!pendingItemId}
      onCancel={() => setConfirmItem(null)} onConfirm={() => { if (confirmItem) void confirmPurchase(confirmItem); }}>
      {confirmItem && <><CostumeArt item={confirmItem} size={88} height={100} />
        <Body>상품 가격 · {priceLabel(confirmItem)}</Body>
        {balance != null && confirmItem.priceCoin != null && <Body>구매 후 잔액 · {(balance - confirmItem.priceCoin).toLocaleString()} 코인</Body>}</>}
    </ConfirmDialog>
    <ApiStatus resource={profile} label="보유 코인" />
    {!!message && <Notice tone={noticeError ? 'error' : 'success'}>{message}</Notice>}
    {!!action.error && <Notice tone="error">{action.error}</Notice>}
    {detailId ? <>
      <ApiStatus resource={detail} label="코스튬 상세" />
      {item && <>
        <CostumeArt item={item} size={176} height={249} />
        <Heading>{item.name}</Heading>{!!item.description && <Body muted>{item.description}</Body>}
        {!!item.flavorText && <Body muted>{item.flavorText}</Body>}
        <LerenCard><Body>상품 가격 · {item.priceCoin == null ? '구매 불가' : item.priceCoin.toLocaleString() + ' 코인'}</Body>
          <Body>내 코인 · {balance?.toLocaleString() ?? '—'}</Body></LerenCard>
        {item.owned ? <LerenButton title="내 옷장 보기" onPress={() => router.push('/wardrobe')} />
          : missing > 0 ? <><LerenCard variant="reward" title={missing.toLocaleString() + '코인이 더 필요해요'} />
            <LerenButton title="탐험에서 코인 모으기" onPress={() => router.push('/explore')} /></>
          : <LerenButton title={item.priceCoin == null ? '구매 불가' : item.priceCoin.toLocaleString() + '코인으로 구매하기'} disabled={item.priceCoin == null || action.busy || !!pendingItemId} loading={action.busy} onPress={() => purchase(item)} />}
      </>}
      <LerenButton title="다른 코스튬 보기" variant="secondary" onPress={dismiss} />
    </> : <>
      <View style={s.balance}><Body>내 코인</Body><Heading>{balance?.toLocaleString() ?? '—'} 코인</Heading></View>
      <ApiStatus resource={shop} label="코스튬 상품 목록" />
      {shop.data && <View style={s.heading}><Heading>코스튬 컬렉션</Heading><Body muted>총 {shop.data.total}종</Body></View>}
      {featured && <CostumeShowcase item={featured} title={featured.name} description={featured.description ?? undefined} status={priceLabel(featured)} onPress={() => setDetailId(featured.itemId)} />}
      <View style={costumeGrid.row}>{others.map(product => <CostumeTile key={product.itemId} item={product} shop label={priceLabel(product)} onPress={() => setDetailId(product.itemId)} />)}</View>
      {shop.data?.total === 0 && <Empty title="판매 중인 코스튬이 없어요" />}
      {totalPages > 1 && <Row>
        <LerenButton title="이전" style={s.page} variant="secondary" disabled={page <= 1} onPress={() => setPage(v => v - 1)} />
        <LerenButton title={`다음 (${page}/${totalPages})`} style={s.page} variant="secondary" disabled={page >= totalPages} onPress={() => setPage(v => v + 1)} />
      </Row>}
      <LinkRow title="내 옷장" subtitle={inventory.data ? inventory.data.items.length + '개 보유' : '보유한 코스튬 보기'} onPress={() => router.push('/wardrobe')} />
    </>}
  </Screen>;
}
const s = StyleSheet.create({
  balance: { minHeight: 52, paddingHorizontal: 16, gap: 8, borderRadius: 12, backgroundColor: COLORS.soft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  page: { flex: 1, width: undefined },
});
