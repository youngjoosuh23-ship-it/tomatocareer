import React from 'react';
import { Upload, CheckCircle2, Circle, Loader2, AlertCircle, RefreshCw, Sparkles, X } from 'lucide-react';
import { agentParseResume, agentDiscoverJobs, ParsedResume } from '../services/gemini';
import { analyzeJobOpportunity, compareJobOpportunities, scrapeJD } from '../services/gemini';
import { AnalysisResponse, ComparisonResult, UserBackground } from '../types';
import { saveToHistory } from '../services/careerHistoryService';
import { submitBenchmarkData } from '../services/supabaseService';

type AgentStep = 'idle' | 'parsing' | 'discovering' | 'fetching' | 'analyzing' | 'done' | 'error';

interface StepDef {
  id: AgentStep;
  label: { ko: string; en: string };
  description: { ko: string; en: string };
}

const STEPS: StepDef[] = [
  {
    id: 'parsing',
    label: { ko: '이력서 분석', en: 'Resume Parsing' },
    description: { ko: 'AI가 이력서에서 경력, 스킬, 목표 직군을 추출합니다', en: 'AI extracts experience, skills, and target roles from your resume' },
  },
  {
    id: 'discovering',
    label: { ko: '공고 탐색', en: 'Job Discovery' },
    description: { ko: 'Google Search로 적합한 채용공고를 실시간 탐색합니다', en: 'Real-time search via Google for matching job postings' },
  },
  {
    id: 'fetching',
    label: { ko: 'JD 수집', en: 'Fetching JDs' },
    description: { ko: '각 공고 페이지에서 JD 내용을 자동 수집합니다', en: 'Automatically scraping job descriptions from each posting' },
  },
  {
    id: 'analyzing',
    label: { ko: '적합도 분석', en: 'Fit Analysis' },
    description: { ko: '각 포지션과 내 프로필의 적합도를 분석합니다', en: 'Analyzing fit score and strategy for each position' },
  },
];

const activeStepIndex = (step: AgentStep): number =>
  STEPS.findIndex(s => s.id === step);

const L = (ko: string, en: string, lang: 'en' | 'ko' | 'zh') =>
  lang === 'ko' || lang === 'zh' ? ko : en;

interface Props {
  systemLanguage: 'en' | 'ko' | 'zh';
  onDone: (analyses: AnalysisResponse[], comparison: ComparisonResult | undefined, background: UserBackground) => void;
}

