# Tomato career
![header](https://capsule-render.vercel.app/render?type=soft&color=auto&height=200&section=header&text=Tomato%20career&fontSize=70)


# AI Career Decision Copilot

**AI 기반 커리어 의사결정 도우미** — JD 하나 붙여넣으면 적합도 분석, 이력서 리빌드, 면접 질문까지 한번에

[한국어](#한국어) · [English](#english)

</div>

---

## 한국어

### 주요 기능

- **JD 적합도 분석** — 채용공고와 내 경력을 비교해 전략적 지원 조언과 적합도 점수 제공
- **이력서 리빌더** — 분석 결과를 바탕으로 포지션에 맞게 이력서 자동 재작성
- **지원 트래커** — 지원 현황을 한눈에 관리
- **커리어 히스토리** — 과거 분석 결과 저장 및 복원
- **Job Finder** — 포지션 탐색 도우미
- **Corporate Dashboard** — 기업 분석 뷰
- **다국어 지원** — 한국어 / English / 中文

### 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4 |
| AI | Google Gemini API, Anthropic Claude SDK |
| Backend | Express (로컬), Vercel Serverless Functions |
| DB / Auth | Supabase |
| 기타 | Framer Motion, Lucide React, jsPDF |

### 로컬 실행

**사전 요구사항:** Node.js 18+

1. 의존성 설치

```bash
npm install
```

2. 환경 변수 설정 — `.env.local` 파일 생성

```env
GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. 개발 서버 실행

```bash
npm run dev
```

> 기본 포트: `http://localhost:3000`

### 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | UI + API 서버 동시 실행 |
| `npm run dev:ui` | Vite 프론트엔드만 실행 |
| `npm run dev:api` | Express API 서버만 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | TypeScript 타입 체크 |

### 배포

[Vercel](https://vercel.com)에 연결 후 아래 환경 변수를 등록하면 됩니다.

```
GEMINI_API_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

---

## English

### Features

- **JD Fit Analysis** — Analyzes job descriptions against your background to provide strategic advice and fit scores
- **Resume Rebuilder** — Automatically rewrites your resume tailored to each position
- **Application Tracker** — Manage all your applications in one place
- **Career History** — Save and restore past analyses
- **Job Finder** — Explore and discover new positions
- **Corporate Dashboard** — Company-level analysis view
- **Multilingual** — English / 한국어 / 中文

### Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4 |
| AI | Google Gemini API, Anthropic Claude SDK |
| Backend | Express (local), Vercel Serverless Functions |
| DB / Auth | Supabase |
| Other | Framer Motion, Lucide React, jsPDF |

### Getting Started

**Prerequisites:** Node.js 18+

1. Install dependencies

```bash
npm install
```

2. Set up environment variables — create `.env.local`

```env
GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server

```bash
npm run dev
```

> Runs at `http://localhost:3000`

### Deployment

Connect to [Vercel](https://vercel.com) and add the environment variables listed above. The `api/` folder is already structured as Vercel Serverless Functions.
