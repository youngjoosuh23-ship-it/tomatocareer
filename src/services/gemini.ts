import { UserBackground, CompanyInfo, AnalysisResponse, ComparisonResult } from "../types";

async function apiFetch<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const err: any = new Error(data.error || `Request failed: ${response.status}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

export async function analyzeJobOpportunity(
  background: UserBackground,
  company: CompanyInfo
): Promise<AnalysisResponse> {
  return apiFetch<AnalysisResponse>('/api/analyze', { background, company });
}

export async function compareJobOpportunities(
  background: UserBackground,
  results: AnalysisResponse[]
): Promise<ComparisonResult> {
  return apiFetch<ComparisonResult>('/api/compare', { background, results });
}

export async function rebuildResume(
  background: UserBackground,
  analysis: AnalysisResponse
): Promise<{ rebuilt_resume: string }> {
  return apiFetch<{ rebuilt_resume: string }>('/api/rebuild', { background, analysis });
}

export async function scrapeJD(url: string): Promise<{ company_name: string; role: string; jd_text: string }> {
  return apiFetch('/api/jd-input', { url });
}

export async function parseJDFile(fileData: string, mimeType: string): Promise<{ company_name: string; role: string; jd_text: string }> {
  return apiFetch('/api/jd-input', { fileData, mimeType });
}

export interface SuggestedCompany {
  name: string;
  description: string;
  size: string;
  notable_for: string;
}

export interface JobListing {
  title: string;
  department: string;
  location: string;
  url: string;
}

export async function findJobs(companyName: string): Promise<{ careers_url: string; jobs: JobListing[] }> {
  return apiFetch('/api/find-jobs', { companyName });
}

export async function suggestCompanies(industry: string, language: string): Promise<{ companies: SuggestedCompany[] }> {
  return apiFetch('/api/suggest-companies', { industry, language });
}

export async function translateAnalysisResults(
  analyses: import('../types').AnalysisResponse[],
  comparison: import('../types').ComparisonResult | undefined,
  targetLanguage: 'en' | 'ko' | 'zh'
): Promise<{ analyses: import('../types').AnalysisResponse[]; comparison: import('../types').ComparisonResult | undefined }> {
  return apiFetch('/api/translate-analysis', { analyses, comparison, targetLanguage });
}

export async function generateCareerInterviewQuestions(
  background: UserBackground,
  analysis: AnalysisResponse
): Promise<{ questions: import('../types').InterviewQuestion[] }> {
  return apiFetch('/api/career-questions', { background, analysis });
}

export interface ParsedResume {
  major: string;
  experience: string;
  skills: string;
  target_roles: string;
  constraints: string;
  location: string;
  target_industries: string[];
  career_level: 'entry' | 'mid' | 'senior' | 'executive';
  resumeText: string;
}

export interface DiscoveredJob {
  company_name: string;
  role: string;
  jd_url: string;
  reason: string;
}

export async function agentParseResume(
  fileData: string,
  mimeType: string
): Promise<ParsedResume> {
  return apiFetch('/api/agent-parse', { fileData, mimeType });
}

export interface FeedbackHints {
  excluded_companies: string[];   // user_decision = 'not_interested'
  preferred_roles: string[];      // role titles user chose to 'apply'
}

export async function agentDiscoverJobs(
  background: ParsedResume,
  language: 'en' | 'ko' | 'zh',
  feedbackHints?: FeedbackHints
): Promise<{ jobs: DiscoveredJob[] }> {
  return apiFetch('/api/agent-discover', { background, language, feedbackHints });
}
