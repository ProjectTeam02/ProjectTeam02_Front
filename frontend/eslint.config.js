/**
 * Expo의 기본 코드 검사 규칙을 적용하고 생성 결과물·로컬 캐시는 검사 대상에서 제외합니다.
 */
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/**', 'web-build/**', '.expo/**'] },
]);
