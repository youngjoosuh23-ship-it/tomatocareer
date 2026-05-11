export interface UserPriorities {
  job_fit: 1 | 2 | 3 | 4 | 5;       // 직무 적합도
  growth: 1 | 2 | 3 | 4 | 5;        // 성장 가능성
  culture: 1 | 2 | 3 | 4 | 5;       // 문화 적합성
  risk: 1 | 2 | 3 | 4 | 5;          // 리스크
  compensation: 1 | 2 | 3 | 4 | 5;  // 보상
}

export const DEFAULT_PRIORITIES: UserPriorities = {
  job_fit: 5,
  growth: 4,
  culture: 3,
  compensation: 2,
  risk: 1,
};

export interface UserBackground {
  major: string;
  experience: string;
  skills: string;
  target_roles: string;
  constraints: string;
  resumeText?: string;
  fileName?: string;
  content_language: 'en' | 'ko' | 'zh';
  priorities?: UserPriorities;
}

export interface CompanyInfo {
  company_name: string;
  role: string;
  jd_text: string;
}

export interface AnalysisResponse {
  rejection_reasons: string[];
  improvement_actions: string[];
  ideal_candidate_profile: string;
  hidden_expectations: string[];
  company: string;
  role: string;
  decision: 'APPLY' | 'SKIP' | 'REVISIT';
  fit_score: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  key_reasons: string[];
  strengths: string[];
  gaps: string[];
  risks: string[];
  strategy: string;
  resume_bullets: string[];
  next_action: string;
  resume_gap_analysis: string[];
  resume_improvements: string[];
  role_insights: string[];
  actionable_next_steps: string[];
  hiring_probability: number; // 0-100
  score_breakdown: {
    job_fit: number;       // 0-100
    growth: number;        // 0-100
    culture: number;       // 0-100
    risk: number;          // 0-100
    compensation: number;  // 0-100
  };
  culture_summary: string;
  missing_keywords: string[];
  application_checklist: { item: string; category: string }[];
}

export interface ComparisonResult {
  recommendation: string;
  rankings: {
    company_name: string;
    rank: number;
    reason: string;
  }[];
  comparison_summary: string;
}

export interface InterviewQuestion {
  category: string;
  question: string;
  rationale: string;
  answerAngle: string;
  followUpQuestions: string[];
}

export interface CompanyOverview {
  companyName: string;
  industry: string;
  businessDetails: string;
  isListed: string;
  marketCap: string;
}

export interface ProductAnalysis {
  products: string;
  goods: string;
  services: string;
  keyProducts: string;
  strengths: string;
  weaknesses: string;
}

export interface FinancialIndicator {
  year: string;
  revenue: string;
  operatingProfit: string;
  netIncome: string;
  notes: string;
}

export interface Competitor {
  name: string;
  description: string;
}

export interface FutureDirection {
  strategicDirection: string;
  growthEngines: string;
  newMarketStrategy: string;
}

export interface CorporateAnalysisReport {
  overview: CompanyOverview;
  product: ProductAnalysis;
  customer: { characteristics: string };
  financials: FinancialIndicator[];
  competitors: Competitor[];
  future: FutureDirection;
  dataVerification: {
    sources: string[];
    accuracyNotes: string;
    lastUpdated: string;
  };
}
