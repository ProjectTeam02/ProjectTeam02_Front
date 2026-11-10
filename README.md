# LEREN Frontend

Expo SDK 58 · React Native · TypeScript 프론트엔드입니다. 백엔드·DB·AI는 서버에서 별도로 관리하며 이 저장소의 main에는 해당 실행 소스를 포함하지 않습니다.

## 설치·실행

Node.js 24 LTS와 npm을 사용합니다.

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm start
```

웹은 `npm run web`, Android·iOS는 Expo Go 또는 별도 개발 빌드로 실행합니다. `.env.example`의 기본 주소는 `https://lerenapp.com`입니다. 서버 CORS와 계정·학습 데이터가 준비되어야 실제 기능을 사용할 수 있습니다. `.env`를 바꾸면 Expo를 재시작하세요.

프론트 공개 설정에는 서버 주소와 기능 설정만 넣습니다. 토큰·DB 비밀번호·AI 키·카카오 비밀 키는 넣지 않습니다. `EXPO_PUBLIC_AI_REQUESTS_ENABLED=false`를 기본으로 유지하며 실제 AI 생성은 차단합니다. 이 설정은 비용 확인을 위한 UI/요청 제한으로, 서버의 인증·권한·요금 제한을 대신하지 않습니다.

## 구현 및 연결 범위

- 이메일 회원가입·로그인·로그아웃, PC 웹 카카오 PKCE 인증 흐름. 토큰은 메모리에만 보관합니다.
- 회원·성장·지갑·현재 직업/장착, 달력·학습 이력, 일정 저장, 알림 켜기/끄기 요청.
- 공개 주제 → 단계 → 개념 → 일반 퀴즈 응시/복원 → 답안 제출·서버 채점 → 저장된 결과/보상 조회.
- 튜터 대화 목록·생성·이력·사용량과 메시지 요청 코드. 실제 생성은 기본 비활성화입니다.
- 데이터 없음·API 미연결·로그인 필요·요청 실패를 구분합니다. 실패를 예시 데이터로 바꾸지 않습니다.

요청 코드 연결은 운영 환경의 전체 성공을 의미하지 않습니다. 보스 응시·복습 저장·프로필/직업 변경·코스튬 구매/장착·비밀번호 재설정·기기 알림 발송·모바일 카카오 복귀는 남은 기능입니다. 미구현 기능에서 저장·구매·재설정 완료를 표시하지 않습니다.

## 검증과 문서

```powershell
npm run typecheck
npm run lint -- --no-cache
npm test
npx expo export --platform all
```

- [현재 API 연결 범위](frontend/API_INTEGRATION.md)
- [정식 학습·퀴즈 흐름](frontend/LEARNING_INTEGRATION.md)
- [통합 검증 기록](frontend/MAIN_INTEGRATION.md)
- [의존성 보안 검토](frontend/DEPENDENCY_SECURITY.md)

`frontend/src/app/`은 Expo Router 주소, `src/screens/`는 화면, `src/services/`는 요청·응답 검증, `src/context/`와 `src/hooks/`는 계정·조회 상태를 관리합니다.

main 통합은 기존 이슈 #4·#5·#6·#7 및 PR #8을 재사용합니다. test 브랜치에는 과거 로컬 백엔드 사본과 개발용 자료가 남아 있으므로 main에 브랜치 전체를 합치지 않습니다. 기존 개발일지와 전환 기록은 과거 시점의 기록입니다.
