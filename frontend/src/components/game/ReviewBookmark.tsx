/** 목록에서 확인한 체크 상태 또는 퀴즈에서의 명시적 저장 동작을 서버 북마크와 연결합니다. */
import { useState } from 'react';
import LerenButton from '../common/LerenButton';
import LerenCheck from '../common/LerenCheck';
import { Notice } from '../ui/Primitives';
import { useBackendAction } from '../../hooks/useBackend';
import { REVIEW, bookmarkResult } from '../../services/reviewApi';

export default function ReviewBookmark({ questionId, initial, onSaved }: {
  questionId: string; initial?: boolean; onSaved?: (value: boolean) => void;
}) {
  const [saved, setSaved] = useState<boolean>();
  const action = useBackendAction();
  const checked = saved ?? initial;
  const update = async (next: boolean) => {
    const result = await action.run(REVIEW.bookmark(questionId), bookmarkResult, next ? 'PUT' : 'DELETE');
    if (result) { setSaved(result.bookmarked); onSaved?.(result.bookmarked); }
  };
  return <>{checked === undefined
    ? <LerenButton title="헷갈림에 저장" variant="secondary" disabled={action.busy} onPress={() => void update(true)} />
    : <LerenCheck title="헷갈리는 문항" checked={checked} disabled={action.busy} onChange={next => void update(next)} />}
    {!!action.error && <Notice tone="error">{action.error}</Notice>}
  </>;
}
