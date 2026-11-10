/** 조회 결과를 한곳에서 확인합니다. 쓰기 API는 이 화면을 열었다는 이유만으로 실행하지 않습니다. */
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Heading, LinkRow, Notice } from '../../components/ui/Primitives';
import { ApiStatus, Unconnected } from '../../components/ui/ApiStatus';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { useBackend } from '../../hooks/useBackend';
import { PATHS, historyDecoder, conversationsDecoder, usageDecoder, monthDecoder, dependenciesDecoder } from '../../services/backend';
import { LEARNING_PATHS, topicsDecoder } from '../../services/learningApi';
export default function ApiConnectionsScreen() {
  const profile = useBackendProfile();
  const history = useBackend(`${PATHS.history}?page=1&pageSize=1`, historyDecoder);
  const conversations = useBackend(`${PATHS.conversations}?page=1&pageSize=1`, conversationsDecoder);
  const usage = useBackend(PATHS.usage, usageDecoder);
  // format 환경차에 영향받지 않도록 서울 기준 날짜의 연·월을 명시적으로 조합합니다.
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  const month = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}`;
  const calendar = useBackend(`${PATHS.calendar}?month=${month}`, monthDecoder);
  const topics = useBackend(LEARNING_PATHS.topics, topicsDecoder);
  const dependencies = useBackend('/api/v1/health/dependencies', dependenciesDecoder);
  return <Screen title="API 연결 현황" back tabs>
    <Body muted>현재 로그인한 계정의 실시간 조회 결과입니다. 저장·삭제·AI 전송은 각 화면에서 직접 실행해야 확인할 수 있습니다.</Body>
    <Heading>조회 결과</Heading><ApiStatus resource={profile} label="회원·성장·지갑" />
    {profile.data && <Body muted>성장 {profile.data.level === null ? '데이터 없음' : '데이터 있음'} · 지갑 {profile.data.coinBalance === null ? '데이터 없음' : '데이터 있음'} · 직업 {profile.data.characterClass ? '데이터 있음' : '데이터 없음'}</Body>}
    <ApiStatus resource={calendar} label="월별 달력" empty={calendar.data?.days.every(d => !d.hasCompletedLearning && !d.hasScheduledLearning)} />
    <ApiStatus resource={history} label="학습 이력" empty={history.data?.total === 0} />
    <ApiStatus resource={conversations} label="튜터 대화" empty={conversations.data?.total === 0} />
    <ApiStatus resource={usage} label="튜터 사용량" />
    <ApiStatus resource={topics} label="공개 학습 주제" empty={topics.data?.items.length === 0} />
    <LinkRow title="학습·퀴즈 시작하기" subtitle="주제 선택 → 학습 → 응시·채점·결과" onPress={() => router.push('/explore')} />
    <ApiStatus resource={dependencies} label="EC2 서버 의존성 상태" />{dependencies.data && <Body>EC2 DB: {dependencies.data.database} · EC2의 AI 연결: {dependencies.data.fastapi}</Body>}
    <Heading>입력·저장 기능</Heading>
    <LinkRow title="학습 알림 켜기·끄기" subtitle="저장 API 연결 · 저장 후 성공 여부 표시" onPress={() => router.push('/notifications')} />
    <LinkRow title="학습 일정" subtitle="조회·추가·수정·삭제 연결 · 실제 단계·개념 필요" onPress={() => router.push('/calendar')} />
    <LinkRow title="AI 튜터" subtitle="대화 생성·메시지 조회·전송 연결 · AI 서버 필요" onPress={() => router.push('/tutor')} />
    <Notice>이메일 회원가입·로그인·로그아웃과 PC 웹 카카오 로그인은 기존 연결을 유지합니다. 휴대폰 카카오 딥링크는 별도 검증이 필요합니다.</Notice>
    <Heading>아직 준비되지 않은 기능</Heading>
    <Unconnected>비밀번호 재설정, 프로필 수정, 직업 변경, 보유 코스튬·상품·구매·장착, 개념별 통계 등은 아직 해당 화면과 연결되지 않았습니다.</Unconnected>
    <Body muted>탐험·학습·일반 퀴즈는 정식 API를 사용합니다. 보스 응시와 복습 시안은 별도입니다.</Body>
  </Screen>;
}
