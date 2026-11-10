/** 서버 재설정 API가 연결되기 전에는 메일 발송·비밀번호 변경 완료를 표시하지 않습니다. */
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Notice } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';

export default function ResetPasswordScreen() {
  return <Screen title="비밀번호 재설정">
    <LerenCard title="아직 미연결" description="비밀번호 재설정 API가 아직 연결되지 않았어요." variant="info" />
    <Notice>현재 이 화면에서는 재설정 이메일을 보내거나 계정의 비밀번호를 변경할 수 없어요.</Notice>
    <LerenButton title="로그인으로 돌아가기" onPress={() => router.replace('/login')} />
  </Screen>;
}
