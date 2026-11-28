/** 공통 화면 틀: 안전 영역, 키보드 회피, 본문 스크롤과 5개 하단 탭을 관리합니다. */
import type { ReactNode } from 'react';
import { Notice } from './Primitives';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname, type Href } from 'expo-router';
import { COLORS, LAYOUT, TYPOGRAPHY } from '../../constants/theme';

interface ScreenProps {
  title: string; children: ReactNode; back?: boolean; tabs?: boolean;
  illustratedStage?: boolean; footer?: ReactNode; scroll?: boolean; right?: ReactNode; onBack?: () => void; preview?: boolean; }
const TABS = [
  { path: '/home', label: '홈', icon: '⌂' },
  { path: '/explore', label: '탐험', icon: '◇' },
  { path: '/review', label: '복습', icon: '✓' },
  { path: '/tutor', label: 'AI 질문', icon: '✦' },
  { path: '/mypage', label: '마이', icon: '○' },
];

// 390 × 844 프레임의 본문 스크롤 영역 안쪽 여백. 상태 표시줄은 기기 안전 영역이 담당합니다.
const bodySpacing: Record<string, ViewStyle> = {
  '/': { paddingTop: 8, paddingBottom: 16, gap: 22 },
  '/home': { paddingTop: 6 },
  '/login': { paddingTop: 6, gap: 0 },
  '/signup': { paddingTop: 6, gap: 0 },
  '/steps': { paddingTop: 8 },
  '/lesson': { paddingTop: 8 },
  '/calendar': { paddingTop: 8 },
  '/reset-password': { paddingTop: 8 },
  '/settings': { paddingTop: 8, gap: 16 },
  '/quiz': { paddingTop: 0, gap: 14 },
  '/result': { paddingTop: 7, paddingBottom: 22 },
  '/review': { paddingTop: 7, paddingBottom: 22 },
  '/shop': { paddingTop: 3 },
  '/tutor': { paddingTop: 16 },
  '/explore': { paddingHorizontal: 14, paddingTop: 7, gap: 10 },
};

export default function Screen({ title, children, back = true, tabs = false, footer, scroll = true, right, onBack, illustratedStage = false, preview = false }: ScreenProps) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const map = pathname === '/explore';
  const illustrated = map || illustratedStage;
  const authHeader = ['/login', '/signup', '/jobs'].includes(pathname);
  const headerSpacing = illustrated ? { minHeight: map ? 41 : 43 } : authHeader ? styles.authHeader : styles.standardHeader;
  // 직접 주소로 진입해 이전 화면이 없는 경우에는 홈으로 돌아갑니다.
  const goBack = () => {
    if (onBack) { onBack(); return; }
    if (router.canGoBack()) router.back(); else router.replace('/home');
  };
  // 복습과 시안 안내를 요청한 화면에서는 실제 서버 기록에 반영되지 않는다는 안내를 표시합니다.
  const showPreview = preview;
  const body = <View style={[styles.content, bodySpacing[pathname], illustratedStage && styles.stageContent, !scroll && styles.flex]}>{showPreview ? <Notice>미리보기 · 이 화면의 활동은 회원 기록이나 보상에 반영되지 않아요.</Notice> : null}{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.phone, width >= LAYOUT.wideViewport && styles.widePhone]}>
          {!!title && <View style={[styles.header, headerSpacing]}>
            {back && <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="뒤로가기" hitSlop={8} style={[styles.back, illustrated && styles.mapBack]}><Text style={styles.chevron}>‹</Text></Pressable>}
            <Text style={styles.title} accessibilityRole="header">{title}</Text>{right}
          </View>}
          {scroll ? <ScrollView style={styles.flex} contentContainerStyle={styles.grow} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>{body}</ScrollView> : body}
          {footer && <View style={[styles.footer, illustrated && styles.mapFooter, pathname === '/tutor' && styles.tutorFooter]}>{footer}</View>}
          {tabs && <View style={[styles.tabs, illustrated && styles.mapTabs, illustratedStage && styles.stageTabs]}>
            {TABS.map(tab => {
              const active = pathname === tab.path || (tab.path === '/mypage' && ['/wardrobe', '/shop', '/settings', '/notifications', '/profile', '/statistics', '/calendar', '/learning-detail', '/jobs'].includes(pathname)) || (tab.path === '/explore' && ['/steps', '/lesson', '/quiz', '/result'].includes(pathname));
              // 하위 학습 화면도 탐험 탭을 강조하지만, 탭을 누르면 탐험 목록으로 돌아가야 합니다.
              return <Pressable key={tab.path} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected: active }} onPress={() => { if (pathname !== tab.path) router.replace(tab.path as Href); }} style={styles.tab}>
                <View style={[styles.iconSlot, active && styles.selectedTab]}><Text style={[styles.tabIcon, active && styles.active]}>{tab.icon}</Text></View><Text style={[styles.tabLabel, active && styles.active]}>{tab.label}</Text>
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
  phone: { flex: 1, width: '100%', alignSelf: 'center', backgroundColor: COLORS.surface },
  widePhone: { maxWidth: LAYOUT.contentMaxWidth },
  authHeader: { minHeight: LAYOUT.headerHeight },
  standardHeader: { minHeight: 50, marginBottom: 4 },
  header: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { width: 22, height: 44, justifyContent: 'center' }, chevron: { fontSize: 28, color: COLORS.ink },
  mapBack: { height: undefined, alignSelf: 'stretch' },
  title: { ...TYPOGRAPHY.heading, color: COLORS.ink, flex: 1 },
  //content: { paddingHorizontal: LAYOUT.screenPadding, paddingTop: 4, paddingBottom: LAYOUT.screenPadding, gap: LAYOUT.gap },
  content: {
  paddingHorizontal: LAYOUT.screenPadding,
  paddingTop: 4,
  paddingBottom: LAYOUT.screenPadding,
  gap: LAYOUT.gap,
 },
  stageContent: { paddingHorizontal: 12, paddingTop: 3, paddingBottom: 12, gap: 11 },
  mapFooter: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 15 },
  tutorFooter: { paddingTop: 12, paddingBottom: 16 },
  footer: { paddingHorizontal: LAYOUT.screenPadding, paddingTop: 8, paddingBottom: 12, gap: 8 },
  tabs: { flexDirection: 'row', minHeight: LAYOUT.tabsHeight, paddingTop: 12, paddingBottom: 11, paddingHorizontal: 12, borderTopWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.surface },
  mapTabs: { minHeight: 64, paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  stageTabs: { minHeight: 63 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 44 },
  iconSlot: { width: 48, maxWidth: '100%', minHeight: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  selectedTab: { backgroundColor: COLORS.soft },
  tabIcon: { fontSize: 22, lineHeight: 26, includeFontPadding: false, color: COLORS.muted }, tabLabel: { ...TYPOGRAPHY.micro, color: COLORS.muted }, active: { color: COLORS.primary },
});
