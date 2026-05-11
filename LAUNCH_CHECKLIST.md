# Career Copilot — 베타 런칭 체크리스트

> 무료 베타 기준. 유저 피드백 수집이 최우선 목표.

---

## 1단계 — 배포 환경 세팅 `1~2일`

- [ ] Vercel 프로젝트 연결 확인 (`api/` 폴더가 이미 serverless 구조)
- [ ] 환경 변수 등록: `GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] 커스텀 도메인 연결
- [ ] `npm run build` 에러 없는지 확인

---

## 2단계 — 법적 필수 항목 `1일`

- [ ] 개인정보처리방침 페이지 (`/privacy`)
  - 이력서 데이터 처리 방식
  - Gemini API 전달 여부 명시
  - 서버 미보관 명시
  - PIPA(개인정보보호법) 기준으로 작성 (한국 대상)
- [ ] 이용약관 페이지 (`/terms`)
  - AI 결과의 정확성 면책 조항
  - 서비스 변경·중단 권리 명시
- [ ] footer에 `/privacy`, `/terms` 링크 연결
  > footer 안내 문구만으로는 법적 효력 부족 — 별도 페이지 필요

---

## 3단계 — 품질 확인 `2~3일`

- [ ] 모바일 반응형 전체 탭 QA (Career / Corporate / Job Finder / History / Tracker)
- [ ] API rate limit 프로덕션 값 재확인
  - 현재 `dev` 환경에서는 rate limit bypass됨 (`_shared.ts` 참고)
  - 프로덕션에서 분당 5회 / 일 10회 실제 동작하는지 확인
- [ ] Gemini API 비용 시뮬레이션
  - 유저 100명 × 일 10회 = 1,000 req/day → 예상 비용 계산
  - 무제한 오픈 시 청구 폭탄 방지용 Google AI Studio 할당량 캡 설정
- [ ] 에러 모니터링 연결 — [Sentry](https://sentry.io) 무료 플랜으로 충분
  - `npm install @sentry/react`
  - `main.tsx`에 `Sentry.init()` 한 줄

---

## 4단계 — 사용자 유입 준비 `2~3일`

- [ ] OG 이미지 제작 (`public/og.png`, 1200×630)
- [ ] `index.html` meta 태그 추가
  ```html
  <meta property="og:title" content="Career Copilot — AI 취업 의사결정 도우미" />
  <meta property="og:description" content="JD 붙여넣기만 하면 적합도 분석·이력서 리빌드·면접 질문까지 한번에" />
  <meta property="og:image" content="https://your-domain.com/og.png" />
  ```
- [ ] 랜딩 페이지 카피 다듬기 (HeroSection 문구 검토)
- [ ] Google Analytics 또는 Mixpanel 연결
  - 어떤 기능이 실제로 쓰이는지 확인해야 다음 우선순위가 나옴
  - GA4 기준: `gtag` 스크립트를 `index.html`에 추가

---

## 5단계 — 소프트 런칭

- [ ] 지인 10~20명 먼저 공유 → 피드백 Google Form 링크 함께 전달
  - 폼: https://forms.gle/XTbJqva2n7Z757Vr7
- [ ] 커뮤니티 게시
  - [ ] 커리어리
  - [ ] 블라인드 (취준생 채널)
  - [ ] Product Hunt (영어 소개 필요)
  - [ ] 링크드인 개인 포스팅
- [ ] 피드백 기반으로 UX 병목 1~2개 빠르게 수정
- [ ] 주 1회 Google Form 결과 확인 → 기능 우선순위 재정리
