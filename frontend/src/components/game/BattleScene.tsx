/** 서버 채점 피드백이 도착했을 때 공격하는 쪽만 한 걸음 전진합니다. */
import { useEffect, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { Body, Progress, Row } from '../ui/Primitives';

interface Props {
  boss: boolean; hero?: ImageSourcePropType; hp: number; maxHp?: number;
  feedback?: { isCorrect: boolean; quizId: string } | null;
}
export default function BattleScene({ boss, hero, hp, maxHp, feedback }: Props) {
  const [step] = useState(() => new Animated.Value(0));
  useEffect(() => {
    step.setValue(0);
    if (!feedback) return;
    const attack = Animated.sequence([
      Animated.timing(step, { toValue: feedback.isCorrect ? 30 : -30, duration: 190, useNativeDriver: true }),
      Animated.timing(step, { toValue: 0, duration: 230, useNativeDriver: true }),
    ]);
    attack.start();
    return () => attack.stop();
  }, [feedback, step]);
  return <View style={s.arena}>
    <Row style={s.head}><Text style={s.label}>{boss ? '지식 골렘' : '선택 슬라임'}</Text><Body>HP {hp}{maxHp !== undefined ? ' / ' + maxHp : ''}</Body></Row>
    {!!maxHp && <Progress value={hp / maxHp} />}
    <View style={s.field}>
      <Animated.View style={{ transform: [{ translateX: feedback?.isCorrect ? step : 0 }] }}>
        {hero ? <Image source={hero} resizeMode="contain" style={s.hero} accessibilityLabel="내 영웅" /> : <Body>내 영웅</Body>}
      </Animated.View>
      <Text style={s.vs}>VS</Text>
      <Animated.View style={{ transform: [{ translateX: feedback && !feedback.isCorrect ? step : 0 }] }}>
        <Image source={boss ? require('../../../assets/monsters/knowledge_golem.png') : require('../../../assets/monsters/slime.png')}
          style={boss ? s.boss : s.hero} resizeMode="contain" accessibilityLabel={boss ? '지식 골렘' : '선택 슬라임'} />
      </Animated.View>
    </View>
  </View>;
}
const s = StyleSheet.create({
  arena: { borderColor: COLORS.line, borderWidth: 1, borderRadius: 16, padding: 14, gap: 8, backgroundColor: COLORS.soft },
  head: { justifyContent: 'space-between' }, label: { ...TYPOGRAPHY.label, color: COLORS.ink },
  field: { minHeight: 94, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  hero: { width: 72, height: 72 }, boss: { width: 88, height: 91 },
  vs: { alignSelf: 'center', color: COLORS.muted, ...TYPOGRAPHY.label },
});
