/** 피그마 20-01~20-05: 학습 상태별 홈 대시보드 */
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Heading, Progress, Row } from '../../components/ui/Primitives';
import { ApiStatus } from '../../components/ui/ApiStatus';
import LerenButton from '../../components/common/LerenButton';
import LerenCharacter from '../../components/common/LerenCharacter';
import LerenIcon from '../../components/common/LerenIcon';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { heroImage } from '../../constants/heroImage';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { useLearningQuery } from '../../hooks/useLearningQuery';
import { PATHS, historyDecoder, monthDecoder } from '../../services/backend';
import { activeProgressDecoder, LEARNING_PATHS, stagesDecoder, topicsDecoder } from '../../services/learningApi';

function HomeLink({ title, detail, onPress, last = false, icon }: { title: string; detail?: string; onPress: () => void; last?: boolean; icon?: React.ComponentProps<typeof LerenIcon>['name'] }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={{ minHeight: 44, paddingVertical: 11, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: last ? 0 : 1, borderBottomColor: COLORS.line, gap: 8 }}>
    {icon && <LerenIcon name={icon} size={19} />}
    <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink, flex: 1 }}>{title}</Text>
    {!!detail && <Text style={{ ...TYPOGRAPHY.micro, color: COLORS.muted }}>{detail}</Text>}
    <Text style={{ fontSize: 16, color: COLORS.muted }}>›</Text>
  </Pressable>;
}

function HomeLinks({ children }: { children: React.ReactNode }) {
  return <View style={{ borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, overflow: 'hidden', backgroundColor: COLORS.surface }}>
    {children}
  </View>;
}

function HomeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={{ gap: 9 }}>
    <Heading>{title}</Heading>
    {children}
  </View>;
}

function SummaryBox({ value, label }: { value: string; label: string }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 12 }}>
    <Text style={{ ...TYPOGRAPHY.heading, color: COLORS.primary, textAlign: 'center' }}>{value}</Text>
    <Text style={{ ...TYPOGRAPHY.micro, color: COLORS.muted, textAlign: 'center' }}>{label}</Text>
  </View>;
}

function SummaryRow({ items }: { items: { value: string; label: string }[] }) {
  return <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, backgroundColor: COLORS.surface }}>
    {items.map((item, index) => <View key={item.label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
      {index > 0 && <View style={{ width: 1, height: 30, backgroundColor: COLORS.line }} />}
      <SummaryBox value={item.value} label={item.label} />
    </View>)}
  </View>;
}

