/** 10·11번 인증 화면의 상단 안내와 계정 이동 링크입니다. */
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import LerenCard from '../../components/common/LerenCard';
import LerenIcon from '../../components/common/LerenIcon';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

type IntroIcon = 'LockKeyhole' | 'UserRound' | 'CheckCheck' | 'CircleAlert';
type IntroTone = 'info' | 'success' | 'error';

interface AuthIntroProps {
  title: string;
  description: string;
  icon: IntroIcon;
  tone?: IntroTone;
  busy?: boolean;
}

export function AuthIntro({ title, description, icon, tone = 'info', busy = false }: AuthIntroProps) {
  const color = tone === 'success' ? COLORS.success : tone === 'error' ? COLORS.danger : COLORS.primary;
  return (
    <LerenCard variant={tone} style={styles.card}>
      <View style={styles.copy} accessibilityLiveRegion={tone === 'error' || busy ? 'polite' : 'none'}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={styles.icon} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {busy ? <ActivityIndicator size="small" color={color} /> : <LerenIcon name={icon} size={22} color={color} />}
      </View>
    </LerenCard>
  );
}

interface AuthTextLinkProps {
  label: string;
  prefix?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** 한 줄 전체를 탭할 수 있게 해서 아래의 작은 링크도 누르기 쉽게 합니다. */
export function AuthTextLink({ label, prefix, onPress, disabled, style }: AuthTextLinkProps) {
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={label} accessibilityState={{ disabled }}
      onPress={onPress} disabled={disabled} style={[styles.link, prefix ? styles.center : styles.end, style]}>
      <Text style={styles.linkLine}>
        {prefix ? <Text style={styles.prefix}>{prefix}{'  '}</Text> : null}
        <Text style={[styles.linkLabel, disabled && styles.prefix]}>{label}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 0 },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  title: { ...TYPOGRAPHY.heading, color: COLORS.ink },
  description: { ...TYPOGRAPHY.small, fontSize: 13, lineHeight: 19, color: '#4C5F7D' },
  icon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  link: { width: '100%', minHeight: 44, justifyContent: 'center', paddingVertical: 6 },
  center: { alignItems: 'center' },
  end: { alignItems: 'flex-end', paddingRight: 2 },
  linkLine: { textAlign: 'center', flexShrink: 1 },
  prefix: { ...TYPOGRAPHY.small, color: '#4C5F7D', fontWeight: '400' },
  linkLabel: { ...TYPOGRAPHY.label, fontSize: 14, lineHeight: 21, color: COLORS.primary },
});

export const authButtonText = { ...TYPOGRAPHY.label, fontSize: 14, lineHeight: 20 };
