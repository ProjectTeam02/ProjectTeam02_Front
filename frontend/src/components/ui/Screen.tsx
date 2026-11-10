/** 공통 화면 틀: 안전 영역, 키보드 회피, 본문 스크롤과 5개 하단 탭을 관리합니다. */
import type { ReactNode } from 'react';
import { Notice } from './Primitives';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname, type Href } from 'expo-router';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

interface ScreenProps {
  title: string; children: ReactNode; back?: boolean; tabs?: boolean;
  footer?: ReactNode; scroll?: boolean; right?: ReactNode; onBack?: () => void; preview?: boolean; }
const TABS = [
  { path: '/home', label: '홈', icon: '⌂' },
  { path: '/explore', label: '탐험', icon: '◇' },
  { path: '/review', label: '복습', icon: '✓' },
  { path: '/tutor', label: 'AI 질문', icon: '✦' },
  { path: '/mypage', label: '마이', icon: '○' },
];

export default function Screen({ title, children, back = true, tabs = false, footer, scroll = true, right, onBack, preview = false }: ScreenProps) {
  const pathname = usePathname();
  // 직접 주소로 진입해 이전 화면이 없는 경우에는 홈으로 돌아갑니다.
  const goBack = () => {
    if (onBack) { onBack(); return; }
    if (router.canGoBack()) router.back(); else router.replace('/home');
  };
  // 정식 목록·저장 API가 없는 시안 화면은 실제 서버 기록과 혼동하지 않도록 항상 표시합니다.
  const showPreview = preview || ['/review', '/jobs'].includes(pathname);
  const body = <View style={[styles.content, !scroll && styles.flex]}>{showPreview && <Notice>아직 미연결 · 개발용 학습·캐릭터 미리보기입니다. 이 화면의 학습·복습·직업·코인·보상·구매·채점 결과는 시안이며 실제 회원 기록에 저장되지 않습니다.</Notice>}{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.phone}>
          {!!title && <View style={styles.header}>
            {back && <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="뒤로가기" hitSlop={8} style={styles.back}><Text style={styles.chevron}>‹</Text></Pressable>}
            <Text style={styles.title} accessibilityRole="header">{title}</Text>{right}
          </View>}
          {scroll ? <ScrollView style={styles.flex} contentContainerStyle={styles.grow} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>{body}</ScrollView> : body}
          {footer && <View style={styles.footer}>{footer}</View>}
          {tabs && <View style={styles.tabs}>
            {TABS.map(tab => {
              const active = pathname === tab.path || (tab.path === '/explore' && ['/steps', '/lesson', '/quiz', '/result'].includes(pathname));
              return <Pressable key={tab.path} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected: active }} onPress={() => { if (!active) router.replace(tab.path as Href); }} style={styles.tab}>
                <Text style={[styles.tabIcon, active && styles.active]}>{tab.icon}</Text><Text style={[styles.tabLabel, active && styles.active]}>{tab.label}</Text>
              </Pressable>;
            })}
          </View>}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface }, flex: { flex: 1 }, grow: { flexGrow: 1 },
  phone: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center', backgroundColor: COLORS.surface },
  header: { minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { width: 22, height: 44, justifyContent: 'center' }, chevron: { fontSize: 28, color: COLORS.ink },
  title: { ...TYPOGRAPHY.heading, color: COLORS.ink, flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 24, gap: 12 },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12, gap: 8 },
  tabs: { flexDirection: 'row', minHeight: 68, paddingVertical: 10, paddingHorizontal: 8, borderTopWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.surface },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 44 },
  tabIcon: { fontSize: 22, lineHeight: 27, color: COLORS.muted }, tabLabel: { ...TYPOGRAPHY.micro, color: COLORS.muted }, active: { color: COLORS.primary },
});