function FeaturedCard({ eyebrow, title, description, progress, progressLabel, action, onPress }: {
  eyebrow: string; title: string; description?: string; progress?: number; progressLabel?: string; action: string; onPress: () => void;
}) {
  return <View style={{ backgroundColor: '#E9EFFF', borderRadius: 12, padding: 14, gap: 9 }}>
    <Text style={{ ...TYPOGRAPHY.micro, color: COLORS.primary, fontWeight: '700' }}>{eyebrow}</Text>
    <Text style={{ ...TYPOGRAPHY.heading, color: COLORS.ink }}>{title}</Text>
    {!!description && <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>{description}</Text>}
    {!!progressLabel && <Text style={{ ...TYPOGRAPHY.micro, color: COLORS.muted }}>{progressLabel}</Text>}
    {progress !== undefined && <Progress value={progress} />}
    <LerenButton title={action} onPress={onPress} />
  </View>;
}

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
  const completedToday = daily?.hasCompletedLearning === true;
  const portrait = heroImage(p?.characterClass);
  const hasReview = (history.data?.total ?? 0) > 0;
  const allStagesDone = items.length > 0 && done === items.length;
  const hasActiveLearning = !!resume || continuing;
  const view = firstLesson ? 'first' : hasActiveLearning ? 'resume' : completedToday ? 'completed' : allStagesDone ? 'review' : 'default';

  const openNext = () => {
    if (resume) {
      router.push({ pathname: resume.boss ? '/quiz' : '/lesson', params: { stageId: resume.stageId } });
      return;
    }
    if (next) {
      router.push({ pathname: '/lesson', params: { stageId: next.stageId } });
      return;
    }
    router.push('/explore');
  };

  const nextTitle = resume?.title ?? next?.title ?? '경제 대륙 지도';
  const topicTitle = stages.data?.topic.title ?? '경제 기초';
  const stageProgress = items.length > 0 ? done / items.length : undefined;
  const stageLabel = items.length > 0 ? `지역 진도 ${done} / ${items.length}단계` : undefined;

  return <Screen title="홈" back={false} tabs>
    {p && <View style={{ gap: 3 }}>
      <Row>
        {portrait && <LerenCharacter source={portrait} size={46} />}
        <View style={{ flex: 1, gap: 3 }}>
          <Heading>{view === 'first' ? `반가워요, ${p.nickname}님` : view === 'resume' ? '이어서 학습해요' : view === 'completed' ? '오늘 목표 달성!' : view === 'review' ? '오늘의 복습' : `${p.nickname}님의 학습 홈`}</Heading>
          <Body muted>{view === 'first' ? '첫 번째 탐험을 시작해 보세요.' : view === 'resume' ? '마지막으로 공부한 위치부터 이어가요.' : view === 'completed' ? '오늘의 학습을 마쳤어요.' : view === 'review' ? '오답과 헷갈린 개념을 다시 확인해요.' : `${p.characterClass?.name ?? '모험가'} Lv.${p.level ?? '—'} · 경제 Lv.${p.economyLevel ?? '—'}`}</Body>
        </View>
      </Row>
    </View>}

    {view === 'first' && <>
      <FeaturedCard eyebrow={`첫 수업 · ${topicTitle}`} title={next?.title ?? '경제 탐험 시작하기'} description="짧은 지식과 퀴즈를 풀고 성장해요." action="첫 학습 시작하기" onPress={openNext} />
      <HomeSection title="첫 학습은 이렇게 진행돼요">
        <View style={{ borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, paddingHorizontal: 12 }}>
          {[
            ['1', '개념 읽기', '생활 속 예시로 이해해요'],
            ['2', '퀴즈 풀기', '새 문제로 개념을 확인해요'],
            ['3', '결과 확인', '보상과 다음 단계를 확인해요'],
          ].map(([number, title, detail], i) => <View key={number} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: i === 2 ? 0 : 1, borderBottomColor: COLORS.line }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.soft, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ ...TYPOGRAPHY.micro, color: COLORS.primary, fontWeight: '700' }}>{number}</Text>
            </View>
            <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink, flex: 1 }}>{title}</Text>
            <Text style={{ ...TYPOGRAPHY.micro, color: COLORS.muted }}>{detail}</Text>
          </View>)}
        </View>
      </HomeSection>
      <HomeSection title="미리 둘러보기">
        <HomeLinks>
          <HomeLink title="전체 탐험 지도" detail="9개 지역" onPress={() => router.push('/explore')} />
          <HomeLink title="내 캐릭터" detail="직업과 코스튬" onPress={() => router.push('/wardrobe')} />
        </HomeLinks>
      </HomeSection>
    </>}

    {view === 'resume' && <>
      <FeaturedCard eyebrow={`${topicTitle} · 진행 중인 학습`} title={nextTitle} description={resume && !resume.boss ? `마지막으로 본 ${resume.position}쪽` : '마지막으로 공부한 곳부터 이어가요.'} progress={stageProgress} progressLabel={stageLabel} action={resume?.boss ? '보스 전투 이어가기' : '학습 이어보기'} onPress={openNext} />
      <HomeSection title="앞에서 배운 내용">
        <View style={{ borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, padding: 14, gap: 5 }}>
          <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink }}>{topicTitle}</Text>
          <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>이어서 학습하며 앞에서 배운 개념을 확인해요.</Text>
        </View>
      </HomeSection>
      <HomeSection title="학습 도구">
        <HomeLinks>
          <HomeLink title="개념 처음부터 보기" detail="탐험 지도" onPress={() => router.push('/explore')} />
          <HomeLink title="AI 튜터에게 질문" detail="현재 학습 개념" onPress={() => router.push('/tutor')} />
          <HomeLink title="다른 단계 둘러보기" detail={topicTitle} onPress={() => router.push('/explore')} />
        </HomeLinks>
      </HomeSection>
    </>}

    {view === 'completed' && <>
      <FeaturedCard eyebrow="오늘의 목표" title={`${daily?.completedCount ?? 0}건 학습 완료`} description="오늘도 경제 탐험을 진행했어요." action="오늘의 학습 기록 보기" onPress={() => router.push('/calendar')} />
      <HomeSection title="오늘의 학습 결과">
        <SummaryRow items={[
          { value: `${daily?.completedCount ?? 0}건`, label: '완료 학습' },
          { value: `${p?.completedStageCount ?? 0}단계`, label: '누적 완료' },
          { value: `${calendar.data?.streakDays ?? 0}일`, label: '연속 학습' },
        ]} />
      </HomeSection>
      <HomeSection title="학습 마무리">
        <HomeLinks>
          <HomeLink icon="BookOpen" title="오늘의 복습" detail="오답 확인" onPress={() => router.push('/review')} />
          <HomeLink icon="ChartNoAxesColumn" title="학습 통계 보기" detail="개념별 성과" onPress={() => router.push('/statistics')} />
          <HomeLink icon="Map" title="탐험 지도 보기" detail="다음 지역" last onPress={() => router.push('/explore')} />
        </HomeLinks>
      </HomeSection>
    </>}

    {view === 'review' && <>
      <FeaturedCard eyebrow="경제 기초" title="놓친 개념을 다시 만나봐요" description="틀린 문제와 헷갈린 개념 다시 확인하기" action="복습하기" onPress={() => router.push('/review')} />
      <HomeSection title="복습 노트와 학습">
        <HomeLinks>
          <HomeLink title="전체 복습 노트" detail="전체 목록" onPress={() => router.push('/review')} />
          <HomeLink title="나의 학습 개념" detail="학습 통계" onPress={() => router.push('/statistics')} />
          <HomeLink title="새로운 학습 시작" detail="다음 탐험" onPress={() => router.push('/explore')} />
        </HomeLinks>
      </HomeSection>
    </>}

    {view === 'default' && <>
      <FeaturedCard eyebrow={`다음 학습 · ${topicTitle}`} title={nextTitle} progress={stageProgress} progressLabel={stageLabel} action={next ? '다음 학습 시작하기' : '탐험 지도 열기'} onPress={openNext} />
      <HomeSection title="오늘의 현황">
        <SummaryRow items={[
          { value: calendar.data ? `${calendar.data.streakDays}일` : '—', label: '연속 학습' },
          { value: calendar.data ? `${daily?.completedCount ?? 0}건` : '—', label: '오늘의 학습' },
          { value: p?.coinBalance?.toLocaleString() ?? '—', label: '보유 코인' },
        ]} />
      </HomeSection>
      <HomeSection title="학습 바로가기">
        <HomeLinks>
          <HomeLink title="오늘의 복습" detail={hasReview ? '학습 기록' : '기록 없음'} onPress={() => router.push('/review')} />
          <HomeLink title="학습 달력" detail="이번 달 기록" onPress={() => router.push('/calendar')} />
          <HomeLink title="전체 탐험 지도" detail="9개 지역" onPress={() => router.push('/explore')} />
        </HomeLinks>
      </HomeSection>
    </>}

    <ApiStatus resource={profile} label="내 정보" />
    {history.status === 'error' && <ApiStatus resource={history} label="최근 학습" />}
    {topics.status === 'error' && <ApiStatus resource={topics} label="경제 대륙" />}
    {stages.status === 'error' && <ApiStatus resource={stages} label="지역 진도" />}
    {calendar.status === 'error' && <ApiStatus resource={calendar} label="연속 학습" />}
  </Screen>;
}
