/** 학습 알림 켜기·끄기만 실제 PATCH API로 저장합니다. 현재값 조회·시간 설정·푸시는 별도 미구현입니다. */
import { useState } from 'react';
import Screen from '../../components/ui/Screen';
import { Chip, Notice, Row } from '../../components/ui/Primitives';
import { Unconnected } from '../../components/ui/ApiStatus';
import LerenButton from '../../components/common/LerenButton';
import { useBackendAction } from '../../hooks/useBackend';
import { notificationDecoder } from '../../services/backend';
export default function NotificationSettingsScreen() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saved, setSaved] = useState<boolean | null>(null);
  const action = useBackendAction();
  const choose = (v: boolean) => { if (!action.busy) { setEnabled(v); setSaved(null); } };
  const save = async () => { if (enabled === null) return; setSaved(null); const result = await action.run('/api/v1/users/me/notifications', notificationDecoder, 'PATCH', { learningOn: enabled }); if (result) setSaved(result.learningOn); };
  return <Screen title="학습 알림" back tabs>
    <Notice>알림 저장 API를 연결했습니다. 현재 설정을 조회하는 API는 없어, 선택하기 전에는 켜짐·꺼짐을 임의로 표시하지 않습니다.</Notice>
    <Row><Chip label="알림 켜기" active={enabled === true} onPress={() => choose(true)} /><Chip label="알림 끄기" active={enabled === false} onPress={() => choose(false)} /></Row>
    {saved !== null && <Notice tone="success">API 연결 및 저장 성공 · 학습 알림 {saved ? '켜짐' : '꺼짐'}을 서버에 저장했습니다.</Notice>}
    {!!action.error && <Notice tone="error">API 저장 실패: {action.error}</Notice>}
    <LerenButton title="서버에 설정 저장" loading={action.busy} disabled={action.busy || enabled === null} onPress={save} />
    <Unconnected>알림 시간 저장, 기기 권한, 실제 푸시 발송은 아직 연결되지 않았습니다.</Unconnected>
  </Screen>;
}
