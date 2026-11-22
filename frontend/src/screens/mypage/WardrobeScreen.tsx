/** 서버에서 보유 코스튬을 조회하고 선택한 코스튬을 장착합니다. */
import { useState } from 'react';
import LerenCharacter from '../../components/common/LerenCharacter';
import { getCostumeImage } from '../../constants/costumeImages';
import { heroImage } from '../../constants/heroImage';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { ApiStatus } from '../../components/ui/ApiStatus';
import { Body, Empty, LinkRow, Notice, Row } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import { useBackend, useBackendAction } from '../../hooks/useBackend';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { COSTUME_PATHS, inventoryDecoder, equipDecoder, equipCostumePath, type Costume } from '../../services/costumeApi';

export default function WardrobeScreen() {
  const profile = useBackendProfile();
  const inventory = useBackend(COSTUME_PATHS.inventory, inventoryDecoder);
  const action = useBackendAction();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [confirmItem, setConfirmItem] = useState<Costume | null>(null);

  const equip = (item: Costume) => {
    if (action.busy || pendingItemId || inventory.data?.equipped.some(row => row.itemId === item.itemId)) return;
    setConfirmItem(item);
  };
  const confirmEquip = async (item: Costume) => {
    if (action.busy || pendingItemId) return;
    setConfirmItem(null);
    setPendingItemId(item.itemId); setMessage('');
    try {
      const result = await action.run(equipCostumePath(item.itemId), equipDecoder, 'PUT');
      if (result) { setMessage(`${item.name} 장착이 완료되었습니다.`); inventory.reload(); profile.reload(); }
    } finally { setPendingItemId(null); }
  };

  const equippedOutfit = inventory.data?.items.find(item => inventory.data?.equipped.some(row => row.itemId === item.itemId));
  const previous = confirmItem && inventory.data?.items.find(i => inventory.data?.equipped.some(e => e.category === confirmItem.category && e.itemId === i.itemId));
  const portrait = getCostumeImage(equippedOutfit?.costumeCode ?? '', equippedOutfit?.name ?? undefined) ?? heroImage(profile.data?.characterClass);
  return <Screen title="내 옷장" back tabs>
    <ConfirmDialog visible={confirmItem !== null} title="코스튬 장착" message={confirmItem ? `${confirmItem.name}을(를) 장착할까요?` : ''} confirmLabel="장착하기" busy={action.busy || pendingItemId !== null} onCancel={() => setConfirmItem(null)} onConfirm={() => { if (confirmItem) void confirmEquip(confirmItem); }}>
      {confirmItem && <Row><LerenCard title="현재" style={{ flex: 1 }}><LerenCharacter source={getCostumeImage(previous?.costumeCode ?? '', previous?.name ?? undefined) ?? heroImage(profile.data?.characterClass)} size={72} /><Body>{previous?.name ?? '기본 모습'}</Body></LerenCard>
        <LerenCard title="장착 후" style={{ flex: 1 }}><LerenCharacter source={getCostumeImage(confirmItem.costumeCode, confirmItem.name)} size={72} /><Body>{confirmItem.name}</Body></LerenCard></Row>}
    </ConfirmDialog>
    <ApiStatus resource={profile} label="직업 조회" />
    {profile.data && <LerenCard title={profile.data.characterClass?.name ?? '직업 데이터 없음'}
      description={profile.data.equippedCostumes.map(item => item.name ?? '코스튬').join(', ') || '현재 장착한 코스튬이 없어요.'} variant="info">
      {portrait && <LerenCharacter source={portrait} size={125} accessibilityLabel="현재 장착 모습" />}
    </LerenCard>}
    <LinkRow title="직업 변경" subtitle="검사·마법사·궁수 중 직업 선택"
       onPress={() => router.push('/jobs')} />
    <ApiStatus resource={inventory} label="보유 코스튬" empty={inventory.data?.items.length === 0} />
    {!!message && <Notice tone="success">{message}</Notice>}
    {!!action.error && <Notice tone="error">장착 실패: {action.error}</Notice>}
    {inventory.data?.items.length === 0 && <Empty title="보유한 코스튬이 없어요"
      description="상점에서 코스튬을 구매하면 이곳에 표시됩니다." />}
    {inventory.data?.items.map(item => {
      const equipped = inventory.data?.equipped.some(row => row.itemId === item.itemId) ?? false;
      return <LerenCard key={item.itemId} title={item.name}
        description={item.description ?? '코스튬 설명이 없습니다.'}>
        <LerenCharacter source={getCostumeImage(item.costumeCode, item.name)} size={80} accessibilityLabel={item.name} />
        <LerenButton title={equipped ? '장착 중' : '장착하기'} variant={equipped ? 'secondary' : 'primary'}
          disabled={equipped || action.busy || pendingItemId !== null} loading={pendingItemId === item.itemId}
          onPress={() => equip(item)} />
      </LerenCard>;
    })}
    <LinkRow title="코스튬 상점" subtitle="새로운 코스튬 둘러보기" onPress={() => router.push('/shop')} />
  </Screen>;
}
