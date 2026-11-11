/** 카카오 복귀 코드를 검증해 실제 Leren 세션으로 교환하고 인증 성공 후에만 홈을 엽니다. */
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import Screen from '../../components/ui/Screen';
import { Body, Notice } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import { useAuth } from '../../context/AuthContext';

export default function KakaoCallbackScreen() {
  const { session, finishKakaoSignIn } = useAuth();
  const [error, setError] = useState('');
  useEffect(() => {
    let mounted = true;
    if (session) { router.replace('/home'); return; }
    // 교환은 AuthContext가 중복 방지합니다. 화면 정리 때 요청을 취소하지 않아 일회용 코드를 잃지 않게 합니다.
    void finishKakaoSignIn().then(() => { if (mounted) router.replace('/home'); })
      .catch(cause => {
        // 네이티브의 window에는 브라우저 history가 없으므로 웹 주소만 정리합니다.
        if (typeof window !== 'undefined' && window.history?.replaceState) window.history.replaceState(window.history.state, '', window.location.pathname);
        if (mounted) setError(cause instanceof Error ? cause.message : '카카오 로그인을 완료하지 못했어요.');
      });
    return () => { mounted = false; };
  }, [session, finishKakaoSignIn]);
  return <Screen title="카카오 로그인" back={false}>
    {error ? <>
      <Notice tone="error">{error}</Notice>
      <LerenButton title="로그인 화면으로 돌아가기" onPress={() => router.replace('/login')} />
    </> : <Body>카카오 인증을 확인하고 있어요. 잠시만 기다려 주세요.</Body>}
  </Screen>;
}
