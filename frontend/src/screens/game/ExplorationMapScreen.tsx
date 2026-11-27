/**
 * Figma 13-01~13-03 경제 대륙 지도.
 *
 * - 9개 섬/점선/이름표가 포함된 최종 지도를 내부 ScrollView에 표시한다.
 * - 고정된 543px 대신 flex:1을 사용해 버튼이 빠진 만큼 스크롤 화면을 늘린다.
 * - 섬 9개는 API 데이터 유무와 관계없이 항상 보인다.
 * - 잠금/도전 가능/완료 배지는 GET /api/v1/topics/:topicId/stages의 실제 상태로만 결정한다.
 * - 새 지도 원본에는 상태 배지가 없으므로 모든 지역에 서버 상태 배지를 그린다.
 * - 화면에 다시 진입하면 useLearningQuery가 서버 상태를 새로 조회한다.
 * - 기존 Screen 헤더/하단 탭, /steps 라우트 및 학습 로직을 변경하지 않는다.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import {Image,Pressable, ScrollView,StyleSheet,Text,View,type LayoutChangeEvent,type ScrollViewInstance,} from 'react-native';
import Screen from '../../components/ui/Screen';
import RegionInfoDialog from '../../components/game/RegionInfoDialog';
import { ApiStatus } from '../../components/ui/ApiStatus';
import { mapArtwork, mapBadges } from '../../constants/mapAssets';
import {
  MAP_BASE_HEIGHT,
  MAP_BASE_WIDTH,
  MAP_LAYOUT,
  MAP_BADGES,
  MAP_PREREQUISITES,
  MAP_TITLES,
  MAP_SUBJECTS,
  REGION_NUMBERS,
  type RegionNumber,
} from '../../constants/mapLayout';
import { useLearningQuery } from '../../hooks/useLearningQuery';
import {
  LEARNING_PATHS,
  topicsDecoder,
  stagesDecoder,
  type Topic,
} from '../../services/learningApi';

type RegionStatus =
  | 'loading'
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'complete'
  | 'unavailable'
  | 'error';
type DialogInfo = { title: string; introduction: string; detail: string };

function openTopic(topic: Topic) {
  router.push({ pathname: '/steps', params: { topicId: topic.topicId } });
}

/** 9개 지역 각각에 고정된 터치 영역. 상태는 백엔드가 내려준 Stage 진행도로 결정한다. */
function RegionHotspot({
  number,
  topic,
  topicListStatus,
  reloadTopics,
  scale,
  onStatusChange,
  onDialog,
}: {
  number: RegionNumber;
  topic?: Topic;
  topicListStatus: 'idle' | 'loading' | 'success' | 'error';
  reloadTopics: () => void;
  scale: number;
  onStatusChange: (number: RegionNumber, status: RegionStatus) => void;
  onDialog: (info: DialogInfo) => void;
}) {
  const path = topic ? LEARNING_PATHS.stages(topic.topicId) : null;
  const stages = useLearningQuery(path, stagesDecoder);
  
  const steps = stages.data?.items ?? [];

  // 배열 순서가 아닌 stageNo 기준으로 첫 Stage 식별
  const firstStage = [...steps].sort(
    (a, b) => a.stageNo - b.stageNo
  )[0];

  // Boss Stage 식별
  const bossStage = steps.find(
    stage => stage.stageType === 'BOSS'
  );

  // 기존 사용자 학습 진행 상태 확인
  const hasProgress = steps.some(
    stage =>
      stage.progressStatus === 'IN_PROGRESS' ||
      stage.progressStatus === 'PASSED'
  );

  // 지역 상태는 서버 응답을 기준으로 결정
  const status: RegionStatus =
    topicListStatus === 'loading' ||
    topicListStatus === 'idle'
      ? 'loading'
      : topicListStatus === 'error'
        ? 'error'
        : !topic
          ? 'unavailable'
          : stages.status === 'loading' ||
              stages.status === 'idle'
            ? 'loading'
            : stages.status === 'error'
              ? 'error'
              : !firstStage || !bossStage
                ? 'unavailable'
                : bossStage.progressStatus === 'PASSED'
                  ? 'complete'
                  : !firstStage.isUnlocked
                    ? 'locked'
                    : hasProgress
                      ? 'in_progress'
                      : 'available';
  

  useEffect(() => {
    onStatusChange(number, status);
  }, [number, status, onStatusChange]);

  const area = MAP_LAYOUT[number];
  const badge =
  status === 'complete'
    ? 'complete'
    : status === 'available' ||
        status === 'in_progress'
      ? 'available'
      : 'locked';
  // 확정한 지도에는 배지가 없으므로 1~9번 모두 상태 이미지를 별도로 그립니다.
  const badgeWidth = badge === 'available' ? 88 : badge === 'complete' ? 65 : 62;
  const badgeHeight = 25;
  const badgeTop = (MAP_BADGES[number].y - area.y) * scale;

  const onPress = () => {
    if (status === 'loading') return;

    // The island's fantasy name is the theme; the subject is the actual learning content.
    const title = MAP_TITLES[number];
    const introduction = `이 섬에서는 ‘${MAP_SUBJECTS[number]}’ 주제를 배워요.`;

    if (status === 'error') {
      if (topicListStatus === 'error') {
        reloadTopics();
      } else if (topic) {
        stages.reload();
      }
      onDialog({
        title,
        introduction,
        detail: '학습 정보를 불러오지 못했어요. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
      });
      return;
    }

    if (status === 'unavailable') {
      onDialog({
        title,
        introduction,
        detail: '아직 공개된 학습 정보가 없어요. 콘텐츠가 공개되면 입장할 수 있어요.',
      });
      return;
    }

    if (status === 'locked') {
      const requiredNames = MAP_PREREQUISITES[number].map(n => `‘${MAP_TITLES[n]}’`);
      const previousNames = requiredNames.join(', ');
      onDialog({
        title,
        introduction,
        detail: previousNames
          ? `${previousNames}의 필수 학습을 완료한 뒤 다시 확인해 주세요.`
          : '이 지역은 아직 잠겨 있어요. 선행 학습을 마친 뒤 다시 확인해 주세요.',
      });
      return;
    }

    if (topic) openTopic(topic);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${number}번 ${MAP_TITLES[number]}, ${status === 'complete' ? '완료' : status === 'available' ? '도전 가능' : status === 'in_progress' ? '진행 중' : status === 'locked' ? '잠금' : status === 'error' ? '재시도' : status === 'unavailable' ? '준비 중' : '확인 중'}`}
      onPress={onPress}
      style={[
        styles.hotspot,
        {
          left: area.x * scale,
          top: area.y * scale,
          width: area.width * scale,
          height: area.height * scale,
        },
      ]}
    >
      {status === 'loading' || status === 'error' || status === 'unavailable' ? (
        <View style={[
          styles.pendingBadge,
          {
            top: badgeTop,
            left: (MAP_BADGES[number].cx - area.x - 39) * scale,
            width: 78 * scale,
            height: badgeHeight * scale,
            borderRadius: 12 * scale,
          },
        ]}>
          <Text style={[styles.pendingText, { fontSize: 10 * scale }]}>
            {status === 'loading' ? '조회 중' : status === 'error' ? '재시도' : '준비 중'}
          
          </Text>
        </View>
      ) : status === 'in_progress' ? (
        <View
          style={[
            styles.pendingBadge,
            {
              top: badgeTop,
              left: (MAP_BADGES[number].cx - area.x - 39) * scale,
              width: 78 * scale,
              height: badgeHeight * scale,
              borderRadius: 12 * scale,
              backgroundColor: '#2D4F95',
            },
          ]}
        >
          <Text
            style={[
              styles.pendingText,
              { fontSize: 10 * scale },
            ]}
          >
            진행 중
          </Text>
        </View>
      ) : (
        <Image
          source={mapBadges[badge]}
          resizeMode="stretch"
          style={{
            position: 'absolute',
            top: badgeTop,
            left: (MAP_BADGES[number].cx - area.x - badgeWidth / 2) * scale,
            width: badgeWidth * scale,
            height: badgeHeight * scale,
          }}
        />
      )}
    </Pressable>
  );
  
}

export default function ExplorationMapScreen() {
  const topics = useLearningQuery(LEARNING_PATHS.topics, topicsDecoder);
  const allTopics = topics.data?.items ?? [];
  const topicByNumber = new Map<number, Topic>(allTopics.map((topic): [number, Topic] => [topic.topicNo, topic]));

  const [mapWidth, setMapWidth] = useState(MAP_BASE_WIDTH);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [statuses, setStatuses] = useState<Partial<Record<RegionNumber, RegionStatus>>>({});
  const [dialog, setDialog] = useState<DialogInfo | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const initialScrollDone = useRef(false);

  const scale = mapWidth / MAP_BASE_WIDTH;
  const mapHeight = MAP_BASE_HEIGHT * scale;
  const onStatusChange = useCallback((number: RegionNumber, status: RegionStatus) => {
    setStatuses(prev => prev[number] === status ? prev : { ...prev, [number]: status });
  }, []);

  // 완료/잠금 표시만 서버 진행도에서 계산한다. 별도 시작 버튼은 사용하지 않는다.
  const inProgressNo = REGION_NUMBERS.find(n => statuses[n] === 'in_progress');
  const availableNo = REGION_NUMBERS.find(n => statuses[n] === 'available');
  const completeNo = REGION_NUMBERS.find(n => statuses[n] === 'complete');
  const currentRegionNo = inProgressNo ?? availableNo ?? completeNo ?? 1;

  const onViewportLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && Math.abs(width - mapWidth) > 0.5) {
      initialScrollDone.current = false;
      setMapWidth(width);
    }
    if (height > 0 && Math.abs(height - viewportHeight) > 0.5) {
      setViewportHeight(height);
    }
  };

  // 이미지가 준비되고 뷰포트 크기가 정해진 뒤 지도 맨 아래(1번 섬)로 이동.
  const scrollToStartIsland = useCallback(() => {
    if (initialScrollDone.current || viewportHeight <= 0 || mapHeight <= viewportHeight) return;
    scrollRef.current?.scrollToEnd({ animated: false });
    initialScrollDone.current = true;
  }, [mapHeight, viewportHeight]);
  useEffect(() => {
    if (!viewportHeight) return;
    const frame = requestAnimationFrame(scrollToStartIsland);
    return () => cancelAnimationFrame(frame);
  }, [viewportHeight, scrollToStartIsland]);

  return (
    <Screen
      title="경제 탐험"
      tabs
      scroll={false}
    >
      <RegionInfoDialog
        visible={dialog !== null}
        title={dialog?.title ?? ''}
        introduction={dialog?.introduction ?? ''}
        detail={dialog?.detail ?? ''}
        onClose={() => setDialog(null)}
      />
      <View style={styles.intro}>
        <View style={styles.introTitleRow}>
          <Text style={styles.heading}>경제 대륙 지도</Text>
          <View style={styles.regionPill}>
            <Text style={styles.regionPillText}>현재 지역 {String(currentRegionNo).padStart(2, '0')}</Text>
          </View>
        </View>
        <Text style={styles.hint}>{"아래쪽 '성장의 동굴'에서 시작해 위로 탐험하세요."}</Text>
      </View>
      {topics.status === 'error' && <ApiStatus resource={topics} label="경제 학습 주제" />}
      <View style={styles.mapViewport} onLayout={onViewportLayout}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={{ height: mapHeight }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          bounces={false}
          onContentSizeChange={scrollToStartIsland}
        >
          <View style={{ width: mapWidth, height: mapHeight }}>
            <Image
              source={mapArtwork}
              resizeMode="stretch"
              style={{ width: mapWidth, height: mapHeight }}
              accessibilityIgnoresInvertColors
            />
            {REGION_NUMBERS.map(number => (
              <RegionHotspot
                key={number}
                number={number}
                topic={topicByNumber.get(number)}
                topicListStatus={topics.status}
                reloadTopics={topics.reload}
                scale={scale}
                onStatusChange={onStatusChange}
                onDialog={setDialog}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginHorizontal: 6, gap: 5 },
  introTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { fontWeight: '800', fontSize: 22, color: '#142A50' },
  hint: { color: '#667999', fontSize: 12, lineHeight: 19 },
  regionPill: { backgroundColor: '#E6EEFF', paddingVertical: 5, paddingHorizontal: 11, borderRadius: 20 },
  regionPillText: { color: '#2D4F95', fontSize: 11, fontWeight: '700' },
  mapViewport: { width: '100%', flex: 1, minHeight: 0, overflow: 'hidden', borderRadius: 14, backgroundColor: '#41B7F5' },
  scroll: { flex: 1 },
  hotspot: { position: 'absolute' },
  pendingBadge: { position: 'absolute', backgroundColor: '#394663', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#17263A' },
  pendingText: { color: '#FFFFFF', fontWeight: '700' },
});
