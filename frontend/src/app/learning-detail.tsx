import { useLocalSearchParams } from 'expo-router';
import Screen from '../components/ui/Screen';
import { Notice } from '../components/ui/Primitives';
import { RecordDetail } from '../components/ui/HistoryRecords';
import { isLearningId } from '../services/learningApi';

export default function LearningDetail() {
  const { recordType, recordId } = useLocalSearchParams<{ recordType?: string; recordId?: string }>();
  return <Screen title="학습 상세" tabs>{recordType && isLearningId(recordId)
    ? <RecordDetail record={{ recordType, recordId }} /> : <Notice>학습 이력에서 기록을 선택해 주세요.</Notice>}</Screen>;
}
