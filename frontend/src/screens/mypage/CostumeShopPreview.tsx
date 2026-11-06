/** 개발 시안 보존본: 아래 변경·채점·구매는 메모리 예시이며 서버 데이터에 반영되지 않습니다. */
/**
 * 피그마 25번 상점입니다. 직업별 필터, 상품 상세, 구매 확인·부족·완료 상태를 표시합니다.
 * 현금 결제는 없으며 예시 코인과 보유 목록만 LearningProgressContext에서 변경합니다.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import LerenCharacter from '../../components/common/LerenCharacter';
import Screen from '../../components/ui/Screen';
import { Body, Chip, Empty, LinkRow, Notice, Row } from '../../components/ui/Primitives';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useLearningProgress } from '../../context/LearningProgressContext';
import { costumesForJob, HEROES, type HeroJob } from './heroCatalog';

export default function CostumeShopScreen() {
  const { profile, setJob, ownedCostumes, buyCostume, equipCostume } = useLearningProgress();
  const [filter, setFilter] = useState<HeroJob | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [error, setError] = useState('');
  const catalog = costumesForJob(profile.job);
  const selected = catalog.find(item => item.id === selectedId);
  const filtered = catalog.filter(item => filter === 'all' || item.job === filter);

  // 모달 확인 후에만 코인을 사용합니다. 중복 구매와 잔액 검사는 공통 상태에서도 수행합니다.
  const purchase = () => {
    if (!selected) return;
    if (buyCostume(selected.id, selected.price)) { setConfirm(false); setPurchased(true); setError(''); }
    else { setConfirm(false); setError('코인이 부족해 구매하지 못했어요.'); }
  };
  const summary = (value: string, label: string) => <View style={styles.stat}><Text style={styles.value}>{value}</Text><Text style={styles.micro}>{label}</Text></View>;
  const previewCard = (job: HeroJob, title: string, description: string) => <View style={styles.hero}><LerenCharacter source={HEROES[job].image} size={64} accessibilityLabel={HEROES[job].name} /><Text style={styles.heading}>{title}</Text><Text style={styles.small}>{description}</Text></View>;
  // 전용 코스튬은 직업도 함께 변경해 표시 캐릭터와 장착 이름이 일치하게 합니다.
  const equipSelected = () => {
    if (!selected || !ownedCostumes.includes(selected.id)) return;
    if (selected.job !== profile.job) setJob(selected.job);
    equipCostume(selected.id);
    router.push('/wardrobe');
  };

  if (selected) {
    const owned = ownedCostumes.includes(selected.id);
    const insufficient = profile.coins < selected.price && !owned;
    return (
      <Screen preview title={purchased ? '구매 완료' : confirm ? '코스튬 구매' : '코스튬 상세'} back tabs onBack={() => { if (confirm) setConfirm(false); else { setSelectedId(null); setPurchased(false); setError(''); } }}>
        {previewCard(selected.job, selected.title, purchased ? '구매한 코스튬이 보유 목록에 추가되었어요.' : selected.description)}
        <Row>{summary(`${selected.price.toLocaleString()} 코인`, '가격')}{summary(`${profile.coins.toLocaleString()} 코인`, '내 코인')}</Row>
        {purchased ? <>
          <Notice tone="success">코스튬을 구매했어요!</Notice>
          {selected.job !== profile.job && <Notice>이 코스튬을 장착하면 직업도 {HEROES[selected.job].name}로 변경돼요.</Notice>}
          <LerenButton title={selected.job !== profile.job ? `${HEROES[selected.job].name}로 변경하고 장착` : '바로 장착하기'} onPress={equipSelected} />
          <LerenButton title="보유 코스튬 보기" variant="secondary" onPress={() => router.push('/wardrobe')} />
        </> : owned ? <>
          <Notice>이미 보유하고 있는 코스튬이에요.</Notice>
          {selected.job !== profile.job && <Notice>이 코스튬을 장착하면 직업도 {HEROES[selected.job].name}로 변경돼요.</Notice>}
          <LerenButton title={selected.job !== profile.job ? `${HEROES[selected.job].name}로 변경하고 장착` : '장착하기'} onPress={equipSelected} />
        </> : confirm ? <LerenCard title="이 코스튬을 구매할까요?" description={`${selected.title} · ${selected.price.toLocaleString()} 코인\n구매 후 ${(profile.coins - selected.price).toLocaleString()} 코인이 남아요.`}>
          <LerenButton title="구매하기" onPress={purchase} />
          <LerenButton title="취소" variant="secondary" onPress={() => setConfirm(false)} />
        </LerenCard> : <>
          {(insufficient || !!error) && <Notice tone="error">{error || `${(selected.price - profile.coins).toLocaleString()} 코인이 더 필요해요. 학습을 완료하고 코인을 모아 보세요.`}</Notice>}
          <LerenButton title={insufficient ? '코인이 부족해요' : `${selected.price.toLocaleString()} 코인으로 구매`} disabled={insufficient} onPress={() => setConfirm(true)} />
          {insufficient && <LerenButton title="학습하러 가기" variant="secondary" onPress={() => router.push('/explore')} />}
        </>}
        <LerenButton title="상점 목록으로" variant="secondary" onPress={() => { setSelectedId(null); setConfirm(false); setPurchased(false); setError(''); }} />
      </Screen>
    );
  }

  return (
    <Screen preview title="코스튬 상점" back tabs>
      <Row>{summary(profile.coins.toLocaleString(), '보유 코인')}{summary(`${ownedCostumes.length}개`, '보유 코스튬')}</Row>
      <Row>{[{ id: 'all' as const, label: '전체' }, { id: 'warrior' as const, label: '검사' }, { id: 'mage' as const, label: '마법사' }, { id: 'archer' as const, label: '궁수' }].map(item => <Chip key={item.id} label={item.label} active={filter === item.id} onPress={() => setFilter(item.id)} />)}</Row>
      {filtered[0] && previewCard(filtered[0].job, filtered[0].title, filtered[0].description)}
      {filtered.map(item => <LinkRow key={item.id} title={item.title} subtitle={ownedCostumes.includes(item.id) ? '보유 중 · 장착하기' : `${item.price.toLocaleString()} 코인 · 자세히`} onPress={() => { setSelectedId(item.id); setError(''); }} />)}
      {filtered.length === 0 && <Empty title="준비 중인 코스튬이에요" description="새로운 영웅의 코스튬을 기다려 주세요." />}
      <LerenButton title="보유 코스튬 보기" variant="secondary" onPress={() => router.push('/wardrobe')} />
      <Body muted>구매에는 화면 확인용 코인을 사용해요.</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stat: { flex: 1, padding: 12, backgroundColor: COLORS.soft, borderRadius: 12, gap: 6 },
  value: { ...TYPOGRAPHY.heading, color: COLORS.primary },
  micro: { ...TYPOGRAPHY.micro, color: COLORS.muted },
  hero: { backgroundColor: COLORS.soft, padding: 16, borderRadius: 16, gap: 10 },
  heading: { ...TYPOGRAPHY.heading, color: COLORS.ink },
  small: { ...TYPOGRAPHY.small, color: COLORS.muted },
});