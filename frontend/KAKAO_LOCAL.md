# 로컬 실제 카카오 로그인

이번 단계는 **PC 브라우저의 Expo Web**에서 실제 카카오 계정으로 인증하고, 로컬 백엔드·테스트 DB에 Leren 회원과 세션을 만드는 흐름입니다. 실제 카카오 앱 키를 넣기 전에는 구성 오류를 표시하며 성공을 흉내 내지 않습니다.

작업 기반은 실제 원본 `C:\Leren\ProjectTeam02_Front`의 `test` 커밋 `35409c1878a1249c0a4cbce70280d3ee52a3e3a7`입니다. 원본을 수정하지 않고 별도 복제본의 `codex/leren-kakao-local-20261106` 브랜치에 API 확인·카카오 연결을 추가했습니다. 기존 test의 학습 로더, 예시 학습 상태, 튜터, 화면 목록 기능은 보존했습니다.

프론트 `.env.local`은 아래 공개 주소만 사용합니다. 이 파일에는 카카오 키·Client Secret·JWT·DB 비밀번호를 넣지 않습니다.

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3000
```

기존 학습 로더는 별도 `EXPO_PUBLIC_LEARNING_API_URL`에서 `/api/v1/dev-learning/catalog`를 읽습니다. 이번 카카오 테스트용 main 기반 백엔드에는 그 임시 학습 경로가 없습니다. 이 설정을 비워 두면 학습 영역에 주소 미설정 안내가 표시되며, 기존 테스트 데이터나 화면을 삭제하지 않습니다. 학습 화면·시드 데이터는 실제 사용자 이력·정식 학습 API 성공의 근거가 아닙니다.

백엔드는 별도 로컬 카카오 실행 설정으로 시작합니다. 백엔드의 카카오 앱 설정에 등록할 Redirect URI는 `http://localhost:3000/api/v1/auth/kakao/callback`, 백엔드가 최종 앱 복귀에 사용할 주소는 `http://localhost:3001/auth/callback`입니다. `localhost`와 `127.0.0.1`을 혼용하지 말고 위 주소를 그대로 맞춥니다.

```powershell
npm run web
```

PC에서 `http://localhost:3001`을 열고 **카카오로 시작하기**를 누릅니다. 실제 카카오 로그인·동의 화면을 거쳐 돌아오면, 코드 교환에 성공한 경우에만 홈이 열립니다. 홈의 API 테스트에서 현재 사용자 학습 이력 GET을 확인할 수 있습니다. 새 학습 기록은 생성하지 않습니다.

로그인 흐름은 `start → 카카오 로그인 → backend callback → /auth/callback → exchange`입니다. 검증값은 시작한 브라우저 탭의 `sessionStorage`에 최대 10분만 보관하고, 복귀한 순간 지웁니다. 주소 쿼리의 일회용 코드도 즉시 제거합니다. 발급받은 JWT와 사용자 정보는 메모리에만 보관하므로 새로고침하면 다시 로그인해야 합니다. 다른 탭에 콜백 주소를 붙여넣거나 뒤로 가기로 재사용하면 로그인에 실패합니다.

구성 누락, 카카오 취소, 401/422, 503, 잘못된 JSON, 만료·불일치·중복 쿼리는 오류로 표시합니다. 실패한 일회용 교환은 같은 코드로 재시도하지 않고 로그인 화면에서 다시 시작합니다. 키·토큰·인가 코드·개인정보를 콘솔이나 파일에 출력하지 않습니다.

```powershell
npm run test:kakao
node --test scripts/api-smoke.test.mjs
npm run typecheck
npm run lint
npx expo export --platform web
```

계약 테스트는 브라우저·카카오 응답을 모의한 로컬 검증입니다. 테스트 통과가 실제 카카오 계정 인증 성공을 뜻하지 않습니다. 실제 로그인에는 팀 카카오 앱의 유효한 키와 정확한 Redirect URI 등록이 필요합니다.

2026-11-06 검증에서 타입 검사·Expo lint·카카오 계약 11개·기존 조회 계약 9개·웹 빌드가 통과했습니다. 실제 로컬 백엔드의 키 누락 503 안내, 잘못된 앱 복귀 거절과 URL 쿼리 제거, health 200을 별도로 확인했습니다. 팀 앱의 실제 키 입력과 카카오 Redirect URI 등록이 아직 없어 실제 계정 인증·회원 저장·세션 발급 성공은 미검증입니다.

팀이 합의한 네이티브 앱 복귀 주소는 정확히 `leren://auth/callback`입니다. 휴대폰의 `localhost`는 휴대폰 자신이므로 이번 PC용 주소를 사용할 수 없습니다. 이번 변경은 같은 `/auth/callback` 경로를 사용하되 네이티브 앱 복귀·기기 로그인 성공을 주장하지 않습니다. 네이티브는 PC 브라우저에서 진행하도록 안내합니다.

공개 서버로 전환할 때는 프론트 API origin, 카카오 Redirect URI, 백엔드 콜백·허용 목록·CORS를 맞춰야 합니다. 현재 백엔드의 운영용 OAuth 상태 저장소는 별도 구현이 필요합니다.

Expo SDK 58와 Router 문서에 맞춰 새 의존성 없이 브라우저의 Web Crypto와 같은 탭 이동을 사용했습니다. `tsconfig`의 `allowImportingTsExtensions`는 `noEmit` 상태에서 Node 24가 실제 TypeScript 서비스 코드를 계약 테스트에 직접 읽을 수 있게 하는 설정입니다.
