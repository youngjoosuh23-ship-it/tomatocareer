import { CorporateAnalysisReport } from "../types";

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

export async function analyzeCompany(companyName: string, language: 'ko' | 'en' | 'zh' = 'ko'): Promise<CorporateAnalysisReport> {
  return apiFetch('/api/corporate-analyze', { companyName, language });
}

export async function translateReport(report: CorporateAnalysisReport, targetLang: 'ko' | 'en' | 'zh'): Promise<CorporateAnalysisReport> {
  return apiFetch('/api/corporate-translate', { report, targetLang });
}

export async function processFileData(fileContent: string, fileName: string, language: 'ko' | 'en' | 'zh' = 'ko', isPdf = false): Promise<CorporateAnalysisReport> {
  return apiFetch('/api/corporate-file', { fileContent, fileName, language, isPdf });
}

export async function generateInterviewQuestions(report: CorporateAnalysisReport, language: 'ko' | 'en' | 'zh'): Promise<{ questions: any[] }> {
  return apiFetch('/api/corporate-questions', { report, language });
}
