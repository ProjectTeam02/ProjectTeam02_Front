/**
 * 피그마 24번 영웅·코스튬 화면입니다. 직업 선택, 보유 목록 필터, 미리보기와 장착을 처리합니다.
 * 직업 변경은 성장 기록을 지우지 않으며 장착 상태는 LearningProgressContext 메모리에만 저장됩니다.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import LerenCharacter from '../../components/common/LerenCharacter';
import Screen from '../../components/ui/Screen';
import { Body, Chip, LinkRow, Notice, Row } from '../../components/ui/Primitives';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useLearningProgress } from '../../context/LearningProgressContext';
import { costumesForJob, costumeTitle, HEROES, type HeroJob } from './heroCatalog';

export default function WardrobeScreen() {
  const { profile, setJob, ownedCostumes, equippedCostume, equipCostume } = useLearningProgress();
  const [changingJob, setChangingJob] = useState(false);
  const [selectedJob, setSelectedJob] = useState<HeroJob>(profile.job);
  const [preview, setPreview] = useState<string | null>(null);
  const [equippedOnly, setEquippedOnly] = useState(false);
  const [message, setMessage] = useState('');
  const catalog = costumesForJob(profile.job);
  const costumes = catalog.filter(item => ownedCostumes.includes(item.id) && (!equippedOnly || item.id === equippedCostume));
  const selectedCostume = catalog.find(item => item.id === preview);

  const heroCard = (job: HeroJob, title: string, description: string) => <View style={styles.hero}><LerenCharacter source={HEROES[job].image} size={64} accessibilityLabel={HEROES[job].name} /><Text style={styles.heading}>{title}</Text><Text style={styles.small}>{description}</Text></View>;

  if (changingJob) return (
    <Screen title="직업 변경" back tabs onBack={() => setChangingJob(false)}>
      <LerenCard title="어떤 영웅과 함께할까요?" description="마음에 드는 직업을 골라 주세요." variant="info" />
      <Row>{(Object.keys(HEROES) as HeroJob[]).map(job => <Pressable key={job} onPress={() => setSelectedJob(job)} accessibilityRole="button" accessibilityState={{ selected: selectedJob === job }} style={[styles.job, selectedJob === job && styles.selectedJob]}><LerenCharacter source={HEROES[job].image} size={72} accessibilityLabel={HEROES[job].name} /><Text style={styles.jobLabel}>{HEROES[job].name}</Text></Pressable>)}</Row>
      <Body muted>직업을 바꿔도 완료한 학습과 성장 기록은 그대로예요.</Body>
      <LerenButton title={`${HEROES[selectedJob].name}로 변경하기`} onPress={() => { if (selectedJob !== profile.job) setJob(selectedJob); setChangingJob(false); setMessage(`${HEROES[selectedJob].name}로 직업을 변경했어요.`); }} />
      <LerenButton title="취소" variant="secondary" onPress={() => setChangingJob(false)} />
    </Screen>
  );

  if (selectedCostume) return (
    <Screen title="코스튬 미리보기" back tabs onBack={() => setPreview(null)}>
      {heroCard(selectedCostume.job, selectedCostume.title, equippedCostume === selectedCostume.id ? '현재 장착 중이에요.' : '보유 중 · 아직 장착하지 않았어요')}
      <LinkRow title="현재 장착" subtitle={costumeTitle(equippedCostume, profile.job)} onPress={() => setPreview(null)} />
      {selectedCostume.job !== profile.job && <Notice>이 코스튬은 {HEROES[selectedCostume.job].name} 전용이에요. 장착하면 직업도 함께 변경돼요.</Notice>}
      <LerenButton title={equippedCostume === selectedCostume.id ? '장착 중' : selectedCostume.job !== profile.job ? `${HEROES[selectedCostume.job].name}로 변경하고 장착` : '이 코스튬 장착하기'} disabled={equippedCostume === selectedCostume.id} onPress={() => { if (selectedCostume.job !== profile.job) setJob(selectedCostume.job); equipCostume(selectedCostume.id); setPreview(null); setMessage(`${selectedCostume.title}를 장착했어요.`); }} />
      <LerenButton title="보유 코스튬으로 돌아가기" variant="secondary" onPress={() => setPreview(null)} />
      <Body muted>미리보기는 피그마와 동일한 직업 캐릭터로 표시해요.</Body>
    </Screen>
  );

  return (
    <Screen title="나의 영웅" back tabs>
      {heroCard(profile.job, `${HEROES[profile.job].name} · ${costumeTitle(equippedCostume, profile.job)}`, '현재 함께 모험하는 영웅이에요.')}
      {!!message && <Notice tone="success">{message}</Notice>}
      <LinkRow title="현재 직업" subtitle={`${HEROES[profile.job].name} · 변경하기`} onPress={() => { setSelectedJob(profile.job); setChangingJob(true); }} />
      <Row><Chip label="보유 코스튬" active={!equippedOnly} onPress={() => setEquippedOnly(false)} /><Chip label="장착 중" active={equippedOnly} onPress={() => setEquippedOnly(true)} /></Row>
      {costumes.map(item => <LinkRow key={item.id} title={item.title} subtitle={item.id === equippedCostume ? '장착 중' : '보유 · 미리보기'} onPress={() => setPreview(item.id)} />)}
      <LerenButton title="코스튬 상점으로 이동" variant="secondary" onPress={() => router.push('/shop')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: COLORS.soft, padding: 16, borderRadius: 16, gap: 10 },
  heading: { ...TYPOGRAPHY.heading, color: COLORS.ink },
  small: { ...TYPOGRAPHY.small, color: COLORS.muted },
  job: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.line, gap: 8, overflow: 'hidden' },
  selectedJob: { borderColor: COLORS.primary, backgroundColor: COLORS.soft },
  jobLabel: { ...TYPOGRAPHY.label, color: COLORS.ink },
});
