/** 최근 학습 지역의 실제 진행도와 오늘의 활동을 홈에 모읍니다. */
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Heading, LinkRow, Progress, Row } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import LerenCharacter from '../../components/common/LerenCharacter';
import { heroImage } from '../../constants/heroImage';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { useLearningQuery } from '../../hooks/useLearningQuery';
import { PATHS, historyDecoder, monthDecoder } from '../../services/backend';
import { activeProgressDecoder, LEARNING_PATHS, stagesDecoder, topicsDecoder } from '../../services/learningApi';

export default function HomeScreen() {
  const progress = useLearningQuery(LEARNING_PATHS.active, activeProgressDecoder);
  const resume = progress.data?.[0];
  const profile = useBackendProfile();
  const p = profile.data;
  const history = useLearningQuery(PATHS.history + '?page=1&pageSize=1', historyDecoder);
  const topics = useLearningQuery(LEARNING_PATHS.topics, topicsDecoder);
  const first = topics.data?.items.find(t => t.topicNo === 1);
  const topicId = history.data && (history.data.items[0]?.topic?.topicId ?? first?.topicId);
  const stages = useLearningQuery(topicId ? LEARNING_PATHS.stages(topicId) : null, stagesDecoder);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const month = parts.find(v => v.type === 'year')?.value + '-' + parts.find(v => v.type === 'month')?.value;
  const calendar = useLearningQuery(PATHS.calendar + '?month=' + month, monthDecoder);
  const items = [...(stages.data?.items ?? [])].sort((a, b) => a.stageNo - b.stageNo);
  const next = items.find(s => s.isUnlocked && s.progressStatus !== 'PASSED');
  const done = items.filter(s => s.progressStatus === 'PASSED').length;
  const today = month + '-' + parts.find(v => v.type === 'day')?.value;
  const daily = calendar.data?.days.find(day => day.date === today);
  const continuing = next?.progressStatus === 'IN_PROGRESS';
  const firstLesson = !resume && !continuing && p?.completedStageCount === 0 && history.data?.total === 0;
  const portrait = heroImage(p?.characterClass);
  return <Screen title="홈" back={false} tabs>
    {p && <Row>{portrait && <LerenCharacter source={portrait} size={54} />}<Heading>{firstLesson ? '반가워요, ' + p.nickname + '님' : p.nickname + '님의 학습 홈'}</Heading></Row>}
    {p && <Body muted>{p.characterClass?.name} Lv.{p.level ?? '—'} · 경제 Lv.{p.economyLevel ?? '—'}</Body>}
    {resume ? <LerenCard variant="info" title="이어서 학습"><Heading>{resume.title ?? '진행 중인 단계'}</Heading>
      {!resume.boss && <Body>마지막으로 읽은 {resume.position}쪽</Body>}
      <LerenButton title={resume.boss ? '보스 전투 이어가기' : '학습 이어보기'} onPress={() => router.push({ pathname: resume.boss ? '/quiz' : '/lesson', params: { stageId: resume.stageId } })} />
    </LerenCard> : <LerenCard variant="info" title={stages.data ? (continuing ? '이어서 학습 · ' : firstLesson ? '첫 수업 · ' : '다음 학습 · ') + stages.data.topic.title : '경제 탐험'}>
      <Heading>{next?.title ?? '경제 대륙 지도'}</Heading>
      {!!items.length && <><Body>지역 진도 {done} / {items.length}단계</Body><Progress value={done / items.length} /></>}
      <LerenButton title={next ? continuing ? '학습 이어보기' : firstLesson ? '첫 학습 시작하기' : '다음 학습 시작하기' : '탐험 지도 열기'} onPress={() => next ? router.push({ pathname: '/lesson', params: { stageId: next.stageId } }) : router.push('/explore')} />
    </LerenCard>}
    {firstLesson && <><LerenCard title="첫 학습은 이렇게 진행돼요" description={'1  개념 읽기\n2  퀴즈 풀기\n3  결과와 보상 확인'} /><LinkRow title="내 캐릭터" subtitle="직업과 코스튬" onPress={() => router.push('/wardrobe')} /></>}
    {daily?.hasCompletedLearning && <LinkRow title="오늘의 학습 기록" subtitle={'오늘 완료한 학습 ' + daily.completedCount + '건'} onPress={() => router.push('/calendar')} />}
    <Heading>오늘의 현황</Heading><Row>
      <LerenCard title={calendar.data ? calendar.data.streakDays + '일' : '—'} description="연속 학습" style={{ flex: 1 }} />
      <LerenCard title={calendar.data ? (daily?.scheduledCount ?? 0) + '건' : '—'} description="오늘의 일정" style={{ flex: 1 }} />
      <LerenCard title={p?.coinBalance?.toLocaleString() ?? '—'} description="보유 코인" style={{ flex: 1 }} />
    </Row>
    {p && <Body muted>지금까지 완료한 단계 {p.completedStageCount}개</Body>}
    <Heading>학습 바로가기</Heading>
    <LinkRow title="오늘의 복습" subtitle="오답과 헷갈린 문제" onPress={() => router.push('/review')} />
    <LinkRow title="학습 달력" subtitle="이번 달 기록과 일정" onPress={() => router.push('/calendar')} />
    <LinkRow title="전체 탐험 지도" subtitle="학습 지역 둘러보기" onPress={() => router.push('/explore')} />
    <LinkRow title="학습 통계" onPress={() => router.push('/statistics')} />
    <ApiStatus resource={profile} label="내 정보" />
    {history.status === 'error' && <ApiStatus resource={history} label="최근 학습" />}
    {topics.status === 'error' && <ApiStatus resource={topics} label="경제 대륙" />}
    {stages.status === 'error' && <ApiStatus resource={stages} label="지역 진도" />}
    {calendar.status === 'error' && <ApiStatus resource={calendar} label="연속 학습" />}
    <LinkRow title="연결 상태 확인" onPress={() => router.push('/connections')} />
  </Screen>;
}
