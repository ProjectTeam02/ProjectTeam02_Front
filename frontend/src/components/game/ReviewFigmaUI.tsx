/** Figma 22번 복습 화면에서 사용하는 전용 UI. 기존 공통 스타일/다른 탭에는 영향을 주지 않습니다. */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LerenCharacter from '../common/LerenCharacter';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import type { ReviewFilter } from '../../services/reviewApi';

const tutor = require('../../../assets/characters/leren_tutor.png');

export function ReviewHero({ title, description, character = true }: {
  title: string; description?: string; character?: boolean;
}) {
  return <View style={styles.hero}>
    <View style={styles.heroCopy}>
      <Text style={styles.heroTitle}>{title}</Text>
      {!!description && <Text style={styles.heroDescription}>{description}</Text>}
    </View>
    {character && <View style={styles.avatar}><LerenCharacter source={tutor} size={57} /></View>}
  </View>;
}

const labels: Record<ReviewFilter, string> = { ALL: '전체', WRONG: '오답', BOOKMARK: '헷갈림' };
export function ReviewTabs({ selected, onChange }: {
  selected: ReviewFilter; onChange: (filter: ReviewFilter) => void;
}) {
  return <View style={styles.tabs} accessibilityRole="tablist">
    {(Object.keys(labels) as ReviewFilter[]).map(key => <Pressable
      key={key} accessibilityRole="tab" accessibilityState={{ selected: selected === key }}
      onPress={() => onChange(key)} style={[styles.tab, selected === key && styles.selectedTab]}>
      <Text style={[styles.tabText, selected === key && styles.selectedTabText]}>{labels[key]}</Text>
    </Pressable>)}
  </View>;
}

export function ReviewRow({ title, description, onPress, last = false }: {
  title: string; description?: string; onPress: () => void; last?: boolean;
}) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.row, !last && styles.rowDivider]}>
    <View style={{ flex: 1, gap: 3 }}>
      <Text style={styles.rowTitle}>{title}</Text>
      {!!description && <Text style={styles.rowDescription}>{description}</Text>}
    </View>
    <Text style={styles.arrow}>›</Text>
  </Pressable>;
}

export function ReviewPanel({ children, tone = 'default' }: {
  children: ReactNode; tone?: 'default' | 'soft' | 'muted';
}) {
  return <View style={[styles.panel, tone === 'soft' && styles.panelSoft, tone === 'muted' && styles.panelMuted]}>{children}</View>;
}
export function ReviewPanelTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.panelTitle}>{children}</Text>;
}
export function ReviewPanelBody({ children }: { children: ReactNode }) {
  return <Text style={styles.panelBody}>{children}</Text>;
}

export function ReviewStats({ count, correct }: { count: number; correct: number }) {
  const accuracy = count === 0 ? 0 : Math.round(correct / count * 100);
  const items = [
    { title: '푼 문제', value: `${count}개` },
    { title: '맞힌 문제', value: `${correct}개` },
    { title: '정답률', value: `${accuracy}%` },
  ];
  return <View style={styles.stats}>
    {items.map((item, i) => <View key={item.title} style={[styles.statItem, i > 0 && styles.statDivider]}>
      <Text style={styles.statNumber}>{item.value}</Text>
      <Text style={styles.statLabel}>{item.title}</Text>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', minHeight: 114, padding: 16, gap: 10, borderRadius: 16, backgroundColor: '#E9EFFF' },
  heroCopy: { flex: 1, gap: 6 },
  heroTitle: { ...TYPOGRAPHY.heading, fontSize: 19, lineHeight: 27, color: COLORS.ink },
  heroDescription: { ...TYPOGRAPHY.small, fontSize: 13, lineHeight: 19, color: COLORS.muted },
  avatar: { width: 65, height: 65, borderRadius: 33, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', borderRadius: 12, backgroundColor: '#F3F6FA', padding: 4, gap: 4 },
  tab: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  selectedTab: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.line },
  tabText: { ...TYPOGRAPHY.small, fontSize: 14, lineHeight: 20, color: COLORS.muted },
  selectedTabText: { ...TYPOGRAPHY.label, fontSize: 14, lineHeight: 20, color: COLORS.primary },
  row: { minHeight: 65, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.line },
  rowTitle: { ...TYPOGRAPHY.label, fontSize: 16, lineHeight: 24, color: COLORS.ink },
  rowDescription: { ...TYPOGRAPHY.small, fontSize: 12, lineHeight: 18, color: COLORS.muted },
  arrow: { fontSize: 22, color: COLORS.muted },
  panel: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 13, padding: 15, gap: 7, backgroundColor: COLORS.surface },
  panelSoft: { borderWidth: 0, backgroundColor: '#E9EFFF' },
  panelMuted: { borderWidth: 0, backgroundColor: '#F3F6FA' },
  panelTitle: { ...TYPOGRAPHY.label, fontSize: 16, lineHeight: 24, color: COLORS.ink },
  panelBody: { ...TYPOGRAPHY.body, fontSize: 14, lineHeight: 22, color: COLORS.muted },
  stats: { flexDirection: 'row', borderWidth: 1, borderColor: COLORS.line, borderRadius: 13, paddingVertical: 17, backgroundColor: COLORS.surface },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: COLORS.line },
  statNumber: { ...TYPOGRAPHY.heading, fontSize: 23, lineHeight: 30, color: COLORS.primary },
  statLabel: { ...TYPOGRAPHY.small, fontSize: 12, lineHeight: 18, color: COLORS.muted },
});
