/** Windows의 구형 Ninja에서도 빌드되도록 CMake가 긴 객체 파일 경로를 해시로 줄이게 합니다. */
const { withGradleProperties } = require('expo/config-plugins');

module.exports = function withAndroidShortObjectPaths(config) {
  return withGradleProperties(config, mod => {
    const key = 'expo.android.cmakeObjectPathMax';
    mod.modResults = mod.modResults.filter(item => item.type !== 'property' || item.key !== key);
    // 240은 긴 codegen 대상 폴더에서 해시 이름조차 넣을 수 없어 축약을 포기하므로 260을 사용합니다.
    mod.modResults.push({ type: 'property', key, value: '260' });
    return mod;
  });
};
