/** 잘못된 주소에서도 화면 목록으로 돌아갈 길을 제공합니다. */
import { router } from 'expo-router';
import Screen from '../components/ui/Screen';
import { Empty } from '../components/ui/Primitives';
export default function NotFoundScreen() { return <Screen title="화면을 찾지 못했어요"><Empty title="다시 모험을 시작해 볼까요?" description="시작 화면에서 다시 이동해 주세요." action="시작 화면" onPress={() => router.replace('/')} /></Screen>; }