export function AgentView({ systemLanguage: lang, onDone }: Props) {
  const [step, setStep] = React.useState<AgentStep>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [parsedResume, setParsedResume] = React.useState<ParsedResume | null>(null);
  const [jobCount, setJobCount] = React.useState(0);
  const [fetchProgress, setFetchProgress] = React.useState({ done: 0, total: 0 });
  const [analysisProgress, setAnalysisProgress] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cancelRef = React.useRef(false);

  const cancel = () => {
    cancelRef.current = true;
    handleReset();
  };

  const handleReset = () => {
    cancelRef.current = false;
    setStep('idle');
    setErrorMsg('');
    setParsedResume(null);
    setJobCount(0);
    setFetchProgress({ done: 0, total: 0 });
    setAnalysisProgress(0);
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFile = async (file: File) => {
    if (!file) return;
    const SUPPORTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!SUPPORTED_TYPES.includes(file.type)) {
      setErrorMsg(L('PDF, JPEG, PNG, WebP 파일만 지원됩니다.', 'Only PDF, JPEG, PNG, WebP files are supported.', lang));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(L('파일 크기는 10MB 이하여야 합니다.', 'File size must be under 10MB.', lang));
      return;
    }

    cancelRef.current = false;
    setErrorMsg('');

    try {
      // ── Step 1: Parse resume ──────────────────────────────────────────
      setStep('parsing');
      const fileData = await toBase64(file);
      const parsed = await agentParseResume(fileData, file.type);
      if (cancelRef.current) return;
      setParsedResume(parsed);

      // ── Step 2: Discover jobs ─────────────────────────────────────────
      setStep('discovering');
      const { jobs: discovered } = await agentDiscoverJobs(parsed, lang);
      if (cancelRef.current) return;
      setJobCount(discovered.length);

      if (discovered.length === 0) {
        setErrorMsg(L(
          '공고를 찾지 못했습니다. Career Copilot에서 JD를 직접 붙여넣어 보세요.',
          'No jobs found. Try pasting a JD directly in Career Copilot.',
          lang
        ));
        setStep('error');
        return;
      }

      // ── Step 3: Fetch JDs ─────────────────────────────────────────────
      setStep('fetching');
      setFetchProgress({ done: 0, total: discovered.length });

      const fetchedJobs: Array<{ company_name: string; role: string; jd_text: string }> = [];
      for (const job of discovered) {
        if (cancelRef.current) return;
        try {
          const jdData = await scrapeJD(job.jd_url);
          if (jdData.jd_text) {
            fetchedJobs.push({
              company_name: jdData.company_name || job.company_name,
              role: jdData.role || job.role,
              jd_text: jdData.jd_text,
            });
          }
        } catch {
          // skip unfetchable JDs silently
        }
        setFetchProgress(p => ({ ...p, done: p.done + 1 }));
      }

      if (cancelRef.current) return;
      if (fetchedJobs.length === 0) {
        setErrorMsg(L('JD를 수집할 수 없었습니다. 다시 시도해 주세요.', 'Could not fetch any JDs. Please try again.', lang));
        setStep('error');
        return;
      }

      // ── Step 4: Analyze ───────────────────────────────────────────────
      setStep('analyzing');
      setAnalysisProgress(0);

      const background: UserBackground = {
        major: parsed.major,
        experience: parsed.experience,
        skills: parsed.skills,
        target_roles: parsed.target_roles,
        constraints: [parsed.constraints, parsed.location ? `Location: ${parsed.location}` : ''].filter(Boolean).join('. '),
        resumeText: parsed.resumeText,
        content_language: lang,
      };

      const analyses: AnalysisResponse[] = [];
      for (let i = 0; i < fetchedJobs.length; i++) {
        if (cancelRef.current) return;
        try {
          const result = await analyzeJobOpportunity(background, fetchedJobs[i]);
          analyses.push(result);
        } catch {
          // skip failed analyses silently
        }
        setAnalysisProgress(Math.round(((i + 1) / fetchedJobs.length) * 100));
        if (i < fetchedJobs.length - 1) await new Promise(r => setTimeout(r, 2000));
      }

      if (cancelRef.current) return;
      if (analyses.length === 0) {
        setErrorMsg(L('분석에 실패했습니다. 다시 시도해 주세요.', 'Analysis failed. Please try again.', lang));
        setStep('error');
        return;
      }

      let comparison: ComparisonResult | undefined;
      if (analyses.length > 1) {
        try {
          comparison = await compareJobOpportunities(background, analyses);
        } catch {
          // comparison is optional
        }
      }

      saveToHistory(analyses, comparison, background);
      analyses.forEach(r => {
        submitBenchmarkData({
          company: r.company,
          role: r.role,
          fit_score: r.fit_score,
          hiring_probability: r.hiring_probability,
          decision: r.decision,
          background_summary: `${background.major} / ${background.target_roles}`,
        }).catch(() => {});
      });

      setStep('done');
      onDone(analyses, comparison, background);
    } catch (err: any) {
      if (cancelRef.current) return;
      setErrorMsg(err.message || L('오류가 발생했습니다. 다시 시도해 주세요.', 'An error occurred. Please try again.', lang));
      setStep('error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const isRunning = step !== 'idle' && step !== 'done' && step !== 'error';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
              <Sparkles size={16} className="text-accent" />
            </span>
            {L('AI 자동 분석', 'AI Auto Analysis', lang)}
          </h1>
          <p className="text-sm text-text-muted">
            {L(
              '이력서만 올리면 AI가 공고 탐색부터 적합도 분석까지 자동으로 처리합니다',
              'Upload your resume — AI handles job discovery and fit analysis automatically',
              lang
            )}
          </p>
        </div>
        {isRunning && (
          <button
            onClick={cancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-red-500 hover:bg-red-50 border border-border-theme transition-all"
          >
            <X size={12} />
            {L('취소', 'Cancel', lang)}
          </button>
        )}
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span className="flex-1">{errorMsg}</span>
          {step === 'error' && (
            <button onClick={handleReset} className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-semibold shrink-0">
              <RefreshCw size={12} /> {L('다시 시작', 'Restart', lang)}
            </button>
          )}
        </div>
      )}

      {/* Upload zone */}
      {step === 'idle' && (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all
            ${isDragging ? 'border-accent bg-accent/5 scale-[1.01]' : 'border-border-theme bg-white hover:border-accent/40 hover:bg-accent/3'}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Upload size={24} className="text-accent" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-text-main text-sm">
              {L('이력서를 드래그하거나 클릭해서 업로드', 'Drag & drop or click to upload your resume', lang)}
            </p>
            <p className="text-xs text-text-muted">PDF, JPEG, PNG, WebP · 최대 10MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
        </div>
      )}

      {/* Progress tracker */}
      {isRunning && (
        <>
          {/* Parsed resume pill */}
          {parsedResume && (
            <div className="bg-slate-50 border border-border-theme rounded-xl px-4 py-3 flex items-center gap-3 text-xs">
              <CheckCircle2 size={13} className="text-green-500 shrink-0" />
              <span className="font-semibold text-text-main truncate">{parsedResume.target_roles}</span>
              <span className="text-text-muted">· {parsedResume.career_level}</span>
              {parsedResume.location && (
                <span className="text-text-muted ml-auto shrink-0">{parsedResume.location}</span>
              )}
            </div>
          )}

          <div className="bg-white border border-border-theme rounded-2xl divide-y divide-border-theme overflow-hidden">
            {STEPS.map((s, idx) => {
              const currentIdx = activeStepIndex(step);
              const isDone = currentIdx > idx;
              const isActive = s.id === step;
              const isPending = currentIdx < idx;

              return (
                <div key={s.id} className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${isActive ? 'bg-accent/4' : ''}`}>
                  <span className="mt-0.5 shrink-0">
                    {isDone
                      ? <CheckCircle2 size={18} className="text-green-500" />
                      : isActive
                      ? <Loader2 size={18} className="text-accent animate-spin" />
                      : <Circle size={18} className="text-border-theme" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isPending ? 'text-text-muted/50' : 'text-text-main'}`}>
                      {s.label[lang === 'en' ? 'en' : 'ko']}
                      {/* Sub-labels for active steps */}
                      {s.id === 'discovering' && isDone && jobCount > 0 && (
                        <span className="ml-2 text-xs font-normal text-text-muted">
                          {L(`${jobCount}개 공고 발견`, `${jobCount} jobs found`, lang)}
                        </span>
                      )}
                      {s.id === 'fetching' && (isDone || isActive) && fetchProgress.total > 0 && (
                        <span className="ml-2 text-xs font-normal text-text-muted">
                          {fetchProgress.done}/{fetchProgress.total}
                        </span>
                      )}
                      {s.id === 'analyzing' && isActive && analysisProgress > 0 && (
                        <span className="ml-2 text-accent font-bold">{analysisProgress}%</span>
                      )}
                    </p>
                    {isActive && (
                      <p className="text-xs text-text-muted mt-0.5">{s.description[lang === 'en' ? 'en' : 'ko']}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
