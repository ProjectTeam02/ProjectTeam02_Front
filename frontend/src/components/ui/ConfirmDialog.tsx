/** 웹과 네이티브에서 동일하게 동작하는 확인창입니다. */
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import LerenButton from '../common/LerenButton';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({ visible, title, message, confirmLabel, busy = false, onCancel, onConfirm }: Props) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!busy) onCancel(); }}>
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <LerenButton title="취소" variant="secondary" disabled={busy} onPress={onCancel} />
          <LerenButton title={confirmLabel} disabled={busy} loading={busy} onPress={onConfirm} />
        </View>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', padding: 24 },
  panel: { backgroundColor: '#fff', width: '100%', maxWidth: 420, borderRadius: 16, padding: 24, gap: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  message: { fontSize: 14, lineHeight: 22 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' },
});
