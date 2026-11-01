/**
 * 검사·마법사·궁수의 미리보기와 선택 화면입니다.
 * 기본 저장은 LearningProgressContext 안에서만 반영하며 API 저장은 선택 콜백을 따로 연결해야 합니다.
 */
import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import Screen from '../../components/ui/Screen';
import LerenCharacter from '../../components/common/LerenCharacter';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import { useLearningProgress } from '../../context/LearningProgressContext';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

export type JobId = 'warrior' | 'mage' | 'archer';
export interface SaveJobResult { success: boolean }
export interface JobSelectionScreenProps {
  onBack?: () => void;
  onSaveJob?: (job: JobId) => SaveJobResult | Promise<SaveJobResult>;
  onComplete?: (job: JobId) => void;
}
const JOBS: { id: JobId; name: string; description: string; image: ImageSourcePropType }[] = [
  { id: 'warrior', name: '검사', description: '검과 용기로 지식을 탐험하는 영웅', image: require('../../../assets/characters/leren_warrior.png') },
  { id: 'mage', name: '마법사', description: '지팡이와 지식으로 모험하는 영웅', image: require('../../../assets/characters/leren_mage.png') },
  { id: 'archer', name: '궁수', description: '집중과 통찰로 길을 찾는 영웅', image: require('../../../assets/characters/leren_archer.png') },
];
export default function JobSelectionScreen({ onSaveJob, onComplete }: JobSelectionScreenProps = {}) {
  const { setJob } = useLearningProgress();
  const { width } = useWindowDimensions();
  // 390px 기준 이미지 88px를 유지하고 작은 기기에서는 카드 안에 맞춰 비율을 줄입니다.
  const imageSize = Math.max(40, Math.min(88, (Math.min(width, 440) - 48 - 24) / 3 - 18));
  const [selection, setSelection] = useState<JobId | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const selected = JOBS.find((job) => job.id === selection);
  // 선택만으로 저장하지 않고 시작 버튼에서 반영하여, 뒤로 나가도 기존 직업을 유지합니다.
  const submit = async () => {
    if (!selection || busy) return;
    setBusy(true);
    setError(false);
    try {
      if (onSaveJob && !(await onSaveJob(selection)).success) throw new Error('save');
      setJob(selection);
      if (onComplete) onComplete(selection);
      else router.replace('/home');
    } catch { setError(true); }
    finally { setBusy(false); }
  };
  return (
    <Screen title="직업 선택">
      {!selected && <LerenCard title="어떤 영웅과 함께할까요?" description="마음에 드는 직업을 선택해 주세요." variant="info" />}
      <View style={styles.jobs}>
        {JOBS.map((job) => (
          <Pressable key={job.id} accessibilityRole="button" accessibilityLabel={`${job.name} 선택`} accessibilityState={{ selected: selection === job.id, disabled: busy }} disabled={busy} onPress={() => { setSelection(job.id); setError(false); }} style={[styles.job, selection === job.id && styles.selected]}>
            <LerenCharacter source={job.image} size={imageSize} accessibilityLabel={job.name} />
            <Text style={styles.jobName}>{job.name}</Text>
          </Pressable>
        ))}
      </View>
      {selected && !error && <LerenCard variant="info">
        {selected.id === 'mage' && <LerenCharacter source={selected.image} size={64} accessibilityLabel="선택한 마법사" />}
        <Text style={styles.previewTitle}>{selected.name}</Text>
        <Text style={styles.hint}>{selected.description}</Text>
      </LerenCard>}
      {error && <LerenCard title="선택을 저장하지 못했어요" description={`연결 상태를 확인하고 다시 시도해 주세요.\n선택한 ${selected?.name || '직업'}는 그대로 유지했어요.`} variant="error" />}
      <LerenButton title={error ? '다시 저장하고 시작' : selected ? `${selected.name}로 모험 시작` : '직업을 선택해 주세요'} disabled={!selected} loading={busy} onPress={submit} />
      {error && <LerenButton title="직업 다시 고르기" variant="secondary" onPress={() => { setSelection(null); setError(false); }} />}
      <Text style={styles.hint}>{selected ? '직업을 골라도 학습 경로와 완료 조건은 같아요.' : '직업은 나중에 마이페이지에서 바꿀 수 있어요.'}</Text>
    </Screen>
  );
}
const styles = StyleSheet.create({
  jobs: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  job: { flex: 1, minWidth: 0, paddingHorizontal: 4, paddingVertical: 8, minHeight: 134, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.line, borderRadius: 16, backgroundColor: COLORS.surface },
  selected: { borderColor: COLORS.primary, backgroundColor: COLORS.soft },
  jobName: { ...TYPOGRAPHY.label, color: COLORS.ink, textAlign: 'center' },
  previewTitle: { ...TYPOGRAPHY.heading, color: COLORS.ink },
  hint: { ...TYPOGRAPHY.small, color: COLORS.muted },
});
