/**
 * 피그마 19번 마이페이지입니다. 현재 영웅과 성장 요약을 보여주고 각 개인 화면으로 연결합니다.
 * 프로필·코인·진행도는 서버 대신 공통 LearningProgressContext를 읽어 다른 화면의 변경과 함께 갱신됩니다.
 */
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import LerenCharacter from '../../components/common/LerenCharacter';
import Screen from '../../components/ui/Screen';
import { LinkRow, Row } from '../../components/ui/Primitives';
import { useLearningProgress } from '../../context/LearningProgressContext';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { costumeTitle, HEROES } from './heroCatalog';

export default function MyPageScreen() {
  const { profile, completedSteps, equippedCostume } = useLearningProgress();
  return (
    <Screen title="마이페이지" back tabs>
      <View style={styles.hero}>
        <LerenCharacter source={HEROES[profile.job].image} size={64} accessibilityLabel={HEROES[profile.job].name} />
        <Text style={styles.heading}>{profile.nickname} · {HEROES[profile.job].name}</Text>
        <Text style={styles.description}>{costumeTitle(equippedCostume, profile.job)} 장착 · {profile.coins.toLocaleString()} 코인</Text>
      </View>
      <Row>
        {[{ value: `Lv.${profile.level}`, label: '전체 레벨' }, { value: `Lv.${profile.economyLevel}`, label: '경제 레벨' }, { value: `${completedSteps.length}개`, label: '완료 단계' }].map(item => <View key={item.label} style={styles.stat}><Text style={styles.value}>{item.value}</Text><Text style={styles.micro}>{item.label}</Text></View>)}
      </Row>
      <LinkRow title="학습 통계" subtitle="학습률 · 개념별 정답률" onPress={() => router.push('/statistics')} />
      <LinkRow title="학습 달력" subtitle="기록과 예정 일정" onPress={() => router.push('/calendar')} />
      <LinkRow title="직업·보유 코스튬" subtitle="나의 영웅 꾸미기" onPress={() => router.push('/wardrobe')} />
      <LinkRow title="코스튬 상점" subtitle="코인으로 꾸미기" onPress={() => router.push('/shop')} />
      <LinkRow title="프로필·설정" subtitle="알림 · 계정 관리" onPress={() => router.push('/settings')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: COLORS.soft, padding: 16, borderRadius: 16, gap: 10 },
  heading: { ...TYPOGRAPHY.heading, color: COLORS.ink },
  description: { ...TYPOGRAPHY.small, color: COLORS.muted },
  stat: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: COLORS.soft, gap: 6 },
  value: { ...TYPOGRAPHY.heading, color: COLORS.primary },
  micro: { ...TYPOGRAPHY.micro, color: COLORS.muted },
});
