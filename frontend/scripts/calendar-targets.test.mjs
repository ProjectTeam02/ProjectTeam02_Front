/** 첫 일정은 이력이 없어도 공개 주제·단계의 서버 ID로 생성되어야 합니다. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { backendRequest, PATHS, planDecoder } from '../src/services/backend.ts';
import { LEARNING_PATHS, stagesDecoder, topicsDecoder } from '../src/services/learningApi.ts';
import { selectCalendarStage } from '../src/services/calendarTargets.ts';

const topic = {
  topicId: '33247631-639b-4d3a-a5b2-eec71a6ff001', title: '인플레이션',
  topicCode: 'INFLATION', topicNo: 1, description: null,
};
const otherTopicId = '33247631-639b-4d3a-a5b2-eec71a6ff002';
const stage = {
  stageId: '64ac7971-95d7-4e89-9da2-6ad2a8020001', topicId: topic.topicId,
  stageCode: 'INFLATION-1', stageNo: 1, stageType: 'NORMAL', title: '물가의 뜻',
  description: null, progressStatus: 'NOT_STARTED', isUnlocked: true,
};

test('공개 목록의 단계로 이력 조회 없이 첫 일정을 생성하는 HTTP 계약', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer fixture');
    const path = new URL(url).pathname;
    const get = data => Response.json({ success: true, data });
    if (options.method === 'GET' && path === LEARNING_PATHS.topics) return get({ items: [topic] });
    if (options.method === 'GET' && path === LEARNING_PATHS.stages(topic.topicId)) return get({ topic, items: [stage] });
    assert.equal(path, PATHS.plans);
    assert.equal(options.method, 'POST');
    const body = JSON.parse(options.body);
    assert.deepEqual(body, { goal: '물가 공부', scheduledDate: '2026-11-17', planType: 'NEW_LEARNING',
      topicId: topic.topicId, stageId: stage.stageId, conceptId: null });
    return Response.json({ success: true, data: { ...body, planId: 'fixture-plan', topic } }, { status: 201 });
  });
  process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';
  const [published] = (await backendRequest('fixture', LEARNING_PATHS.topics, topicsDecoder)).items;
  const catalog = await backendRequest('fixture', LEARNING_PATHS.stages(published.topicId), stagesDecoder);
  const target = selectCalendarStage(published.topicId, stage.stageId, catalog);
  assert.ok(target);
  const { label, ...ids } = target;
  assert.equal(label, stage.title);
  const created = await backendRequest('fixture', PATHS.plans, planDecoder, { method: 'POST',
    body: { ...ids, goal: '물가 공부', scheduledDate: '2026-11-17', planType: 'NEW_LEARNING' } });
  assert.equal(created.stageId, stage.stageId);
});

test('주제가 바뀌거나 공개 단계 목록이 비면 이전 단계 ID를 선택하지 않는다', () => {
  assert.equal(selectCalendarStage(otherTopicId, stage.stageId, { topic, items: [stage] }), null);
  assert.equal(selectCalendarStage(topic.topicId, stage.stageId, { topic, items: [{ ...stage, topicId: otherTopicId }] }), null);
  assert.equal(selectCalendarStage(topic.topicId, stage.stageId, { topic, items: [] }), null);
  assert.equal(selectCalendarStage(topic.topicId, stage.stageId, null), null);
});
