/**
 * 피그마의 학습 알림 설정 시안입니다. 켜기·끄기와 시간을 입력하며 실제 푸시를 발송하지 않습니다.
 * 기기 권한 요청은 구현 범위에서 제외하고, 권한 행을 누르면 현재의 미연결 상태를 안내합니다.
 */
import { useState } from 'react';
import LerenInput from '../../components/common/LerenInput';
import LerenCard from '../../components/common/LerenCard';
import LerenButton from '../../components/common/LerenButton';
import Screen from '../../components/ui/Screen';
import { Body, Chip, LinkRow, Notice, Row } from '../../components/ui/Primitives';
import { useLearningProgress } from '../../context/LearningProgressContext';

export default function NotificationSettingsScreen() {
  const { notifications, setNotifications, notificationTime, setNotificationTime } = useLearningProgress();
  const [enabled, setEnabled] = useState(notifications);
  const [time, setTime] = useState(notificationTime);
  const [permissionHelp, setPermissionHelp] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const save = () => {
    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
    if (enabled && !validTime) { setError('시간은 00:00~23:59 사이로 입력해 주세요.'); return; }
    setNotifications(enabled);
    // 알림을 끄는 경우 미완성 시간 입력이 저장을 막지 않도록 기존 유효 시간을 유지합니다.
    if (validTime) setNotificationTime(time);
    setSaved(true);
    setError('');
  };

  return (
    <Screen title="학습 알림" back tabs>
      <Row><Chip label="알림 켜기" active={enabled} onPress={() => { setEnabled(true); setSaved(false); }} /><Chip label="알림 끄기" active={!enabled} onPress={() => { setEnabled(false); setSaved(false); }} /></Row>
      <LerenInput label="알림 시간" value={time} placeholder="20:00" hint="24시간 형식으로 입력해 주세요." editable={enabled} onChangeText={value => { setTime(value); setSaved(false); setError(''); }} error={error} />
      <LerenCard title="작은 습관이 큰 성장을 만들어요" description="정해진 시간에 경제 모험을 이어가 보세요." variant="info" />
      <LinkRow title="알림 권한" subtitle="기기 설정에서 허용하기" onPress={() => setPermissionHelp(value => !value)} />
      {permissionHelp && <Notice>기기 알림 권한과 실제 발송은 앱 구현 단계에서 연결할 예정이에요. 현재는 설정 화면만 확인할 수 있어요.</Notice>}
      {saved && <Notice tone="success">{enabled ? `매일 ${time} 알림으로 설정했어요.` : '학습 알림을 껐어요.'} 실제 알림은 발송되지 않아요.</Notice>}
      <LerenButton title="설정 저장" onPress={save} />
      <Body muted>알림을 끄더라도 학습 달력의 일정은 확인할 수 있어요.</Body>
    </Screen>
  );
}
