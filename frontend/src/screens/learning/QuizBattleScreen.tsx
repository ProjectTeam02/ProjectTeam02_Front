/** 승인된 실제 문항을 조회합니다. 응시 생성 API가 없으므로 임시 ID나 로컬 채점으로 제출하지 않습니다. */
import { useState } from 'react';
import Screen from '../../components/ui/Screen';
import { Body, Heading, Notice } from '../../components/ui/Primitives';
import { ApiStatus, Unconnected } from '../../components/ui/ApiStatus';
import LerenOption from '../../components/common/LerenOption';
import LerenButton from '../../components/common/LerenButton';
import { useBackend } from '../../hooks/useBackend';
import { PATHS, quizDecoder } from '../../services/backend';
import QuizBattlePreview from './QuizBattlePreview';
export default function QuizBattleScreen() {
  const question = useBackend(PATHS.quiz, quizDecoder);
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  // 백엔드가 명시한 승인 문항 없음만 빈 결과로 안내합니다. 경로 오류·인증 오류는 실패로 남깁니다.
  const noQuestion = question.status === 'error' && question.errorCode === 'NO_APPROVED_QUESTION';
  if (preview) return <QuizBattlePreview />;
  return <Screen title="실제 학습 문제" back tabs>
    {noQuestion ? <><Notice tone="success">문제 조회 API는 연결되었으나 승인된 실제 문제가 없어 표시되지 않습니다. 서버가 ‘승인된 문제 없음’을 반환했습니다.</Notice><LerenButton title="문제 다시 조회" variant="secondary" onPress={question.reload} /></> : <ApiStatus resource={question} label="승인된 문제 조회" />}
    {question.data && <><Heading>{question.data.title}</Heading>{question.data.choices.map((c, i) => <LerenOption key={c.id} title={c.content} number={i + 1} state={selected === c.id ? 'selected' : 'default'} onPress={() => setSelected(c.id)} />)}<Body muted>선택은 가능하지만 아직 서버에 답안을 제출하지 않습니다.</Body></>}
    <Unconnected>답안 채점 API는 있으나, 제출에 필요한 나의 응시 기록을 생성하는 API가 없습니다. 응시 시작·문제 배정 흐름이 준비되어야 채점·진행도·보상 저장까지 연결할 수 있습니다.</Unconnected>
    <LerenButton title="답안 제출 준비 중" disabled />
    {__DEV__ && <LerenButton title="전투 시안 보기 (서버 저장 안 됨)" variant="secondary" onPress={() => setPreview(true)} />}
  </Screen>;
}
