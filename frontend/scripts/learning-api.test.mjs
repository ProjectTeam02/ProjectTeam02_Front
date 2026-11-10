/** 실제 계약·UUID·오류·재시도 키를 검증합니다. 외부 서버와 모델은 호출하지 않습니다. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { backendRequest, memberDecoder } from '../src/services/backend.ts';
import { topicsDecoder, stagesDecoder, stageDetailDecoder, conceptDecoder, questionDecoder, attemptDecoder, resultDecoder,
  LEARNING_PATHS, fetchTopics, startAttempt, fetchAttempt, fetchResult, submitLearningAnswer, submissionKey } from '../src/services/learningApi.ts';
const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const topic = { topicId: uuid(1), topicCode: 'INFLATION', topicNo: 1, title: '인플레이션', description: null };
const stage = { stageId: uuid(2), topicId: uuid(1), stageCode: '1-1', stageNo: 1, stageType: 'NORMAL', title: '물가', description: null, progressStatus: 'NOT_STARTED', isUnlocked: true };
const question = { id: uuid(3), title: '물가란?', conceptId: null, choices: [4,5,6,7].map(n => ({ id: uuid(n), content: `선택 ${n}` })) };
const attempt = { attemptId: uuid(8), stageId: uuid(2), status: 'IN_PROGRESS', attemptNo: 1, maxQuestionCount: 3, submittedCount: 0, correctCount: 0, hp: 2, rewardGranted: false, currentQuestion: question };
const answer = { attemptId: uuid(8), quizId: uuid(3), choiceId: uuid(4), isCorrect: true, explanation: '서버 해설', hpBefore: 2, hpAfter: 1, submittedCount: 1, correctCount: 1, status: 'IN_PROGRESS', rewardGranted: false };
test.beforeEach(() => { process.env.EXPO_PUBLIC_API_URL = 'https://lerenapp.com'; process.env.EXPO_PUBLIC_AI_REQUESTS_ENABLED = 'false'; });

test('주제·단계의 실제 UUID와 서버 잠금을 유지하고 빈 목록도 성공으로 구분한다', () => {
  assert.deepEqual(topicsDecoder({items:[]}).items, []);
  assert.deepEqual(topicsDecoder({items:[topic]}).items[0], topic);
  const parsed = stagesDecoder({topic,items:[{...stage,isUnlocked:false,stageType:'BOSS'}]});
  assert.equal(parsed.items[0].isUnlocked,false); assert.equal(parsed.items[0].stageType,'BOSS');
  assert.throws(() => stagesDecoder({topic,items:[{...stage,isUnlocked:'true'}]}));
  assert.throws(() => LEARNING_PATHS.stage('1-1'));
  assert.throws(() => LEARNING_PATHS.start('../users'));
});
test('Stage의 공개 개념과 개념 카드의 서버 정렬을 사용한다', () => {
  assert.equal(stageDetailDecoder({...stage,maxQuestionCount:3,initialMonsterHp:2,concepts:[]}).concepts.length,0);
  const cards = [2,1].map(n => ({sectionId:uuid(n+10),pageNo:n,sortOrder:1,title:null,body:'본문',sectionType:'DEFINITION'}));
  const result=conceptDecoder({conceptId:uuid(10),topicId:uuid(1),title:'개념',shortDefinition:null,summary:null,cards});
  assert.deepEqual(result.cards.map(c=>c.pageNo),[1,2]);
});
test('제출 전 문제에 정답·해설을 보관하지 않고 잘못된 선택지와 응시를 거절한다', () => {
  const parsed=questionDecoder({...question,answer:0,explanation:'유출 금지',choices:question.choices.map(c=>({...c,isCorrect:true}))});
  assert.equal(parsed.explanation,undefined); assert.equal(parsed.answer,undefined); assert.equal(parsed.choices[0].isCorrect,undefined);
  assert.throws(()=>questionDecoder({...question,choices:question.choices.slice(0,2)}));
  assert.throws(()=>attemptDecoder({...attempt,currentQuestion:null}));
  assert.throws(()=>resultDecoder(attempt));
  assert.equal(resultDecoder({...attempt,status:'PASSED',currentQuestion:null,submittedCount:2,correctCount:2,hp:0,rewardGranted:true}).rewardGranted,true);
});
test('목록 조회·응시 시작·복원·결과 조회는 정확한 EC2 경로를 쓰고 시작 본문을 만들지 않는다', async t => {
  const calls=[];
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    calls.push({url,options});
    const data=url.endsWith('/topics')?{items:[topic]}:url.endsWith('/result')?{...attempt,status:'FAILED',currentQuestion:null,submittedCount:3,correctCount:1,hp:1}:attempt;
    return Response.json({success:true,data});
  });
  await fetchTopics('test'); await startAttempt('test',stage.stageId); await fetchAttempt('test',attempt.attemptId); await fetchResult('test',attempt.attemptId);
  assert.deepEqual(calls.map(c=>c.url),[
    'https://lerenapp.com/api/v1/topics',`https://lerenapp.com/api/v1/quizzes/stages/${stage.stageId}/attempts`,
    `https://lerenapp.com/api/v1/quizzes/attempts/${attempt.attemptId}`,`https://lerenapp.com/api/v1/quizzes/attempts/${attempt.attemptId}/result`]);
  assert.equal(calls[1].options.method,'POST'); assert.equal(calls[1].options.body,undefined);
});
test('응답 유실 후 재시도는 같은 응시·문항·선택지와 Idempotency-Key를 보내고 AI 잠금과 독립적이다', async t => {
  const sent=[];
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    sent.push({url,body:JSON.parse(options.body),key:options.headers['Idempotency-Key']});
    if(sent.length===1) throw new TypeError('응답 유실');
    return Response.json({success:true,data:answer});
  });
  await assert.rejects(submitLearningAnswer('test',attempt.attemptId,question.id,uuid(4)));
  const result=await submitLearningAnswer('test',attempt.attemptId,question.id,uuid(4));
  assert.deepEqual(sent[0],sent[1]); assert.equal(sent[0].key,submissionKey(attempt.attemptId,question.id));
  assert.equal(result.explanation,'서버 해설'); assert.equal(result.hpAfter,1);
});
test('빈 주제·권한 거부·문항 구성 오류를 구분하며 서버 안내를 유지한다', async t => {
  const mock=t.mock.method(globalThis,'fetch',async()=>Response.json({success:true,data:{items:[]}}));
  assert.deepEqual((await fetchTopics('test')).items,[]);
  mock.mock.mockImplementation(async()=>Response.json({success:false,code:'FORBIDDEN',message:'이전 Stage를 먼저 통과해야 합니다.'},{status:403}));
  await assert.rejects(startAttempt('test',stage.stageId),/이전 Stage/);
  mock.mock.mockImplementation(async()=>Response.json({success:false,code:'SERVICE_UNAVAILABLE',message:'일반 Stage에 공개된 문항 3개가 필요합니다.'},{status:503}));
  await assert.rejects(startAttempt('test',stage.stageId),/공개된 문항 3개/);
});
test('헤더가 깨진 키와 미인증 요청은 서버로 보내지 않는다', async t => {
  const mock=t.mock.method(globalThis,'fetch',()=>{throw new Error('전송 금지');});
  await assert.rejects(backendRequest('test',LEARNING_PATHS.submit(uuid(3)),()=>null,{method:'POST',idempotencyKey:'bad\r\nkey'}));
  await assert.rejects(fetchTopics(''));
  assert.equal(mock.mock.callCount(),0);
});
test('이메일이 없는 정상 소셜 회원도 성장·코인 조회를 실패시키지 않는다', () => {
  const profile=memberDecoder({userId:uuid(50),nickname:'사용자',email:null,level:1,totalExp:0,economyLevel:1,economyExp:0,coinBalance:0,completedStageCount:0,characterClass:null,equippedCostumes:[]});
  assert.equal(profile.email,null); assert.equal(profile.coinBalance,0);
});
