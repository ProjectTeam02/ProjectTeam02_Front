/** 웹과 네이티브에서 동일하게 동작하는 확인창입니다. */
import { Modal, StyleSheet, Text, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import LerenButton from '../common/LerenButton';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  children?: React.ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({ visible, title, message, confirmLabel, cancelLabel = '취소', children, busy = false, onCancel, onConfirm }: Props) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!busy) onCancel(); }}>
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {children}
        <View style={styles.actions}>
          <LerenButton title={cancelLabel} variant="secondary" style={styles.button} disabled={busy} onPress={onCancel} />
          <LerenButton title={confirmLabel} style={styles.button} disabled={busy} loading={busy} onPress={onConfirm} />
        </View>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', padding: 24 },
  panel: { backgroundColor: COLORS.surface, width: '100%', maxWidth: 420, borderRadius: 16, padding: 24, gap: 16 },
  title: { ...TYPOGRAPHY.heading, color: COLORS.ink },
  message: { ...TYPOGRAPHY.body, color: COLORS.muted },
  actions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  button: { flexGrow: 1, flexBasis: 100, width: undefined },
});
