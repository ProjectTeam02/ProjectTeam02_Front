/** 코스튬 상점: 직업별 필터, 상품 상세, 코인 확인, 구매 확인 UI를 제공합니다. 실제 구매 API 연결 전에는 코인을 차감하지 않습니다. */
import { useState } from 'react';
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Chip, Heading, Notice, Row } from '../../components/ui/Primitives';
import { ApiStatus, Unconnected } from '../../components/ui/ApiStatus';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import LerenCharacter from '../../components/common/LerenCharacter';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { COSTUMES, HEROES, type HeroJob } from './heroCatalog';

type Costume = (typeof COSTUMES)[number];
type Filter = 'all' | HeroJob;

export default function CostumeShopScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Costume | null>(null);
  const [confirm, setConfirm] = useState(false);
  const profile = useBackendProfile();
  const member = profile.data;
  const balance = member?.coinBalance ?? null;
  const costumes = COSTUMES.filter(item => filter === 'all' || item.job === filter);
  const insufficient = selected !== null && balance !== null && selected.price > balance;
  const close = () => { setSelected(null); setConfirm(false); };
  const open = (item: Costume) => { setSelected(item); setConfirm(false); };

  if (selected) return <Screen title="코스튬 상세" back tabs onBack={confirm ? () => setConfirm(false) : close}>
    <LerenCard variant="info">
      <LerenCharacter source={HEROES[selected.job].image} size={120} accessibilityLabel={selected.title} />
      <Heading>{selected.title}</Heading>
      <Body muted>{HEROES[selected.job].name} 코스튬</Body>
      <Body>{selected.description}</Body>
    </LerenCard>
    <LerenCard title={`상품 가격: ${selected.price.toLocaleString()} 코인`} description={`현재 보유 코인: ${balance?.toLocaleString() ?? '데이터 없음'}`} />
    {insufficient ? <>
      <Notice tone="error">코인이 {(selected.price - balance!).toLocaleString()}개 부족합니다. 학습을 완료하고 코인을 모아주세요.</Notice>
      <LerenButton title="학습하러 가기" onPress={() => router.push('/explore')} />
      <LerenButton title="다른 코스튬 보기" variant="secondary" onPress={close} />
    </> : selected.price === 0 ? <>
      <Notice>기본 코스튬 미리보기입니다. 실제 보유 여부와 장착 가능 여부는 서버 정보로 확인해야 합니다.</Notice>
      <LerenButton title="보유 코스튬 확인" onPress={() => router.push('/wardrobe')} />
    </> : confirm ? <>
      <LerenCard variant="reward" title="이 코스튬을 구매할까요?" description={`${selected.title} · ${selected.price.toLocaleString()} 코인`}>
        <Body>구매 후 예상 잔액: {balance === null ? '확인 불가' : `${(balance - selected.price).toLocaleString()} 코인`}</Body>
      </LerenCard>
      <Unconnected>실제 구매 API가 없어 구매를 확정할 수 없습니다. 코인은 차감되지 않습니다.</Unconnected>
      <LerenButton title="구매 기능 준비 중" disabled />
      <LerenButton title="취소" variant="secondary" onPress={() => setConfirm(false)} />
    </> : <>
      {balance === null && <Notice>실제 코인 잔액을 확인할 수 없어 구매 가능 여부를 판단할 수 없습니다.</Notice>}
      <Notice>현재 상품은 디자인용 데이터입니다. 실제 상품 목록·구매 API는 아직 연결되지 않았습니다.</Notice>
      <LerenButton title={`${selected.price.toLocaleString()} 코인으로 구매하기`} disabled={balance === null} onPress={() => setConfirm(true)} />
      <LerenButton title="다른 코스튬 보기" variant="secondary" onPress={close} />
    </>}
    <LerenButton title="상점 목록으로 돌아가기" variant="secondary" onPress={close} />
  </Screen>;

  return <Screen title="코스튬 상점" back tabs>
    <ApiStatus resource={profile} label="보유 코인" />
    <LerenCard variant="info" title={`보유 코인 ${balance?.toLocaleString() ?? '데이터 없음'}`} description="학습 보상으로 모은 코인으로 영웅을 꾸며보세요." />
    <Row>{([['전체', 'all'], ['검사', 'warrior'], ['마법사', 'mage'], ['궁수', 'archer']] as const).map(([label, value]) => <Chip key={value} label={label} active={filter === value} onPress={() => setFilter(value)} />)}</Row>
    <Heading>코스튬 목록</Heading>
    {costumes.length === 0 && <Notice>선택한 직업의 코스튬이 아직 없습니다.</Notice>}
    {costumes.map(item => <LerenCard key={item.id} title={item.title} description={`${HEROES[item.job].name} · ${item.price === 0 ? '기본 코스튬' : `${item.price.toLocaleString()} 코인`}`}>
      <LerenCharacter source={HEROES[item.job].image} size={88} accessibilityLabel={item.title} />
      <Body muted>{item.description}</Body>
      <LerenButton title="자세히 보기" variant="secondary" onPress={() => open(item)} />
    </LerenCard>)}
    <LerenButton title="보유 코스튬 보기" variant="secondary" onPress={() => router.push('/wardrobe')} />
    <Unconnected>코스튬 목록은 디자인용 데이터입니다. 실제 상품 조회·구매·장착 API는 아직 연결되지 않았습니다.</Unconnected>
  </Screen>;
}