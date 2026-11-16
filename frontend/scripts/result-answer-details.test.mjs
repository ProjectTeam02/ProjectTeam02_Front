/** 결과 상세는 저장된 응시 ID로 채점과 해설을 읽고 타인 응시 오류를 그대로 표시합니다. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { backendRequest, detailDecoder } from '../src/services/backend.ts';
import { LEARNING_PATHS, resultDecoder } from '../src/services/learningApi.ts';
import { learningHistoryDetailPath } from '../src/services/learningHistoryPath.ts';

const attemptId = '64ac7971-95d7-4e89-9da2-6ad2a8020001';
const stageId = '64ac7971-95d7-4e89-9da2-6ad2a8020002';
const record = { recordType: 'LEARNING', recordId: attemptId };
const result = { attemptId, stageId, status: 'PASSED', attemptNo: 1, maxQuestionCount: 3,
  submittedCount: 2, correctCount: 2, hp: 0, rewardGranted: true };

test('응시 결과에서 검증한 ID로 문항·선택·정오답·해설을 읽는다', async t => {
  process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer fixture');
    const path = new URL(url).pathname;
    if (path === LEARNING_PATHS.result(attemptId)) return Response.json({ success: true, data: result });
    assert.equal(path, `/api/v1/learning/history/LEARNING/${attemptId}`);
    assert.equal(options.method, 'GET');
    return Response.json({ success: true, data: { ...record, status: 'PASSED', learningDate: '2026-11-17',
      topic: null, stage: { stageId, title: '물가' }, submittedCount: 2, correctCount: 2, accuracyPercentage: 100,
      submissions: [{ submissionId: 'fixture-submission', question: { questionText: '물가란?' },
        selectedAnswer: { choiceText: '재화 가격의 전반적 수준' }, isCorrect: true, explanation: '경제 전체의 수준입니다.' }] } });
  });
  const finished = await backendRequest('fixture', LEARNING_PATHS.result(attemptId), resultDecoder);
  const detail = await backendRequest('fixture', learningHistoryDetailPath({ recordType: 'LEARNING', recordId: finished.attemptId }), detailDecoder);
  assert.deepEqual(detail.submissions[0], { submissionId: 'fixture-submission', questionText: '물가란?',
    selectedAnswer: '재화 가격의 전반적 수준', isCorrect: true, explanation: '경제 전체의 수준입니다.' });
});

test('타인 응시를 찾지 못하면 성공·빈 해설이나 별도 우회 조회로 바꾸지 않는다', async t => {
  process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ success: false, code: 'NOT_FOUND',
    message: '학습 이력을 찾을 수 없습니다.' }, { status: 404 }));
  await assert.rejects(backendRequest('fixture', learningHistoryDetailPath(record), detailDecoder), e => e.status === 404);
  assert.equal(fetch.mock.callCount(), 1);
});
