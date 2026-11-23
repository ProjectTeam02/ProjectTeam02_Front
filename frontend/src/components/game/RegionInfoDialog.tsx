/** 경제 탐험 지도 전용 단일 버튼 안내창.
 * 다른 화면에서 사용하는 ConfirmDialog의 동작은 변경하지 않는다.
 */
import { Modal, StyleSheet, Text, View } from 'react-native';
import LerenButton from '../common/LerenButton';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

type Props = {
  visible: boolean;
  title: string;
  introduction: string;
  detail: string;
  onClose: () => void;
};

export default function RegionInfoDialog({
  visible,
  title,
  introduction,
  detail,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.introduction}>{introduction}</Text>
          <Text style={styles.detail}>{detail}</Text>
          <LerenButton title="알겠어요" onPress={onClose} style={styles.confirm} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    padding: 22,
    gap: 12,
  },
  title: { ...TYPOGRAPHY.heading, color: COLORS.ink },
  introduction: { ...TYPOGRAPHY.body, color: COLORS.ink, fontWeight: '700', lineHeight: 23 },
  detail: { ...TYPOGRAPHY.body, color: COLORS.muted, lineHeight: 22 },
  confirm: { width: '100%', marginTop: 6 },
});
