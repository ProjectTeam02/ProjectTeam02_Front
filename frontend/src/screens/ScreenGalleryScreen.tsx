/** 실제 로그인 후 각 제품 화면을 확인하는 test 전용 목록입니다. 임의 완료/인증 성공 상태는 만들지 않습니다. */
import { router, type Href } from 'expo-router';
import Screen from '../components/ui/Screen';
import { Heading, LinkRow, Notice } from '../components/ui/Primitives';
import LearningContentState from '../components/ui/LearningContentState';
import { useLearningContent } from '../context/LearningContentContext';
const screens = [
  ['초기 화면', '/'], ['로그인', '/login'], ['회원가입', '/signup'], ['직업 선택', '/jobs'], ['비밀번호 재설정', '/reset-password'],
  ['홈', '/home'], ['경제 탐험', '/explore'], ['복습', '/review'], ['튜터 예시 대화', '/tutor'], ['마이페이지', '/mypage'],
  ['학습 달력', '/calendar'], ['통계', '/statistics'], ['영웅·코스튬', '/wardrobe'], ['상점', '/shop'],
  ['설정', '/settings'], ['프로필 수정', '/profile'], ['학습 알림', '/notifications'],
];
export default function ScreenGalleryScreen() {
  return <Screen title="화면 목록">
    <Notice>이메일 로그인·로그아웃은 실제 인증입니다. 학습은 테스트 JSON을 사용하며 코인·진행·설정·튜터 답변은 화면 확인용입니다.</Notice>
    <Heading>제품 화면</Heading>
    {screens.map(([title, path]) => <LinkRow key={path} title={title} onPress={() => router.push(path as Href)} />)}
    <Heading>학습 바로가기</Heading><LearningContentState><LearningLinks /></LearningContentState>
  </Screen>;
}
function LearningLinks() {
  const { regions } = useLearningContent();
  const region = regions[0]; const lesson = region?.lessons[0];
  if (!region || !lesson) return null;
  const links = [['학습 단계', `/steps?stage=${region.id}`], ['개념 학습', `/lesson?step=${encodeURIComponent(lesson.id)}`], ['퀴즈', `/quiz?step=${encodeURIComponent(lesson.id)}`], ['결과', '/result']];
  return <>{links.map(([title, path]) => <LinkRow key={path} title={title} onPress={() => router.push(path as Href)} />)}</>;
}
