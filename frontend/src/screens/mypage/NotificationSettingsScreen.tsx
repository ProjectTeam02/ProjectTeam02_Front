/**
 * 피그마 26-04: 학습 알림 현재 설정 조회 및 서버 저장
 * 구현 완료: 알림 설정 조회, 켜기·끄기, 알림 시간 변경, 서버 저장 및 오류 처리
 * 미구현: 실제 휴대폰 푸시 알림 발송 및 기기 알림 권한 요청·상태 조회
 * 주의: 현재는 백엔드에 알림 설정만 저장하며, 실제 휴대폰 알림이 발송되지는 않습니다.
 */
import { useEffect, useState } from 'react';
import Screen from '../../components/ui/Screen';
import { Chip, Notice, Row } from '../../components/ui/Primitives';
import LerenButton from '../../components/common/LerenButton';
import LerenCard from '../../components/common/LerenCard';
import LerenInput from '../../components/common/LerenInput';
import { useBackend, useBackendAction } from '../../hooks/useBackend';
import { object, BackendError } from '../../services/backend';

const PATH = '/api/v1/users/me/notification-settings';

/** 서버에서 받은 학습 알림 설정을 검증합니다. */
const settingDecoder = (value: unknown): { reminderEnabled: boolean; reminderTime: string | null } => {
  const data = object(value);
  if (typeof data.reminderEnabled !== 'boolean') throw new BackendError('알림 설정 응답이 올바르지 않습니다.');
  if (data.reminderTime !== null && data.reminderTime !== undefined && typeof data.reminderTime !== 'string') throw new BackendError('알림 시간 응답이 올바르지 않습니다.');
  return { reminderEnabled: data.reminderEnabled, reminderTime: typeof data.reminderTime === 'string' ? data.reminderTime : null };
};

/** 서버 시간을 오전/오후 형식으로 변환합니다. */
const toDisplayTime = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return '';
  return `${hours >= 12 ? '오후' : '오전'} ${hours % 12 || 12}:${String(minutes).padStart(2, '0')}`;
};

/** 입력한 시간을 서버의 HH:MM:SS 형식으로 변환합니다. */
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
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [time, setTime] = useState('');
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const serverTime = toServerTime(time);

  /** 최초 조회한 서버 설정을 입력창에 반영합니다. */
  useEffect(() => {
    if (settings.data && !initialized) {
      setEnabled(settings.data.reminderEnabled);
      setTime(settings.data.reminderTime ? toDisplayTime(settings.data.reminderTime) : '오후 8:00');
      setInitialized(true);
    }
  }, [settings.data, initialized]);

  /** 학습 알림 켜기·끄기 및 시간을 서버에 저장합니다. */
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
      <Row>
        <Chip label="알림 켜기" active={enabled === true} onPress={() => { if (!action.busy) { setEnabled(true); setSaved(false); } }} />
        <Chip label="알림 끄기" active={enabled === false} onPress={() => { if (!action.busy) { setEnabled(false); setSaved(false); } }} />
      </Row>
      <LerenInput label="학습 알림 시간" value={time} onChangeText={value => { setTime(value); setSaved(false); }}
        placeholder="오후 8:00" editable={enabled === true && !action.busy}
        hint="오전 9:00 또는 오후 8:00 형식으로 입력해 주세요."
        error={submitted && enabled === true && !serverTime ? '알림 시간을 올바르게 입력해 주세요.' : ''} />
      {enabled === false && <LerenCard title="기기 알림 권한 안내" description="기기 설정에서 LEREN 알림을 허용하면 학습 시간에 알림을 받을 수 있어요." variant="reward" />}
      <LerenCard title="알림 권한" description="기기 설정에서 알림을 허용해 주세요. 실제 기기 권한 조회는 아직 연결되지 않았습니다." />
      {!!action.error && <Notice tone="error">{action.error}</Notice>}
      {saved && <Notice tone="success">학습 알림 설정을 저장했어요.</Notice>}
      <LerenButton title="설정 저장" loading={action.busy} disabled={action.busy || enabled === null || (enabled && !serverTime)} onPress={() => { void save(); }} />
      <Notice>알림을 끄더라도 학습 달력의 일정은 확인할 수 있어요.</Notice>
    </>}
  </Screen>;
}
