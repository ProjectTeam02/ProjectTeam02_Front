/** 검사·마법사·궁수 선택 화면입니다. 실제 직업 ID 조회와 변경 API를 연결합니다. */
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import Screen from '../../components/ui/Screen';
import LerenCharacter from '../../components/common/LerenCharacter';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import { ApiStatus } from '../../components/ui/ApiStatus';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useBackend, useBackendAction } from '../../hooks/useBackend';
import { useBackendProfile } from '../../context/BackendProfileContext';
import { JOB_PATHS, jobsDecoder, jobChangeDecoder, initialJobDecoder, type CharacterJob } from '../../services/jobApi';
import { useAuth } from '../../context/AuthContext';
import { backendRequest, PATHS, memberDecoder } from '../../services/backend';

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
const findJob = (items: CharacterJob[], job: JobId) => items.find(item => {
  const code = item.classCode.toLowerCase();
  return code === job || (job === 'warrior' && item.name === '검사') ||
    (job === 'mage' && item.name === '마법사') || (job === 'archer' && item.name === '궁수');
});

export default function JobSelectionScreen({ onBack, onSaveJob, onComplete }: JobSelectionScreenProps = {}) {
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const previewOnly = preview === '1';
  const { width } = useWindowDimensions();
  const imageSize = Math.max(40, Math.min(88, (Math.min(width, 440) - 48 - 24) / 3 - 18));
  const [selection, setSelection] = useState<JobId | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const jobs = useBackend(JOB_PATHS.list, jobsDecoder);
  const action = useBackendAction();
  const profile = useBackendProfile();
  const initialSelection = profile.status === 'success' && profile.data?.characterClass === null;
  const selected = JOBS.find(job => job.id === selection);
  const serverJob = selection ? findJob(jobs.data?.items ?? [], selection) : null;
  const { session } = useAuth();

  const submit = async () => {
    if (!selection || busy || action.busy || previewOnly) return;
    setBusy(true); setError('');
    try {
      if (onSaveJob) {
        if (!(await onSaveJob(selection)).success) { setError('직업을 저장하지 못했습니다.'); return; }
      } else {
        if (!serverJob) { setError('서버에서 선택한 직업 정보를 찾을 수 없습니다.'); return; }
        if (profile.status !== 'success') { setError('회원 정보를 확인한 뒤 다시 시도해 주세요.'); return; }
        const result = initialSelection
          ? await action.run(JOB_PATHS.initial, initialJobDecoder, 'PATCH', { classCode: serverJob.classCode })
          : await action.run(JOB_PATHS.change, jobChangeDecoder, 'PATCH', { classCode: serverJob.classCode });
        if (!result) { setError('직업 저장 요청에 실패했습니다.'); return; }
        profile.reload();
        if (!session) { setError('로그인 정보를 확인할 수 없습니다.'); return; }
        try {
          const updated = await backendRequest(session.accessToken, PATHS.me, memberDecoder);
          if (updated.characterClass?.classCode !== serverJob.classCode) {
            setError('저장된 직업 정보를 확인하지 못했습니다.'); return;
          }
        } catch {
           setError('저장 후 회원 정보를 확인하지 못했습니다. 마이페이지에서 현재 직업을 확인해 주세요.'); return;
       }
      }
      if (onComplete) { onComplete(selection);} else if (initialSelection) {router.replace('/home');} else {router.replace('/mypage');}
    } catch { setError('직업을 저장하지 못했습니다. 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  };

  return <Screen title={previewOnly ? '직업 미리보기' : initialSelection ? '첫 직업 선택' : '직업 변경'} onBack={onBack} preview={previewOnly}>
    {!selected && <LerenCard title="어떤 영웅과 함께할까요?" description="마음에 드는 직업을 선택해 주세요." variant="info" />}
    {!previewOnly && <ApiStatus resource={jobs} label="직업 목록" empty={jobs.data?.items.length === 0} />}
    <View style={styles.jobs}>
      {JOBS.map(job => <Pressable key={job.id} accessibilityRole="button" accessibilityLabel={`${job.name} 선택`}
        accessibilityState={{ selected: selection === job.id, disabled: busy || action.busy }}
        disabled={busy || action.busy} onPress={() => { setSelection(job.id); setError(''); }}
        style={[styles.job, selection === job.id && styles.selected]}>
        <LerenCharacter source={job.image} size={imageSize} accessibilityLabel={job.name} />
        <Text style={styles.jobName}>{job.name}</Text>
      </Pressable>)}
    </View>
    {selected && !error && <LerenCard variant="info">
      <LerenCharacter source={selected.image} size={64} accessibilityLabel={`선택한 캐릭터: ${selected.name}`} />
      <Text style={styles.previewTitle}>{selected.name}</Text>
      <Text style={styles.hint}>{selected.description}</Text>
    </LerenCard>}
    {!previewOnly && <>
      {!!error && <LerenCard title="선택을 저장하지 못했어요"
        description={`${error}\n선택한 ${selected?.name ?? '직업'}는 그대로 유지했어요.`} variant="error" />}
      {!!action.error && <Text style={styles.hint}>{action.error}</Text>}
      <LerenButton title={error ? '다시 저장하기' : selected ? `${selected.name}로 모험 시작` : '직업을 선택해 주세요'}
        disabled={!selection || busy || action.busy || jobs.status !== 'success' || (!onSaveJob && (!serverJob || profile.status !== 'success'))}
        loading={busy || action.busy} onPress={() => { void submit(); }} />
      {!!error && <LerenButton title="직업 다시 고르기" variant="secondary"
        onPress={() => { setSelection(null); setError(''); }} />}
      <Text style={styles.hint}>직업 선택은 서버에 저장되며, 저장 성공 후 화면을 이동합니다.</Text>
    </>}
  </Screen>;
}

const styles = StyleSheet.create({
  jobs: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  job: { flex: 1, minWidth: 0, paddingHorizontal: 4, paddingVertical: 8, minHeight: 134, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.line, borderRadius: 16, backgroundColor: COLORS.surface },
  selected: { borderColor: COLORS.primary, backgroundColor: COLORS.soft },
  jobName: { ...TYPOGRAPHY.label, color: COLORS.ink, textAlign: 'center' },
  previewTitle: { ...TYPOGRAPHY.heading, color: COLORS.ink },
  hint: { ...TYPOGRAPHY.small, color: COLORS.muted },
});