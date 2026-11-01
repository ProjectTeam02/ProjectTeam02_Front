/**
 * 백엔드의 임시 학습 API를 HTTP로 읽고 화면 계약으로 검사합니다.
 * 학습 본문·문제·지역 목록을 프론트 번들에 넣거나 통신 실패 시 로컬 더미로 대체하지 않습니다.
 */
import type { BattleRule, LearningCatalog as LearningScreenCatalog, LearningLesson, LearningQuestion, LearningRegion } from '../types/learning';

interface LearningCatalog extends LearningScreenCatalog { schemaVersion: 1; source: 'figma-test-fixture' }

const CONTRACT_ERROR = '서버에서 받은 학습 정보 형식을 확인해 주세요.';
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(CONTRACT_ERROR);
  return value as Record<string, unknown>;
}
function list(value: unknown): unknown[] { if (!Array.isArray(value)) throw new Error(CONTRACT_ERROR); return value; }
function text(value: unknown): string { if (typeof value !== 'string' || !value.trim()) throw new Error(CONTRACT_ERROR); return value; }
function integer(value: unknown, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < minimum) throw new Error(CONTRACT_ERROR);
  return value;
}
function texts(value: unknown): string[] { return list(value).map(text); }
function unique(values: (string | number)[]) { if (new Set(values).size !== values.length) throw new Error(CONTRACT_ERROR); }
function readQuestion(value: unknown): LearningQuestion {
  const item = record(value); const choices = texts(item.choices); const answer = integer(item.answer);
  if (choices.length < 2 || answer >= choices.length) throw new Error(CONTRACT_ERROR);
  return { id: text(item.id), concept: text(item.concept), question: text(item.question), choices, answer, explanation: text(item.explanation) };
}
function readLesson(value: unknown): LearningLesson {
  const item = record(value);
  return { id: text(item.id), title: text(item.title), introTitle: text(item.introTitle), intro: text(item.intro), conceptTitle: text(item.conceptTitle), concept: text(item.concept), example: text(item.example), summary: texts(item.summary), questionIds: texts(item.questionIds) };
}
function readRegion(value: unknown): LearningRegion {
  const item = record(value); const boss = record(item.boss);
  return { id: integer(item.id, 1), title: text(item.title), description: text(item.description), prerequisite: item.prerequisite === null ? null : integer(item.prerequisite, 1), boss: { id: text(boss.id), questionIds: texts(boss.questionIds) }, lessons: list(item.lessons).map(readLesson) };
}
function readRule(value: unknown): BattleRule {
  const item = record(value); const hp = integer(item.hp, 1); const maxQuestions = integer(item.maxQuestions, 1);
  if (hp > maxQuestions) throw new Error(CONTRACT_ERROR);
  return { hp, maxQuestions };
}
/** 깨진 참조를 가진 응답을 그대로 렌더하지 않고 재시도 가능한 오류로 처리합니다. */
export function parseLearningCatalog(value: unknown): LearningCatalog {
  const item = record(value); const rules = record(item.battleRules); const rewards = record(item.rewards);
  if (item.schemaVersion !== 1 || item.source !== 'figma-test-fixture') throw new Error(CONTRACT_ERROR);
  const regions = list(item.regions).map(readRegion); const questions = list(item.questions).map(readQuestion);
  const battleRules = { normal: readRule(rules.normal), boss: readRule(rules.boss) };
  unique(regions.map(region => region.id)); unique(questions.map(question => question.id));
  unique(regions.flatMap(region => [region.boss.id, ...region.lessons.map(lesson => lesson.id)]));
  const regionIds = new Set(regions.map(region => region.id)); const questionIds = new Set(questions.map(question => question.id));
  const checkQuestionIds = (ids: string[], rule: BattleRule) => {
    unique(ids);
    if (ids.length < rule.hp || ids.length > rule.maxQuestions || ids.some(id => !questionIds.has(id))) throw new Error(CONTRACT_ERROR);
  };
  for (const region of regions) {
    if (!region.lessons.length || region.prerequisite === region.id || (region.prerequisite !== null && !regionIds.has(region.prerequisite))) throw new Error(CONTRACT_ERROR);
    checkQuestionIds(region.boss.questionIds, battleRules.boss);
    for (const lesson of region.lessons) { if (!lesson.summary.length) throw new Error(CONTRACT_ERROR); checkQuestionIds(lesson.questionIds, battleRules.normal); }
  }
  return { schemaVersion: 1, source: 'figma-test-fixture', regions, questions, battleRules, rewards: { coins: integer(rewards.coins), xp: integer(rewards.xp), economyXp: integer(rewards.economyXp) } };
}

export async function fetchDevelopmentLearningCatalog(signal?: AbortSignal): Promise<LearningCatalog> {
  const configured = process.env.EXPO_PUBLIC_LEARNING_API_URL?.trim().replace(/\/+$/, '');
  if (!configured) throw new Error('학습 서버 주소가 아직 설정되지 않았어요.');
  let baseUrl: URL;
  try { baseUrl = new URL(configured); } catch { throw new Error('학습 서버 주소를 확인해 주세요.'); }
  if (!['http:', 'https:'].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) throw new Error('학습 서버 주소를 확인해 주세요.');
  const controller = new AbortController(); let timedOut = false;
  const abort = () => controller.abort();
  if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 12000);
  try {
    const response = await fetch(`${configured}/api/v1/dev-learning/catalog`, { headers: { Accept: 'application/json' }, signal: controller.signal });
    const body = record(await response.json());
    if (!response.ok || body.success !== true) throw new Error(typeof body.message === 'string' ? body.message : '학습 정보를 불러오지 못했어요.');
    return parseLearningCatalog(body.data);
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timedOut) throw new Error('학습 서버 응답이 늦어지고 있어요. 다시 시도해 주세요.');
    if (error instanceof TypeError) throw new Error('학습 서버에 연결하지 못했어요. 서버 실행과 네트워크를 확인해 주세요.');
    if (error instanceof SyntaxError) throw new Error(CONTRACT_ERROR);
    throw error;
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
