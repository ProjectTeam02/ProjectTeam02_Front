/**
 * 탐험 지도 테스트 UI. 현재는 9개 샘플 지역과 진행 상태를 표시하며 실제 학습 데이터·화면 이동은 추가 연결이 필요합니다.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import StageCard from '../../components/game/StageCard';
import type { StageStatus } from '../../components/game/StageCard';
import StagePath from '../../components/game/StagePath';

const C = {
  primary: '#1D3F91',
  ink: '#182842',
  muted: '#68778E',
  soft: '#EAF0FF',
  line: '#DCE5F0',
  white: '#FFFFFF',
};

// 기존 지도 미리보기의 번호입니다. 서버의 UUID stageId와는 별도입니다.
interface Stage {
  id: number;
  title: string;
  prerequisite: number | null;
}

interface MapPreview {
  completed: number[];
  stage1: string | null;
  modal: number | null;
}

const STAGES: Stage[] = [
  { id: 1, title: '경제 기초', prerequisite: null },
  { id: 2, title: '물가와\n인플레이션', prerequisite: 1 },
  { id: 3, title: '금리와 대출', prerequisite: 2 },
  { id: 4, title: '환율과\n국제무역', prerequisite: 3 },
  { id: 5, title: '채권과\n채권가격', prerequisite: 3 },
  { id: 6, title: '듀레이션', prerequisite: 5 },
  { id: 7, title: '은행과 예금', prerequisite: 1 },
  { id: 8, title: '신용창출', prerequisite: 7 },
  { id: 9, title: '통화승수', prerequisite: 8 },
];

const LEFT_STAGES = [2, 3, 4, 5, 6];
const RIGHT_STAGES = [7, 8, 9];

// 개발 중 확인할 완료/진행/잠금 팝업의 샘플 조합. 서비스 데이터가 아닙니다.
const PREVIEWS = {
  default: { completed: [], stage1: '1 / 3 완료', modal: null },
  first: { completed: [], stage1: '시작하기', modal: null },
  complete: { completed: [1], stage1: null, modal: null },
  locked: { completed: [], stage1: '1 / 3 완료', modal: 5 },
  locked2: { completed: [], stage1: '1 / 3 완료', modal: 2 },
  locked3: { completed: [], stage1: '1 / 3 완료', modal: 3 },
  locked4: { completed: [], stage1: '1 / 3 완료', modal: 4 },
  locked5: { completed: [], stage1: '1 / 3 완료', modal: 5 },
  locked6: { completed: [], stage1: '1 / 3 완료', modal: 6 },
  locked7: { completed: [], stage1: '1 / 3 완료', modal: 7 },
  locked8: { completed: [], stage1: '1 / 3 완료', modal: 8 },
  locked9: { completed: [], stage1: '1 / 3 완료', modal: 9 },
} satisfies Record<string, MapPreview>;

export type MapPreviewState = keyof typeof PREVIEWS;
export type PreviewTab = '홈' | '탐험' | '복습' | 'AI 질문' | '마이';

// 외부 진행도 값이 없으면 샘플을 사용합니다. 실제 API의 UUID는 별도 매핑이 필요합니다.
export interface ExplorationMapScreenProps {
  previewState?: MapPreviewState;
  completedStageIds?: number[];
  stage1CompletedSteps?: number;
  onBack?: () => void;
  onOpenStage?: (stageNumber: number) => void;
  onTabPress?: (tab: PreviewTab) => void;
  showPreviewTabBar?: boolean;
}

const PREVIEW_TABS: [string, PreviewTab][] = [
  ['⌂', '홈'], ['◇', '탐험'], ['✓', '복습'], ['✦', 'AI 질문'], ['○', '마이'],
];

function cleanTitle(title: string) {
  return title.replace(/\n/g, ' ');
}

export default function ExplorationMapScreen({
  previewState = 'default',
  completedStageIds,
  stage1CompletedSteps,
  onBack,
  onOpenStage,
  onTabPress,
  showPreviewTabBar = false,
}: ExplorationMapScreenProps = {}) {
  const preview: MapPreview = PREVIEWS[previewState] || PREVIEWS.default;

  // 실제 연동 시 외부에서 완료 상태를 전달받을 수 있음
  const completed = completedStageIds ?? preview.completed;

  const progressText =
    stage1CompletedSteps !== undefined
      ? `${stage1CompletedSteps} / 3 완료`
      : preview.stage1;

  const [lockedStage, setLockedStage] = useState<number | null>(preview.modal);
  const [previousPreview, setPreviousPreview] = useState(previewState);

  // 미리보기 변경 시 팝업만 초기화하고 불필요한 Effect 렌더링을 피합니다.
  if (previousPreview !== previewState) {
    setPreviousPreview(previewState);
    setLockedStage(preview.modal);
  }

  // 샘플 선행관계로 표시 상태를 계산합니다. 서버의 접근권한 검사를 대체하지 않습니다.
  const getStatus = (stage: Stage): StageStatus => {
    if (completed.includes(stage.id)) {
      return 'complete';
    }

    if (stage.id === 1) {
      return 'active';
    }

    if (stage.prerequisite !== null && completed.includes(stage.prerequisite)) {
      return 'available';
    }

    return 'locked';
  };

  // 잠긴 지역은 안내 팝업, 열린 지역은 부모의 이동 콜백으로 전달합니다.
  const handleStagePress = (stage: Stage) => {
    if (getStatus(stage) === 'locked') {
      setLockedStage(stage.id);
      return;
    }

    onOpenStage?.(stage.id);
  };

  const renderStage = (id: number) => {
    const stage = STAGES.find((item) => item.id === id);

    if (!stage) return null;

    return (
      <StageCard
        key={stage.id}
        number={stage.id}
        title={stage.title}
        status={getStatus(stage)}
        progress={
          stage.id === 1 ? progressText : undefined
        }
        requirement={
          stage.prerequisite
            ? `${stage.prerequisite}번 완료 필요`
            : undefined
        }
        onPress={() => handleStagePress(stage)}
      />
    );
  };

  const selectedLocked = STAGES.find(
    (stage) => stage.id === lockedStage
  );

  const previousStage = selectedLocked
    ? STAGES.find(
        (stage) => stage.id === selectedLocked.prerequisite
      )
    : null;

  const modalTitle =
    selectedLocked?.id === 6
      ? '먼저 채권 지역을 완료해 주세요'
      : selectedLocked
      ? `${cleanTitle(selectedLocked.title)}은 아직 열리지 않았어요`
      : '';

  const modalDescription =
    selectedLocked?.id === 6
      ? '듀레이션은 STAGE 5 · 채권과 채권가격을 완료하면 열려요.'
      : previousStage
      ? `STAGE ${previousStage.id} · ${cleanTitle(previousStage.title)}을 완료하면 도전할 수 있어요.`
      : '';

  // 아직 완료하지 않았고 선행조건을 만족하는 첫 지역을 이어하기 대상으로 선택합니다.
  const currentStage = STAGES.find(
    (stage) => !completed.includes(stage.id) &&
      (stage.id === 1 || (stage.prerequisite !== null && completed.includes(stage.prerequisite)))
  ) || STAGES[0];

  // TODO(학습 연동): 고정된 3단계 표시는 실제 학습 단계 수와 진행도로 교체합니다.
  const currentProgress =
    currentStage.id === 1
      ? previewState === 'first'
        ? '학습을 시작해 보세요'
        : `${stage1CompletedSteps ?? (previewState === 'complete' ? 3 : 1)} / 3 단계 완료`
      : '학습 가능';

  const continueLabel =
    currentStage.id === 1
      ? previewState === 'first'
        ? '경제 기초 시작하기'
        : '경제 기초 이어하기'
      : `${cleanTitle(currentStage.title)} 학습하기`;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      {/* 고정 헤더 */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <Text style={styles.headerTitle}>경제 탐험</Text>
      </View>

      {/* 스크롤 영역 */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 경제 탐험 지도 */}
        <View style={styles.map}>
          <Text style={styles.mapTitle}>
            경제 지식 탐험 · 9개 지역
          </Text>

          <Text style={styles.mapDescription}>
            완료한 지역에서 새로운 길이 열려요
          </Text>

          {/* 첫 번째 스테이지 */}
          <View style={styles.firstStage}>
            {renderStage(1)}
          </View>

          {/* 두 갈래 분기 */}
          <StagePath type="branch" height={28} />

          <View style={styles.columns}>
            {/* 왼쪽 경로 */}
            <View style={styles.column}>
              {LEFT_STAGES.map((id, index) => (
                <React.Fragment key={id}>
                  {index > 0 && (
                    <StagePath
                      type="vertical"
                      height={26}
                    />
                  )}
                  {renderStage(id)}
                </React.Fragment>
              ))}
            </View>

            {/* 오른쪽 경로 */}
            <View style={styles.column}>
              {RIGHT_STAGES.map((id, index) => (
                <React.Fragment key={id}>
                  {index > 0 && (
                    <StagePath
                      type="vertical"
                      height={26}
                    />
                  )}
                  {renderStage(id)}
                </React.Fragment>
              ))}
            </View>
          </View>

          <View style={styles.mapBottomSpace} />
        </View>

        {/* 현재 지역 카드 */}
        <Pressable
          style={styles.currentRegionCard}
          onPress={() => onOpenStage?.(currentStage.id)}
          accessibilityRole="button"
        >
          <View style={styles.currentRegionInfo}>
            <Text style={styles.currentRegionTitle}>
              현재 지역 · {cleanTitle(currentStage.title)}
            </Text>

            <Text style={styles.currentRegionProgress}>
              {currentProgress}
            </Text>
          </View>

          <Text style={styles.currentRegionArrow}>›</Text>
        </Pressable>

        {/* 이어하기 버튼 */}
        <Pressable
          style={styles.continueButton}
          onPress={() => onOpenStage?.(currentStage.id)}
          accessibilityRole="button"
        >
          <Text style={styles.continueButtonText}>
            {continueLabel}
          </Text>
        </Pressable>
      </ScrollView>

      {/* 테스트용 하단 탭바 */}
      {showPreviewTabBar && (
        <View style={styles.tabBar}>
          {PREVIEW_TABS.map(([icon, label]) => (
            <Pressable
              key={label}
              style={styles.tab}
              onPress={() => onTabPress?.(label)}
            >
              <Text
                style={[
                  styles.tabIcon,
                  label === '탐험' && styles.activeTab,
                ]}
              >
                {icon}
              </Text>

              <Text
                style={[
                  styles.tabText,
                  label === '탐험' && styles.activeTab,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* 잠금 팝업 */}
      <Modal
        visible={lockedStage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLockedStage(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {modalTitle}
            </Text>

            <Text style={styles.modalDescription}>
              {modalDescription}
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => setLockedStage(null)}
            >
              <Text style={styles.primaryButtonText}>
                알겠어요
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => setLockedStage(null)}
            >
              <Text style={styles.secondaryButtonText}>
                닫기
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// 이 화면/컴포넌트의 배치·색상·크기 정의. 최종 UI는 디자인 기준과 기기에서 확인합니다.
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.white,
  },

  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  backButton: {
    width: 24,
    height: 44,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: C.ink,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.ink,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 20,
    alignItems: 'center',
  },

  map: {
    width: '100%',
    maxWidth: 390,
    padding: 12,
    backgroundColor: C.soft,
    borderRadius: 16,
  },
  mapTitle: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    color: C.primary,
  },
  mapDescription: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: C.muted,
  },
  firstStage: {
    width: '46%',
    alignSelf: 'center',
    marginTop: 28,
  },
  columns: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  mapBottomSpace: {
    height: 44,
  },

  currentRegionCard: {
    width: '100%',
    maxWidth: 390,
    minHeight: 70,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    backgroundColor: C.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentRegionInfo: {
    flex: 1,
    gap: 6,
  },
  currentRegionTitle: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    color: C.ink,
  },
  currentRegionProgress: {
    fontSize: 12,
    lineHeight: 18,
    color: C.muted,
  },
  currentRegionArrow: {
    fontSize: 24,
    color: C.muted,
    marginLeft: 12,
  },

  continueButton: {
    width: '100%',
    maxWidth: 390,
    height: 48,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
  },

  tabBar: {
    height: 66,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: C.line,
    backgroundColor: C.white,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabIcon: {
    fontSize: 22,
    color: C.muted,
  },
  tabText: {
    fontSize: 10,
    color: C.muted,
  },
  activeTab: {
    color: C.primary,
    fontWeight: '700',
  },

  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(24,40,66,0.40)',
  },
  modal: {
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
    padding: 24,
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: C.ink,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: C.muted,
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.primary,
  },
});
