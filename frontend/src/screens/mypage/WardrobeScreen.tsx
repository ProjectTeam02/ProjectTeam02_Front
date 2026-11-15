/** 현재 직업·장착 정보를 서버에서 조회하고 앱에 포함된 직업 이미지 미리보기로 이동합니다. */
/*import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { ApiStatus, Unconnected } from '../../components/ui/ApiStatus';
import { LinkRow } from '../../components/ui/Primitives';
import LerenCard from '../../components/common/LerenCard';
import { useBackendProfile } from '../../context/BackendProfileContext';

export default function WardrobeScreen() {
  const profile = useBackendProfile();
  const member = profile.data;
  return <Screen title="직업·장착 코스튬" back tabs>
    <ApiStatus resource={profile} label="직업·장착 조회" empty={!!member && !member.characterClass && member.equippedCostumes.length === 0} />
    {member && <LerenCard title={member.characterClass?.name ?? '직업 데이터 없음'} description={member.equippedCostumes.map(item => item.name ?? '코스튬 이름 없음').join(', ') || '장착 코스튬 데이터 없음'} />}
    <LinkRow title="직업 미리보기" subtitle="검사·마법사·궁수 이미지 보기" onPress={() => router.push({ pathname: '/jobs', params: { preview: '1' } })} />
    <Unconnected>전체 보유 코스튬 조회·직업 변경·코스튬 장착은 아직 연결되지 않았습니다.</Unconnected>
  </Screen>;
} */


/** 나의 영웅: 직업 선택·코스튬 미리보기. 실제 변경·장착은 API 연결 후 지원합니다. */
import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import Screen from '../../components/ui/Screen';
import { ApiStatus, Unconnected } from '../../components/ui/ApiStatus';
import { Body, Chip, LinkRow, Notice, Row } from '../../components/ui/Primitives';
import LerenCard from '../../components/common/LerenCard';
import LerenButton from '../../components/common/LerenButton';
import LerenCharacter from '../../components/common/LerenCharacter';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { HEROES, COSTUMES, type HeroJob } from './heroCatalog';
import { COLORS } from '../../constants/theme';

type Page = 'main' | 'job' | 'preview' | 'costume';
const JOBS: HeroJob[] = ['warrior', 'mage', 'archer'];

export default function WardrobeScreen() {
  const profile = useBackendProfile();
  const member = profile.data;
  const [page, setPage] = useState<Page>('main');
  const [job, setJob] = useState<HeroJob>('mage');
  const [costumeId, setCostumeId] = useState<string | null>(null);
  const [tab, setTab] = useState<'owned' | 'equipped'>('owned');
  const currentName = member?.characterClass?.name ?? null;
  const currentJob = JOBS.find(j => currentName?.includes(HEROES[j].name));
  const equipped = member?.equippedCostumes ?? [];
  const costume = COSTUMES.find(c => c.id === costumeId);
  const back = () => setPage(page === 'preview' ? 'job' : 'main');

  if (page === 'job' || page === 'preview') return <Screen title={page === 'job' ? '직업 변경' : '직업 미리보기'} back tabs onBack={back}>
    <Row style={s.jobs}>{JOBS.map(j => <Pressable key={j} onPress={() => { setJob(j); setPage('job'); }} style={[s.job, job === j && s.selected]}>
      <LerenCharacter source={HEROES[j].image} size={65} /><Body>{HEROES[j].name}</Body>
    </Pressable>)}</Row>
    <LerenCard variant="info" title={page === 'preview' ? `${HEROES[job].name} 선택 미리보기` : HEROES[job].name} description="직업을 선택하고 캐릭터 모습을 확인해 보세요.">
      {page === 'preview' && <LerenCharacter source={HEROES[job].image} size={110} />}
    </LerenCard>
    {page === 'preview' ? <>
      <LerenCard title="현재 서버 직업" description={currentName ?? '데이터 없음'} />
      <Unconnected>직업 변경 API가 없어 실제 직업은 변경되지 않습니다.</Unconnected>
      <LerenButton title="다른 직업 선택" variant="secondary" onPress={() => setPage('job')} />
      <LerenButton title="나의 영웅으로 돌아가기" onPress={() => setPage('main')} />
    </> : <>
      <LerenButton title={`${HEROES[job].name} 선택 확인`} onPress={() => setPage('preview')} />
      <LerenButton title="취소" variant="secondary" onPress={() => setPage('main')} />
    </>}
  </Screen>;

  if (page === 'costume') return <Screen title="코스튬 미리보기" back tabs onBack={back}>
    <LerenCard variant="info" title={costume?.title ?? '코스튬'} description={costume?.description ?? '디자인용 미리보기'}>
      <LerenCharacter source={HEROES[costume?.job ?? currentJob ?? 'mage'].image} size={120} />
    </LerenCard>
    <LerenCard title="현재 장착 코스튬" description={equipped.map(c => c.name ?? '이름 없음').join(', ') || '장착 정보 없음'} />
    <Notice>직업별 기본 캐릭터 이미지이며 실제 코스튬 착용 이미지는 아닙니다.</Notice>
    <Unconnected>코스튬 장착 API가 없어 실제 장착은 할 수 없습니다.</Unconnected>
    <LerenButton title="다른 코스튬 보기" variant="secondary" onPress={() => setPage('main')} />
    <LerenButton title="코스튬 상점으로 이동" onPress={() => router.push('/shop')} />
  </Screen>;

  return <Screen title="나의 영웅" back tabs>
    <ApiStatus resource={profile} label="직업·장착 조회" empty={!!member && !member.characterClass && equipped.length === 0} />
    <LerenCard variant="info" title={currentName ?? '현재 직업 데이터 없음'} description={equipped.map(c => c.name ?? '이름 없음').join(', ') || '장착 코스튬 정보 없음'}>
      {currentJob && <LerenCharacter source={HEROES[currentJob].image} size={100} />}
    </LerenCard>
    <LinkRow title="현재 직업" subtitle={`${currentName ?? '데이터 없음'} · 변경하기`} onPress={() => { setJob(currentJob ?? 'mage'); setPage('job'); }} />
    <Row>
      <Chip label="보유 코스튬" active={tab === 'owned'} onPress={() => setTab('owned')} />
      <Chip label="장착 중" active={tab === 'equipped'} onPress={() => setTab('equipped')} />
    </Row>
    {tab === 'owned' && <Notice>전체 보유 목록 API가 없어 현재 장착 정보만 표시합니다.</Notice>}
    {equipped.length ? equipped.map((c, i) => <LerenCard key={`${c.itemId}-${i}`} title={c.name ?? '코스튬 이름 없음'} description="서버에서 조회한 장착 코스튬" />) : <Notice>현재 장착 코스튬 정보가 없습니다.</Notice>}
    <Body>코스튬 디자인 미리보기</Body>
    {COSTUMES.map(c => <LinkRow key={c.id} title={c.title} subtitle={`${HEROES[c.job].name} · ${c.price.toLocaleString()} 코인 · 디자인 시안`} onPress={() => { setCostumeId(c.id); setPage('costume'); }} />)}
    <LerenButton title="코스튬 상점 둘러보기" variant="secondary" onPress={() => router.push('/shop')} />
    <Unconnected>보유 목록 조회·직업 변경·코스튬 장착 API는 아직 연결되지 않았습니다.</Unconnected>
  </Screen>;
}

const s = StyleSheet.create({
  jobs: { justifyContent: 'space-between', alignItems: 'stretch' },
  job: { flex: 1, alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, gap: 6 },
  selected: { backgroundColor: COLORS.soft, borderColor: COLORS.primary },
});