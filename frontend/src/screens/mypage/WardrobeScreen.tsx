
/** 서버에서 보유 코스튬을 조회하고 선택한 코스튬을 장착합니다. */
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { CostumeArt, CostumeShowcase, CostumeTile, costumeGrid } from '../../components/game/CostumeDisplay';
import { heroImage } from '../../constants/heroImage';
import { getBasicCostumeJob, getBasicCostumeName, type BasicCostumeJob } from '../../constants/costumeImages';
import { useLearningQuery } from '../../hooks/useLearningQuery';
import Screen from '../../components/ui/Screen';
import { ApiStatus } from '../../components/ui/ApiStatus';
import { Body, Heading, Empty, LinkRow, Notice } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import { useBackendAction } from '../../hooks/useBackend';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { COSTUME_PATHS, inventoryDecoder, equipDecoder, equipCostumePath, type Costume } from '../../services/costumeApi';

function getCurrentJob(classCode?: string, name?: string): BasicCostumeJob | undefined {
  const value = `${classCode ?? ''} ${name ?? ''}`.toUpperCase();
  if (/WARRIOR|SWORD|FIGHTER|검사|전사/.test(value)) return 'warrior';
  if (/MAGE|WIZARD|MAGICIAN|마법사/.test(value)) return 'mage';
  if (/ARCHER|BOW|궁수/.test(value)) return 'archer';
  return undefined;
}

/** 서버 데이터는 유지하고 화면에 표시할 이름만 변경합니다. */
function displayCostume(item: Costume, currentJob?: BasicCostumeJob): Costume {
  const basicJob = getBasicCostumeJob(item.costumeCode, item.name, currentJob);
  return basicJob ? { ...item, name: getBasicCostumeName(basicJob) } : item;
}

export default function WardrobeScreen() {
  const profile = useBackendProfile();
  const inventory = useLearningQuery(COSTUME_PATHS.inventory, inventoryDecoder);
  const action = useBackendAction();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [confirmItem, setConfirmItem] = useState<Costume | null>(null);

  const job = profile.data?.characterClass;
  const currentJob = getCurrentJob(job?.classCode, job?.name);
  const items = (inventory.data?.items ?? []).map(item => displayCostume(item, currentJob));
  const equippedOutfit = items.find(item => inventory.data?.equipped.some(row => row.itemId === item.itemId));

  const equip = (item: Costume) => {
    if (action.busy || pendingItemId || inventory.data?.equipped.some(row => row.itemId === item.itemId)) return;
    setConfirmItem(item);
  };

  const confirmEquip = async (item: Costume) => {
    if (action.busy || pendingItemId) return;
    setPendingItemId(item.itemId); setMessage('');
    try {
      const result = await action.run(equipCostumePath(item.itemId), equipDecoder, 'PUT');
      if (result) { setConfirmItem(null); setMessage(`${item.name} 장착이 완료되었습니다.`); inventory.reload(); profile.reload(); }
    } finally { setPendingItemId(null); }
  };

  if (confirmItem) {
    const current = items.find(item => inventory.data?.equipped.some(slot => slot.category === confirmItem.category && slot.itemId === item.itemId));
    return <Screen title="코스튬 장착" tabs onBack={() => { if (!action.busy) setConfirmItem(null); }}>
      <CostumeArt item={confirmItem} fallback={heroImage(job)} size={150} height={211} />
      <Heading>{confirmItem.name}</Heading>
      <Body muted>{confirmItem.description ?? '모험을 시작할 때 입는 기본 의상이에요.'}</Body>
      <LerenCard title="이 코스튬으로 갈아입을까요?">
        <Body>현재 장착 · {current?.name ?? '기본 모습'}</Body>
        <Body>변경 후 · {confirmItem.name}</Body>
      </LerenCard>
      {!!action.error && <Notice tone="error">{action.error}</Notice>}
      <LerenButton title="장착하기" loading={action.busy} disabled={action.busy} onPress={() => void confirmEquip(confirmItem)} />
      <LerenButton title="취소" variant="secondary" disabled={action.busy} onPress={() => setConfirmItem(null)} />
    </Screen>;
  }

  return <Screen title="내 옷장" tabs>
    <ApiStatus resource={profile} label="직업 조회" />
    <ApiStatus resource={inventory} label="보유 코스튬" />
    {profile.data && inventory.data && <CostumeShowcase item={equippedOutfit} fallback={heroImage(job)}
      title={equippedOutfit?.name ?? '기본 모습'} description={job?.name} status={equippedOutfit ? '장착 중' : '현재 모습'} />}
    <LinkRow title="현재 직업" subtitle={(job?.name ?? '직업 선택') + ' · 변경하기'} onPress={() => router.push({ pathname: '/jobs', params: { from: 'wardrobe' } })} />
    {!!message && <Notice tone="success">{message}</Notice>}
    {inventory.data && <Heading>보유 코스튬 · {items.length}개</Heading>}
    {inventory.data?.items.length === 0 && <Empty title="보유한 코스튬이 없어요" description="상점에서 구매한 코스튬이 이곳에 표시돼요." />}
    <View style={costumeGrid.row}>{items.map(item => {
      const equipped = inventory.data?.equipped.some(slot => slot.itemId === item.itemId);
      return <CostumeTile key={item.itemId} item={item} equipped={equipped} label={equipped ? '장착 중' : '장착하기 ›'} onPress={() => equip(item)} />;
    })}</View>
    <LinkRow title="코스튬 상점" subtitle="새로운 코스튬 둘러보기" onPress={() => router.push('/shop')} />
  </Screen>;
}
