import React from 'react';
import { Upload, CheckCircle2, Circle, Loader2, ExternalLink, ChevronRight, AlertCircle, RefreshCw, Sparkles, MapPin } from 'lucide-react';
import { agentParseResume, agentDiscoverJobs, ParsedResume, DiscoveredJob } from '../services/gemini';
import { analyzeJobOpportunity, compareJobOpportunities, scrapeJD } from '../services/gemini';
import { AnalysisResponse, ComparisonResult, UserBackground } from '../types';
import { saveToHistory } from '../services/careerHistoryService';
import { submitBenchmarkData } from '../services/supabaseService';

// 'confirming' = after parse, user edits location before discovery starts
type AgentStep = 'idle' | 'parsing' | 'confirming' | 'discovering' | 'selecting' | 'fetching' | 'analyzing' | 'done' | 'error';

interface TrackedJob extends DiscoveredJob {
  selected: boolean;
  fetchStatus: 'pending' | 'fetching' | 'done' | 'error';
  jd_text?: string;
  company_from_jd?: string;
  role_from_jd?: string;
}

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
    id: 'confirming',
    label: { ko: '검색 조건 확인', en: 'Confirm Search' },
    description: { ko: '위치와 검색 조건을 확인하고 탐색을 시작하세요', en: 'Confirm location and start job search' },
  },
  {
    id: 'discovering',
    label: { ko: '공고 탐색', en: 'Job Discovery' },
    description: { ko: 'Google Search로 적합한 채용공고를 실시간 탐색합니다', en: 'Real-time search via Google for matching job postings' },
  },
  {
    id: 'selecting',
    label: { ko: '공고 선택', en: 'Select Jobs' },
    description: { ko: '분석할 공고를 선택하세요', en: 'Choose which jobs to analyze' },
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

// Returns the index in STEPS array, or -1 for idle/done/error
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
  const [location, setLocation] = React.useState('');
  const [jobs, setJobs] = React.useState<TrackedJob[]>([]);
  const [analysisProgress, setAnalysisProgress] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Step 1: Upload → parse resume
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

    setErrorMsg('');
    setStep('parsing');

    try {
      const fileData = await toBase64(file);
      const parsed = await agentParseResume(fileData, file.type);
      setParsedResume(parsed);
      setLocation(parsed.location || '');
      setStep('confirming');
    } catch (err: any) {
      setErrorMsg(err.message || L('이력서 분석에 실패했습니다. 다시 시도해 주세요.', 'Failed to parse resume. Please try again.', lang));
      setStep('error');
    }
  };

  // Step 2: User confirms location → discover jobs
  const handleDiscover = async () => {
    if (!parsedResume) return;
    setErrorMsg('');
    setStep('discovering');

    try {
      const backgroundWithLocation = { ...parsedResume, location };
      const { jobs: discovered } = await agentDiscoverJobs(backgroundWithLocation, lang);
      const tracked: TrackedJob[] = discovered.map(j => ({
        ...j,
        selected: true,
        fetchStatus: 'pending',
      }));
      setJobs(tracked);
      setStep('selecting');
    } catch (err: any) {
      setErrorMsg(err.message || L('공고 탐색에 실패했습니다. 다시 시도해 주세요.', 'Job discovery failed. Please try again.', lang));
      setStep('error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const toggleJob = (idx: number) => {
    setJobs(prev => prev.map((j, i) => i === idx ? { ...j, selected: !j.selected } : j));
  };

  // Step 3: Fetch JDs → analyze
  const handleProceed = async () => {
    if (!parsedResume) return;
    const selectedJobs = jobs.filter(j => j.selected);
    if (selectedJobs.length === 0) {
      setErrorMsg(L('최소 1개의 공고를 선택해 주세요.', 'Please select at least one job.', lang));
      return;
    }

    setErrorMsg('');
    setStep('fetching');

    // Fetch JDs for selected jobs
    const updatedJobs = [...jobs];
    for (let i = 0; i < updatedJobs.length; i++) {
      if (!updatedJobs[i].selected) continue;
      updatedJobs[i] = { ...updatedJobs[i], fetchStatus: 'fetching' };
      setJobs([...updatedJobs]);

      try {
        const jdData = await scrapeJD(updatedJobs[i].jd_url);
        updatedJobs[i] = {
          ...updatedJobs[i],
          fetchStatus: 'done',
          jd_text: jdData.jd_text,
          company_from_jd: jdData.company_name,
          role_from_jd: jdData.role,
        };
      } catch {
        updatedJobs[i] = { ...updatedJobs[i], fetchStatus: 'error' };
      }
      setJobs([...updatedJobs]);
    }

    // Analyze
    setStep('analyzing');
    setAnalysisProgress(0);

    const background: UserBackground = {
      major: parsedResume.major,
      experience: parsedResume.experience,
      skills: parsedResume.skills,
      target_roles: parsedResume.target_roles,
      constraints: [parsedResume.constraints, location ? `Location: ${location}` : ''].filter(Boolean).join('. '),
      resumeText: parsedResume.resumeText,
      content_language: lang,
    };

    const analyzableJobs = updatedJobs.filter(j => j.selected && j.fetchStatus === 'done' && j.jd_text);
    if (analyzableJobs.length === 0) {
      setErrorMsg(L('JD를 수집할 수 없었습니다. 공고 URL을 확인하거나 다시 시도해 주세요.', 'Could not fetch any JDs. Please check URLs or try again.', lang));
      setStep('error');
      return;
    }

    const analyses: AnalysisResponse[] = [];
    for (let i = 0; i < analyzableJobs.length; i++) {
      const job = analyzableJobs[i];
      try {
        const result = await analyzeJobOpportunity(background, {
          company_name: job.company_from_jd || job.company_name,
          role: job.role_from_jd || job.role,
          jd_text: job.jd_text!,
        });
        analyses.push(result);
      } catch {
        // skip failed analyses silently
      }
      setAnalysisProgress(Math.round(((i + 1) / analyzableJobs.length) * 100));
      if (i < analyzableJobs.length - 1) await new Promise(r => setTimeout(r, 2000));
    }

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
  };

  const handleReset = () => {
    setStep('idle');
    setErrorMsg('');
    setParsedResume(null);
    setLocation('');
    setJobs([]);
    setAnalysisProgress(0);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
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

      {/* Step progress tracker (shown after upload starts) */}
      {step !== 'idle' && step !== 'done' && (
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
                    {s.id === 'analyzing' && isActive && analysisProgress > 0 && (
                      <span className="ml-2 text-accent font-bold">{analysisProgress}%</span>
                    )}
                  </p>
                  {isActive && (
                    <p className="text-xs text-text-muted mt-0.5">{s.description[lang === 'en' ? 'en' : 'ko']}</p>
                  )}
                  {/* Per-job fetch progress */}
                  {s.id === 'fetching' && isActive && (
                    <div className="mt-2 space-y-1">
                      {jobs.filter(j => j.selected).map((j, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-text-muted">
                          {j.fetchStatus === 'done'
                            ? <CheckCircle2 size={11} className="text-green-500 shrink-0" />
                            : j.fetchStatus === 'error'
                            ? <AlertCircle size={11} className="text-red-400 shrink-0" />
                            : j.fetchStatus === 'fetching'
                            ? <Loader2 size={11} className="animate-spin text-accent shrink-0" />
                            : <Circle size={11} className="text-border-theme shrink-0" />}
                          <span className="truncate">{j.company_name} · {j.role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Location confirmation panel (after parsing, before discovery) */}
      {step === 'confirming' && parsedResume && (
        <div className="space-y-4">
          {/* Parsed summary */}
          <div className="bg-slate-50 border border-border-theme rounded-xl px-4 py-3.5 space-y-2">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
              {L('이력서 분석 결과', 'Resume Summary', lang)}
            </p>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
              <span className="text-text-muted">{L('목표 직군', 'Target Roles', lang)}</span>
              <span className="font-medium text-text-main">{parsedResume.target_roles}</span>
              <span className="text-text-muted">{L('스킬', 'Skills', lang)}</span>
              <span className="font-medium text-text-main">{parsedResume.skills.split(',').slice(0, 6).join(', ')}</span>
              <span className="text-text-muted">{L('경력 레벨', 'Level', lang)}</span>
              <span className="font-medium text-text-main capitalize">{parsedResume.career_level}</span>
            </div>
          </div>

          {/* Location question */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin size={15} className="text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-main">
                  {L('희망하는 근무 위치가 있으신가요?', 'Do you have a preferred work location?', lang)}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {location
                    ? L(`이력서 기반으로 "${location}"을 추측했습니다. 다르면 수정해 주세요.`,
                        `We guessed "${location}" from your resume. Edit if different.`, lang)
                    : L('이력서에서 위치를 찾지 못했습니다. 직접 입력하거나 비워두세요.',
                        'No location found in resume. Type one or leave blank.', lang)}
                </p>
              </div>
            </div>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDiscover()}
              placeholder={L('예: 서울 / 판교 / Remote / San Francisco', 'e.g. Seoul / Remote / San Francisco', lang)}
              className="w-full px-4 py-3 text-sm bg-white border border-border-theme rounded-xl outline-none focus:border-accent/40 transition-colors text-text-main placeholder:text-text-muted/50"
            />
          </div>

          <button
            onClick={handleDiscover}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-[#E55252] transition-all shadow-sm shadow-accent/20"
          >
            {L('공고 탐색 시작', 'Search for Jobs', lang)}
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Parsed resume summary during later steps */}
      {parsedResume && (step === 'discovering' || step === 'selecting' || step === 'fetching' || step === 'analyzing') && (
        <div className="bg-slate-50 border border-border-theme rounded-xl px-4 py-3 flex items-center gap-4 text-xs">
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-text-main">{parsedResume.target_roles}</span>
            <span className="text-text-muted ml-2">· {parsedResume.career_level}</span>
          </div>
          {location && (
            <span className="flex items-center gap-1 text-text-muted shrink-0">
              <MapPin size={11} /> {location}
            </span>
          )}
        </div>
      )}

      {/* Job selection panel */}
      {step === 'selecting' && jobs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-text-main">
              {L(`${jobs.length}개 공고를 찾았습니다`, `Found ${jobs.length} jobs`, lang)}
            </p>
            <span className="text-xs text-text-muted">
              {jobs.filter(j => j.selected).length}{L('개 선택됨', ' selected', lang)}
            </span>
          </div>

          <div className="space-y-2">
            {jobs.map((job, idx) => (
              <button
                key={idx}
                onClick={() => toggleJob(idx)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left transition-all
                  ${job.selected
                    ? 'border-accent/30 bg-accent/5 shadow-sm'
                    : 'border-border-theme bg-white hover:border-accent/20'}`}
              >
                <span className={`mt-0.5 shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                  ${job.selected ? 'bg-accent border-accent' : 'border-border-theme bg-white'}`}>
                  {job.selected && <CheckCircle2 size={9} className="text-white" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-text-main">{job.company_name}</p>
                      <p className="text-xs text-accent font-medium">{job.role}</p>
                    </div>
                    <a
                      href={job.jd_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 text-text-muted/50 hover:text-accent transition-colors mt-0.5"
                      title={L('공고 원문 보기', 'View original posting', lang)}
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                  <p className="text-xs text-text-muted mt-1">{job.reason}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleProceed}
            disabled={jobs.filter(j => j.selected).length === 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-[#E55252] disabled:opacity-40 transition-all shadow-sm shadow-accent/20"
          >
            {L('선택한 공고 분석 시작', 'Analyze Selected Jobs', lang)}
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Empty discovery fallback */}
      {step === 'selecting' && jobs.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertCircle size={28} className="text-text-muted/40" />
          <p className="text-sm text-text-muted">
            {L('공고를 찾지 못했습니다. 위치 조건을 바꾸거나 Career Copilot에서 JD를 직접 붙여넣어 보세요.',
               'No jobs found. Try changing your location or paste a JD directly in Career Copilot.', lang)}
          </p>
          <button onClick={handleReset} className="text-sm text-accent font-semibold hover:underline">
            {L('처음으로', 'Start over', lang)}
          </button>
        </div>
      )}
    </div>
  );
}
