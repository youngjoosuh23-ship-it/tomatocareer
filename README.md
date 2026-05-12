# Tomato career



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

### 전체 구조

React 프론트엔드 + Vercel Serverless API 백엔드 구조이며, AI 엔진으로 **Google Gemini 2.5 Flash**를 사용합니다.

#### 3가지 앱 모드

| 모드 | 역할 |
|------|------|
| `career` | 메인 기능 — JD 분석 / 결과 / 이력서 재구성 |
| `corporate` | 기업 분석 리포트 생성 |
| `jobs` | 추천 기업 탐색 + 공고 찾기 |

#### Career 모드 분석 플로우

```
[AnalysisForm] 배경 정보 + JD 입력
      ↓
/api/analyze  (회사별 순차 호출)
      ↓
/api/compare  (2개 이상일 때 비교)
      ↓
localStorage 저장 + Supabase 통계 전송
      ↓
[AnalysisResult] 결과 표시
      ↓
/api/rebuild  (선택) → 이력서 재작성
```

#### API 엔드포인트

| 엔드포인트 | 역할 |
|---|---|
| `/api/analyze` | JD + 배경 → 적합도·갭·전략 분석 |
| `/api/compare` | 여러 분석 → 순위/추천 비교 |
| `/api/rebuild` | 분석 결과 → 이력서 재작성 |
| `/api/jd-input` | URL 스크래핑 or 파일 → JD 텍스트 추출 |
| `/api/career-questions` | 면접 예상 질문 생성 |
| `/api/translate-analysis` | 분석 결과 언어 변환 |
| `/api/corporate-analyze` | 기업 분석 리포트 생성 |
| `/api/find-jobs` / `/api/suggest-companies` | 기업·공고 추천 |

#### 분석 결과 주요 필드

| 필드 | 설명 |
|------|------|
| `decision` | `APPLY` / `SKIP` / `REVISIT` |
| `fit_score` | 0–100 종합 적합도 |
| `hiring_probability` | 0–100 채용 가능성 |
| `score_breakdown` | 직무·성장·문화·리스크·보상 5개 차원 세부 점수 |
| `strengths` / `gaps` / `risks` | 강점·갭·리스크 |
| `resume_bullets` / `resume_improvements` | 이력서 개선 제안 |
| `application_checklist` | 지원 전 체크리스트 |
| `missing_keywords` | JD에 있지만 이력서에 없는 키워드 |

---

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

### Architecture

React frontend + Vercel Serverless API backend, powered by **Google Gemini 2.5 Flash**.

#### 3 App Modes

| Mode | Purpose |
|------|---------|
| `career` | Core flow — JD analysis / results / resume rebuild |
| `corporate` | Company analysis report generation |
| `jobs` | Discover recommended companies & find openings |

#### Career Mode Analysis Flow

```
[AnalysisForm] Enter background + JD
      ↓
/api/analyze  (sequential per company)
      ↓
/api/compare  (when 2+ companies)
      ↓
Save to localStorage + send stats to Supabase
      ↓
[AnalysisResult] Display results
      ↓
/api/rebuild  (optional) → Rewrite resume
```

#### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/analyze` | JD + background → fit score, gaps, strategy |
| `/api/compare` | Multiple analyses → ranking & recommendation |
| `/api/rebuild` | Analysis result → rewritten resume |
| `/api/jd-input` | URL scraping or file → extract JD text |
| `/api/career-questions` | Generate predicted interview questions |
| `/api/translate-analysis` | Translate analysis results to target language |
| `/api/corporate-analyze` | Generate company analysis report |
| `/api/find-jobs` / `/api/suggest-companies` | Company & job discovery |

#### Key Fields in Analysis Response

| Field | Description |
|-------|-------------|
| `decision` | `APPLY` / `SKIP` / `REVISIT` |
| `fit_score` | Overall fit 0–100 |
| `hiring_probability` | Estimated hire chance 0–100 |
| `score_breakdown` | Sub-scores across 5 dimensions: job fit, growth, culture, risk, compensation |
| `strengths` / `gaps` / `risks` | Profile strengths, gaps, and risks |
| `resume_bullets` / `resume_improvements` | Resume improvement suggestions |
| `application_checklist` | Pre-application task checklist |
| `missing_keywords` | JD keywords absent from the candidate's resume |

---

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
