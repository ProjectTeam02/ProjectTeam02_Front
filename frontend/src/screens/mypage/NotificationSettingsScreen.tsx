
/** 피그마 26-04: 학습 알림 설정 조회 및 서버 저장 */
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Screen from '../../components/ui/Screen';
import { Notice } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import LerenInput from '../../components/common/LerenInput';
import LerenIcon from '../../components/common/LerenIcon';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { useBackend, useBackendAction } from '../../hooks/useBackend';
import { object, BackendError } from '../../services/backend';

const PATH = '/api/v1/users/me/notification-settings';

const settingDecoder = (value: unknown): { reminderEnabled: boolean; reminderTime: string | null } => {
  const data = object(value);
  if (typeof data.reminderEnabled !== 'boolean') throw new BackendError('알림 설정 응답이 올바르지 않습니다.');
  if (data.reminderTime !== null && data.reminderTime !== undefined && typeof data.reminderTime !== 'string') throw new BackendError('알림 시간 응답이 올바르지 않습니다.');
  return { reminderEnabled: data.reminderEnabled, reminderTime: typeof data.reminderTime === 'string' ? data.reminderTime : null };
};

const toDisplayTime = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return '';
  return `${hours >= 12 ? '오후' : '오전'} ${hours % 12 || 12}:${String(minutes).padStart(2, '0')}`;
};

const toServerTime = (value: string): string | null => {
  const match = value.trim().match(/^(오전|오후)\s*(\d{1,2}):([0-5]\d)$/);
  if (!match) return null;
  const hour = Number(match[2]);
  if (hour < 1 || hour > 12) return null;
  const hours = (hour % 12) + (match[1] === '오후' ? 12 : 0);
  return `${String(hours).padStart(2, '0')}:${match[3]}:00`;
};

export default function NotificationSettingsScreen() {
  const settings = useBackend(PATH, settingDecoder);
  const action = useBackendAction();
  const [editedEnabled, setEnabled] = useState<boolean | null>(null);
  const [editedTime, setTime] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const initialized = settings.data !== null;
  const enabled = editedEnabled ?? settings.data?.reminderEnabled ?? null;
  const time = editedTime ?? (settings.data?.reminderTime ? toDisplayTime(settings.data.reminderTime) : '오후 8:00');
  const serverTime = toServerTime(time);

  const save = async () => {
    setSubmitted(true);
    if (enabled === null || (enabled && !serverTime) || action.busy) return;
    setSaved(false);
    const body = { reminderEnabled: enabled, ...(enabled && serverTime ? { reminderTime: serverTime } : {}), timezone: 'Asia/Seoul' };
    const result = await action.run(PATH, settingDecoder, 'PATCH', body);
    if (!result) return;
    setEnabled(result.reminderEnabled);
    setTime(result.reminderTime ? toDisplayTime(result.reminderTime) : time);
    setSaved(true);
    settings.reload();
  };

  return <Screen title="학습 알림" back tabs>
    {settings.status === 'loading' && <Notice>학습 알림 설정을 불러오는 중이에요.</Notice>}
    {settings.status === 'idle' && <Notice>학습 알림을 설정하려면 로그인이 필요해요.</Notice>}
    {settings.status === 'error' && <>
      <Notice tone="error">{settings.error}</Notice>
      <LerenButton title="다시 조회" variant="secondary" onPress={settings.reload} />
    </>}
    {initialized && <>
      <View style={{ flexDirection: 'row', backgroundColor: '#F4F6FA', borderRadius: 10, padding: 4, gap: 4 }}>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: enabled === true }} disabled={action.busy}
          onPress={() => { setEnabled(true); setSaved(false); }}
          style={{ flex: 1, minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 8, backgroundColor: enabled === true ? COLORS.surface : 'transparent', borderWidth: enabled === true ? 1 : 0, borderColor: COLORS.line }}>
          <LerenIcon name="Bell" size={16} color={enabled === true ? COLORS.primary : COLORS.muted} />
          <Text style={{ ...TYPOGRAPHY.small, color: enabled === true ? COLORS.primary : COLORS.muted, fontWeight: enabled === true ? '700' : '400' }}>알림 켜기</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: enabled === false }} disabled={action.busy}
          onPress={() => { setEnabled(false); setSaved(false); }}
          style={{ flex: 1, minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 8, backgroundColor: enabled === false ? COLORS.surface : 'transparent', borderWidth: enabled === false ? 1 : 0, borderColor: COLORS.line }}>
          <LerenIcon name="BellOff" size={16} color={enabled === false ? COLORS.primary : COLORS.muted} />
          <Text style={{ ...TYPOGRAPHY.small, color: enabled === false ? COLORS.primary : COLORS.muted, fontWeight: enabled === false ? '700' : '400' }}>알림 끄기</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <LerenIcon name="Clock" size={18} />
        <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink }}>학습 알림 시간</Text>
      </View>
      <LerenInput label="학습 알림 시간" value={time} onChangeText={value => { setTime(value); setSaved(false); }}
        placeholder="오후 8:00" editable={enabled === true && !action.busy}
        hint="학습할 시간을 정해 보세요"
        error={(editedTime !== null || submitted) && enabled === true && !serverTime ? '알림 시간을 올바르게 입력해 주세요.' : ''} />
      {enabled === false && <View style={{ backgroundColor: '#FFF4E3', borderRadius: 12, padding: 14, gap: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <LerenIcon name="BellOff" size={18} color="#94621D" />
          <Text style={{ ...TYPOGRAPHY.label, color: '#94621D' }}>알림 권한이 꺼져 있어요</Text>
        </View>
        <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>기기 설정에서 LEREN 알림을 허용하면 학습 시간을 알려 드릴 수 있어요.</Text>
      </View>}
      <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, padding: 12, gap: 10 }}>
        <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: COLORS.soft, alignItems: 'center', justifyContent: 'center' }}>
          <LerenIcon name="Settings" size={18} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ ...TYPOGRAPHY.label, color: COLORS.ink }}>알림 권한</Text>
          <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>기기 설정에서 허용하기</Text>
        </View>
      </View>
      <Notice>현재는 서버에 알림 설정만 저장돼요. 실제 기기 알림 권한과 푸시 발송은 아직 연결되지 않았어요.</Notice>
      {!!action.error && <Notice tone="error">{action.error}</Notice>}
      {saved && <Notice tone="success">학습 알림 설정을 저장했어요.</Notice>}
      <LerenButton title="설정 저장" loading={action.busy} disabled={action.busy || enabled === null || (enabled && !serverTime)} onPress={() => { void save(); }} />
      <Text style={{ ...TYPOGRAPHY.small, color: COLORS.muted }}>알림을 끄더라도 학습 달력의 일정은 확인할 수 있어요.</Text>
    </>}
  </Screen>;
}
