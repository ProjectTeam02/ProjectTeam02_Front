/** 작은 공통 UI: Figma의 문구, 행, 상태 안내, 진행 막대를 같은 토큰으로 조합합니다. */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import LerenLinkCard from '../common/LerenLinkCard';
import LerenButton from '../common/LerenButton';

export function Body({ children, muted = false, style }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.body, muted && s.muted, style]}>{children}</Text>;
}
export function Heading({ children }: { children: ReactNode }) { return <Text style={s.heading} accessibilityRole="header">{children}</Text>; }
export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) { return <View style={[s.row, style]}>{children}</View>; }
export function Chip({ label, active = false, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[s.chip, active && s.activeChip]}><Text style={[s.small, active && s.primary]}>{label}</Text></Pressable>;
}
export function LinkRow({ title, subtitle, onPress }: { title: string; subtitle?: string; onPress?: () => void }) {
  return <LerenLinkCard title={title} subtitle={subtitle} onPress={onPress} />;
}
export function Progress({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(1, value));
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }} style={s.track}><View style={[s.progress, { width: `${clamped * 100}%` }]} /></View>;
}
export function Empty({ title, description, action, onPress }: { title: string; description?: string; action?: string; onPress?: () => void }) {
  return <View style={s.empty}><Text style={s.emptyIcon}>◇</Text><Heading>{title}</Heading>{description && <Body muted>{description}</Body>}{action && <LerenButton title={action} onPress={onPress} />}</View>;
}
export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'success' | 'error' }) {
  return <View style={[s.notice, tone === 'success' && s.success, tone === 'error' && s.error]}><Text accessibilityLiveRegion="polite" style={[s.small, tone === 'error' && s.errorText]}>{children}</Text></View>;
}
const s = StyleSheet.create({
  body: { ...TYPOGRAPHY.body, color: COLORS.ink }, muted: { color: COLORS.muted }, heading: { ...TYPOGRAPHY.heading, color: COLORS.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  activeChip: { backgroundColor: COLORS.soft, borderColor: COLORS.primary }, primary: { color: COLORS.primary }, small: { ...TYPOGRAPHY.small, color: COLORS.muted },
  track: { height: 8, borderRadius: 4, backgroundColor: COLORS.disabled, overflow: 'hidden' }, progress: { height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 40 }, emptyIcon: { fontSize: 40, color: COLORS.muted },
  notice: { backgroundColor: COLORS.soft, borderRadius: 12, padding: 12 }, success: { backgroundColor: COLORS.successBg }, error: { backgroundColor: COLORS.dangerBg }, errorText: { color: COLORS.danger },
});
