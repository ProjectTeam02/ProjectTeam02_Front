/**
 * 화면 연결 테스트용 학습 카탈로그를 읽습니다. 운영 DB나 공식 퀴즈 API를 사용하지 않습니다.
 * require(JSON)의 캐시를 쓰지 않고 매 요청 파일을 다시 읽어 데이터 수정이 즉시 반영됩니다.
 */
const { readFile } = require('node:fs/promises');
const path = require('node:path');

const CATALOG_PATH = path.join(__dirname, 'data', 'stage-1.json');
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;

/** 잘못 편집한 ID·정답·문항 수가 정상 응답으로 내려가 화면을 깨뜨리지 않게 검사합니다. */
function validateCatalog(catalog) {
  const invalid = () => { throw new Error('테스트 학습 카탈로그의 형식과 데이터 참조를 확인해 주세요.'); };
  if (catalog?.schemaVersion !== 1 || catalog.source !== 'figma-test-fixture'
    || !Array.isArray(catalog.regions) || !Array.isArray(catalog.questions)) invalid();
  for (const kind of ['normal', 'boss']) {
    const rule = catalog.battleRules?.[kind];
    if (!Number.isInteger(rule?.hp) || !Number.isInteger(rule.maxQuestions)
      || rule.hp < 1 || rule.maxQuestions < rule.hp) invalid();
  }
  if (!catalog.rewards || ['coins', 'xp', 'economyXp'].some((key) => !Number.isInteger(catalog.rewards[key]) || catalog.rewards[key] < 0)) invalid();
  const questionIds = new Set();
  for (const question of catalog.questions) {
    if (!nonempty(question?.id) || questionIds.has(question.id) || !nonempty(question.concept)
      || !nonempty(question.question) || !nonempty(question.explanation)
      || !Array.isArray(question.choices) || question.choices.length < 2
      || !question.choices.every(nonempty) || !Number.isInteger(question.answer)
      || question.answer < 0 || question.answer >= question.choices.length) invalid();
    questionIds.add(question.id);
  }
  const contentIds = new Set();
  const regionIds = new Set();
  const checkQuestionRefs = (ids, count) => {
    if (!Array.isArray(ids) || ids.length !== count || new Set(ids).size !== count
      || ids.some((id) => !questionIds.has(id))) invalid();
  };
  for (const region of catalog.regions) {
    if (!Number.isInteger(region?.id) || region.id < 1 || regionIds.has(region.id)
      || !nonempty(region.title) || !nonempty(region.description)
      || !Array.isArray(region.lessons) || region.lessons.length < 1 || !nonempty(region.boss?.id)) invalid();
    regionIds.add(region.id);
    if (contentIds.has(region.boss.id)) invalid();
    contentIds.add(region.boss.id);
    checkQuestionRefs(region.boss.questionIds, catalog.battleRules.boss.maxQuestions);
    for (const lesson of region.lessons) {
      if (!nonempty(lesson?.id) || contentIds.has(lesson.id)
        || ['title', 'introTitle', 'intro', 'conceptTitle', 'concept', 'example'].some((key) => !nonempty(lesson[key]))
        || !Array.isArray(lesson.summary) || lesson.summary.length < 1 || !lesson.summary.every(nonempty)) invalid();
      contentIds.add(lesson.id);
      checkQuestionRefs(lesson.questionIds, catalog.battleRules.normal.maxQuestions);
    }
  }
  for (const region of catalog.regions) {
    if (region.prerequisite !== null && (!regionIds.has(region.prerequisite) || region.prerequisite === region.id)) invalid();
  }
  return catalog;
}

/** filePath 인자는 단위 테스트에서 별도 임시 JSON을 읽기 위한 용도입니다. HTTP 입력은 받지 않습니다. */
async function loadCatalog(filePath = CATALOG_PATH) {
  return validateCatalog(JSON.parse(await readFile(filePath, 'utf8')));
}

module.exports = { CATALOG_PATH, loadCatalog, validateCatalog };
