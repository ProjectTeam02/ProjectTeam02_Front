/**
 * 초기 직업 선택 테스트 UI. 선택값·미리보기·저장 실패/재시도를 관리하며 실제 저장은 onSaveJob으로 전달받습니다.
 */
import React, { useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/theme';
import LerenButton from '../../components/common/LerenButton';

// 직업 데이터 및 캐릭터 이미지
// 화면 내부의 식별자입니다. 서버 classCode와의 매핑은 연동 시 정의합니다.
export type JobId = 'warrior' | 'mage' | 'archer';
export type JobPreviewState = 'empty' | 'error' | JobId;

interface Job {
  id: JobId;
  name: string;
  description: string;
  image: ImageSourcePropType;
}

// 기존 화면 콜백 계약이며 서버 응답 DTO가 아닙니다.
export interface SaveJobResult {
  success: boolean;
}

export interface JobSelectionScreenProps {
  previewState?: JobPreviewState;
  onBack?: () => void;
  onSaveJob?: (job: JobId) => SaveJobResult | Promise<SaveJobResult>;
  onComplete?: (job: JobId) => void;
}

const JOBS: Job[] = [
  {
    id: 'warrior',
    name: '검사',
    description: '검과 용기로 지식을 탐험하는 영웅',
    image: require('../../../assets/characters/leren_warrior.png'),
  },
  {
    id: 'mage',
    name: '마법사',
    description: '지팡이와 지식으로 모험하는 영웅',
    image: require('../../../assets/characters/leren_mage.png'),
  },
  {
    id: 'archer',
    name: '궁수',
    description: '집중과 통찰로 길을 찾는 영웅',
    image: require('../../../assets/characters/leren_archer.png'),
  },
];

// Figma 상태별 초기 선택
function getInitialJob(previewState: JobPreviewState): JobId | null {
  if (previewState === 'warrior') return 'warrior';
  if (previewState === 'mage') return 'mage';
  if (previewState === 'archer') return 'archer';
  if (previewState === 'error') return 'mage';
  return null;
}

export default function JobSelectionScreen({
  previewState = 'empty',
  onBack,
  onSaveJob,
  onComplete,
}: JobSelectionScreenProps = {}) {
  const [selectedJob, setSelectedJob] = useState<JobId | null>(
    () => getInitialJob(previewState)
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(
    previewState === 'error'
  );

  const selected = JOBS.find(
    (job) => job.id === selectedJob
  );

  // 직업 선택
  const handleSelect = (jobId: JobId) => {
    if (saving) return;
    setSelectedJob(jobId);
    setSaveError(false);
  };

  // 직업 저장 요청. 화면의 소문자 JobId를 서버 classCode로 변환하는 통신 함수를 외부에서 연결합니다.
  const handleSave = async () => {
    if (!selectedJob || saving) return;

    setSaving(true);
    setSaveError(false);

    try {
      if (typeof onSaveJob !== 'function') {
        throw new Error('직업 저장 API 미연결');
      }

      const result = await onSaveJob(selectedJob);

      // 실제 저장이 확인된 경우에만 다음 화면 처리를 요청합니다.
      if (result?.success !== true) {
        throw new Error('직업 저장 실패');
      }

      if (typeof onComplete === 'function') {
        onComplete(selectedJob);
      }
    } catch {
      // 실패 시 선택 상태 유지
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  // 직업 다시 고르기
  const handleReset = () => {
    setSelectedJob(null);
    setSaveError(false);
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <Text style={styles.headerTitle}>직업 선택</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          {/* 12-01: 직업 미선택 안내 */}
          {!selected && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>
                어떤 영웅과 함께할까요?
              </Text>
              <Text style={styles.infoDescription}>
                마음에 드는 직업을 선택해 주세요.
              </Text>
            </View>
          )}

          {/* 공통: 직업 선택 카드 3개 */}
          <View style={styles.jobRow}>
            {JOBS.map((job) => {
              const isSelected = selectedJob === job.id;

              return (
                <Pressable
                  key={job.id}
                  style={[
                    styles.jobCard,
                    isSelected && styles.selectedJobCard,
                  ]}
                  onPress={() => handleSelect(job.id)}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Image
                    source={job.image}
                    style={styles.jobImage}
                    resizeMode="contain"
                  />

                  <Text style={styles.jobName}>
                    {job.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 12-02: 마법사 선택 미리보기 */}
          {!saveError && selected && selectedJob === 'mage' && (
            <View style={styles.magePreview}>
              <Image
                source={selected.image}
                style={styles.magePreviewImage}
                resizeMode="contain"
              />

              <Text style={styles.previewTitle}>
                마법사
              </Text>

              <Text style={styles.previewDescription}>
                {selected.description}
              </Text>
            </View>
          )}

          {/* 12-03, 12-04: 검사/궁수 선택 미리보기 */}
          {!saveError &&
            selected &&
            selectedJob !== 'mage' && (
              <View style={styles.compactPreview}>
                <Text style={styles.compactTitle}>
                  {selected.name}
                </Text>

                <Text style={styles.previewDescription}>
                  {selected.description}
                </Text>
              </View>
            )}

          {/* 12-05: 저장 실패. TODO(UI): 아래 고정된 마법사 문구를 선택 직업에 맞춰 변경 */}
          {saveError && (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>
                선택을 저장하지 못했어요
              </Text>

              <Text style={styles.errorDescription}>
                연결 상태를 확인하고 다시 시도해 주세요.
                {'\n'}
                선택한 마법사는 그대로 유지했어요.
              </Text>
            </View>
          )}

          {/* 시작 또는 재시도 버튼 */}
          <LerenButton
            title={
              saving
                ? '저장 중...'
                : saveError
                ? '다시 저장하고 시작'
                : selected
                ? `${selected.name}로 모험 시작`
                : '직업을 선택해 주세요'
            }
            onPress={handleSave}
            disabled={!selected || saving}
          />

          {/* 오류 상태에서만 다시 선택 버튼 표시 */}
          {saveError && (
            <LerenButton
              title="직업 다시 고르기"
              variant="secondary"
              onPress={handleReset}
            />
          )}

          {/* 하단 안내 문구 */}
          {!saveError && (
            <Text style={styles.footerText}>
              {selected
                ? '직업을 골라도 학습 경로와 완료 조건은 같아요.'
                : '직업은 나중에 마이페이지에서 바꿀 수 있어요.'}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 이 화면/컴포넌트의 배치·색상·크기 정의. 최종 UI는 디자인 기준과 기기에서 확인합니다.
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 50,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 24,
    height: 44,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.ink,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: COLORS.ink,
  },

  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 32,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 390,
    gap: 12,
  },

  infoCard: {
    backgroundColor: '#EAF0FF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  infoTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: COLORS.ink,
  },
  infoDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },

  jobRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  jobCard: {
    flex: 1,
    minWidth: 0,
    height: 134,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE5F0',
    borderRadius: 16,
  },
  selectedJobCard: {
    borderColor: '#1D3F91',
    backgroundColor: '#EAF0FF',
  },
  jobImage: {
    width: '100%',
    height: 88,
  },
  jobName: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'center',
  },

  magePreview: {
    minHeight: 160,
    backgroundColor: '#EAF0FF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    alignItems: 'flex-start',
  },
  magePreviewImage: {
    width: 64,
    height: 64,
  },
  previewTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: COLORS.ink,
  },
  previewDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },

  compactPreview: {
    minHeight: 90,
    padding: 16,
    gap: 10,
    backgroundColor: '#EAF0FF',
    borderRadius: 16,
  },
  compactTitle: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    color: COLORS.ink,
  },

  errorCard: {
    minHeight: 112,
    backgroundColor: '#FCEEF0',
    borderWidth: 1,
    borderColor: '#DCE5F0',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  errorTitle: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    color: COLORS.ink,
  },
  errorDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.muted,
  },

  footerText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },
});
