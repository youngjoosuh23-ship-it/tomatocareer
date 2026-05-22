import React from 'react';
import { AnalysisResponse, ComparisonResult, DEFAULT_PRIORITIES, UserBackground } from '../types';
import { cn } from '../lib/utils';
import {
  CheckCircle2,
  ChevronLeft,
  Trophy,
  Wand2,
  Download,
  TrendingUp,
  TrendingDown,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from 'lucide-react';
import { translations } from '../lib/translations';
import { saveApplication } from '../services/trackerService';
import { fetchBenchmarkStats, submitFeedback } from '../services/supabaseService';
import { CopyButton } from './ui/CopyButton';
import { OverviewTab } from './result/tabs/OverviewTab';
import { AnalysisTab } from './result/tabs/AnalysisTab';
import { StrategyTab } from './result/tabs/StrategyTab';
import { ChecklistTab } from './result/tabs/ChecklistTab';

interface AnalysisResultProps {
  results: AnalysisResponse[];
  comparison?: ComparisonResult;
  onReset: () => void;
  onRebuild: (analysis: AnalysisResponse) => void;
  systemLanguage: 'en' | 'ko' | 'zh';
  contentLanguage?: string;
  userBackground?: UserBackground;
}

function buildMd(data: AnalysisResponse): string {
  return `# ${data.company} — ${data.role}

**Decision:** ${data.decision} | **Fit Score:** ${data.fit_score}% | **Hiring Probability:** ${data.hiring_probability}%

## Key Reasons
${data.key_reasons.map(r => `- ${r}`).join('\n')}

## Strengths
${data.strengths.map(r => `- ${r}`).join('\n')}

## Gaps
${data.gaps.map(r => `- ${r}`).join('\n')}

## Risks
${data.risks.map(r => `- ${r}`).join('\n')}

## Strategy
${data.strategy}

## Hidden Expectations
${data.hidden_expectations.map(r => `- ${r}`).join('\n')}

## Resume Bullets
${data.resume_bullets.map(r => `- ${r}`).join('\n')}

## Actionable Next Steps
${data.actionable_next_steps.map(r => `- ${r}`).join('\n')}
`.trim();
}

function downloadMd(data: AnalysisResponse) {
  const blob = new Blob([buildMd(data)], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${data.company}-${data.role}-analysis.md`.replace(/\s+/g, '-');
  a.click();
  URL.revokeObjectURL(a.href);
}

const DECISION_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  APPLY:   { label: 'Apply',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  SKIP:    { label: 'Skip',    bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-500' },
  REVISIT: { label: 'Revisit', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
};

export function AnalysisResult({ results, comparison, onReset, onRebuild, systemLanguage, userBackground }: AnalysisResultProps) {
  const t = translations[systemLanguage];
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [appliedIds, setAppliedIds] = React.useState<Set<string>>(new Set());
  const [feedbackMap, setFeedbackMap] = React.useState<Record<string, 'apply' | 'skip' | 'not_interested'>>({});
  const [benchmarkStats, setBenchmarkStats] = React.useState<{ count: number; avgFit: number; avgHire: number } | null>(null);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'analysis' | 'strategy' | 'checklist'>('overview');

  const data = results[activeIndex];

  React.useEffect(() => {
    setBenchmarkStats(null);
    fetchBenchmarkStats(data.company, data.role).then(setBenchmarkStats).catch(() => {});
  }, [data.company, data.role]);

  const handleMarkApplied = () => {
    saveApplication(data);
    setAppliedIds(prev => new Set(prev).add(`${data.company}-${data.role}`));
  };
  const isApplied = appliedIds.has(`${data.company}-${data.role}`);

  const feedbackKey = `${data.company}-${data.role}`;
  const currentFeedback = feedbackMap[feedbackKey];

  const handleFeedback = (decision: 'apply' | 'skip' | 'not_interested') => {
    setFeedbackMap(prev => ({ ...prev, [feedbackKey]: decision }));
    submitFeedback({
      company: data.company,
      role: data.role,
      fit_score: data.fit_score,
      hiring_probability: data.hiring_probability,
      ai_decision: data.decision,
      user_decision: decision,
    });
  };

  const getFitColor = (score: number) => {
    if (score >= 75) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-500';
  };

  const getProbColor = (prob: number) => {
    if (prob >= 70) return 'text-success-theme';
    if (prob >= 40) return 'text-warning-theme';
    return 'text-danger-theme';
  };

  const tabs = [
    { id: 'overview'  as const, label: systemLanguage === 'ko' ? '개요'     : systemLanguage === 'zh' ? '概覽' : 'Overview' },
    { id: 'analysis'  as const, label: systemLanguage === 'ko' ? '분석'     : systemLanguage === 'zh' ? '分析' : 'Analysis' },
    { id: 'strategy'  as const, label: systemLanguage === 'ko' ? '전략'     : systemLanguage === 'zh' ? '策略' : 'Strategy' },
    { id: 'checklist' as const, label: systemLanguage === 'ko' ? '체크리스트' : systemLanguage === 'zh' ? '清單'  : 'Checklist' },
  ];

  const decision = DECISION_CONFIG[data.decision] ?? DECISION_CONFIG['REVISIT'];

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      {/* Back button */}
      <div className="pt-6 pb-5">
        <button onClick={onReset}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors group font-medium">
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          {t.backToInput}
        </button>
      </div>

      {/* Multi-job switcher */}
      {results.length > 1 && (
        <div className="flex gap-1 mb-5 p-1 bg-slate-100 rounded-xl w-fit">
          {results.map((r, i) => (
            <button key={i} onClick={() => { setActiveIndex(i); setActiveTab('overview'); }}
              className={cn('px-4 py-1.5 text-sm font-medium rounded-[10px] transition-all',
                activeIndex === i ? 'bg-white shadow-sm text-text-main' : 'text-text-muted hover:text-text-main')}>
              {r.company}
            </button>
          ))}
        </div>
      )}

      {/* Hero Card */}
      <div className="bg-white rounded-2xl border border-border-theme shadow-sm overflow-hidden mb-3">
        <div className={cn('h-1', data.decision === 'APPLY' ? 'bg-emerald-500' : data.decision === 'SKIP' ? 'bg-red-500' : 'bg-amber-500')} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-muted mb-0.5">{data.role}</p>
              <h1 className="text-2xl font-extrabold text-text-main truncate tracking-tight">{data.company}</h1>
            </div>
            <span className={cn('shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full', decision.bg, decision.text)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', decision.dot)} />
              {decision.label}
            </span>
          </div>

          <div className="flex items-end gap-8">
            <div>
              <p className={cn('text-5xl font-black tabular-nums', getFitColor(data.fit_score))}>
                {data.fit_score}<span className="text-xl font-medium text-text-muted">%</span>
              </p>
              <p className="text-[11px] font-medium text-text-muted mt-1 uppercase tracking-wide">{t.matchConfidence}</p>
            </div>
            <div>
              <p className={cn('text-2xl font-bold tabular-nums', getProbColor(data.hiring_probability))}>
                {data.hiring_probability}%
              </p>
              <p className="text-[11px] font-medium text-text-muted mt-1 uppercase tracking-wide">{t.hiringProbability}</p>
            </div>
            {benchmarkStats && (
              <div className="ml-auto text-right">
                <div className={cn('flex items-center justify-end gap-1 text-sm font-bold',
                  data.fit_score >= benchmarkStats.avgFit ? 'text-emerald-600' : 'text-red-500')}>
                  {data.fit_score >= benchmarkStats.avgFit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(data.fit_score - benchmarkStats.avgFit)}%
                </div>
                <p className="text-[10px] text-text-muted mt-0.5">
                  {systemLanguage === 'ko' ? '평균 대비' : 'vs avg'} ({benchmarkStats.count})
                </p>
              </div>
            )}
          </div>

          {/* Score breakdown */}
          {data.score_breakdown && (() => {
            const priorities = userBackground?.priorities ?? DEFAULT_PRIORITIES;
            const CRITERIA = [
              { key: 'job_fit',      label: systemLanguage === 'ko' ? '직무 적합도' : systemLanguage === 'zh' ? '職務適合度' : 'Job Fit' },
              { key: 'growth',       label: systemLanguage === 'ko' ? '성장 가능성' : systemLanguage === 'zh' ? '成長可能性' : 'Growth' },
              { key: 'culture',      label: systemLanguage === 'ko' ? '문화 적합성' : systemLanguage === 'zh' ? '文化適合性' : 'Culture Fit' },
              { key: 'risk',         label: systemLanguage === 'ko' ? '리스크'     : systemLanguage === 'zh' ? '風險'       : 'Risk' },
              { key: 'compensation', label: systemLanguage === 'ko' ? '보상'       : systemLanguage === 'zh' ? '薪酬'       : 'Compensation' },
            ] as const;
            return (
              <div className="mt-4 pt-4 border-t border-border-theme space-y-2">
                {CRITERIA.map(({ key, label }) => {
                  const score = data.score_breakdown[key] ?? 0;
                  const rank = priorities[key] ?? 3;
                  const weight = Math.round(rank / 15 * 100);
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-text-muted w-24 shrink-0">{label}</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', score >= 70 ? 'bg-emerald-400' : score >= 45 ? 'bg-amber-400' : 'bg-rose-400')}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold tabular-nums text-text-main w-8 text-right">{score}</span>
                      <span className="text-[10px] text-text-muted w-10 text-right">×{weight}%</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <ul className="mt-5 space-y-2 pt-5 border-t border-border-theme">
            {data.key_reasons.slice(0, 4).map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-text-main">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Comparison card */}
      {comparison && results.length > 1 && (
        <div className="bg-white rounded-2xl border border-border-theme shadow-sm p-5 mb-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
              <Trophy size={12} className="text-amber-500" />
              {t.compareResults}
            </p>
            <CopyButton text={comparison.comparison_summary} label={t.copy} copiedLabel={t.copied} />
          </div>
          <p className="text-sm font-semibold text-text-main">{comparison.recommendation}</p>
          <div className="flex flex-wrap gap-2">
            {comparison.rankings.map((rank, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 px-3 py-1 rounded-full font-medium">
                <span className="text-accent font-bold">#{rank.rank}</span>
                {rank.company_name}
              </span>
            ))}
          </div>
          <p className="text-xs text-text-muted leading-relaxed">{comparison.comparison_summary}</p>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2 py-2 mb-1">
        <button onClick={handleMarkApplied} disabled={isApplied}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            isApplied
              ? 'bg-emerald-50 text-emerald-700 cursor-default'
              : 'bg-slate-100 text-text-muted hover:bg-slate-200 hover:text-text-main')}>
          <CheckCircle2 size={12} />
          {isApplied ? (systemLanguage === 'ko' ? '지원 완료' : 'Applied') : t.applyNow}
        </button>
        <button onClick={() => onRebuild(data)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-[#E55252] transition-all shadow-sm shadow-accent/20">
          <Wand2 size={12} /> {t.rebuildResume}
        </button>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => downloadMd(data)}
            className="p-1.5 text-text-muted/60 hover:text-text-main hover:bg-slate-100 rounded-lg transition-all" title={t.exportMd}>
            <Download size={14} />
          </button>
          <CopyButton text={buildMd(data)} label={t.copy} copiedLabel={t.copied} />
        </div>
      </div>

      {/* Feedback strip */}
      <div className="flex items-center gap-2 py-2 mb-1">
        <span className="text-xs text-text-muted shrink-0">
          {systemLanguage === 'ko' ? '이 공고 어떻게 하실 건가요?' : 'What will you do with this job?'}
        </span>
        <div className="flex gap-1.5 ml-auto">
          {([
            { key: 'apply' as const, label: systemLanguage === 'ko' ? '지원' : 'Apply', icon: <ThumbsUp size={11} />, active: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { key: 'skip' as const, label: systemLanguage === 'ko' ? '패스' : 'Skip', icon: <ThumbsDown size={11} />, active: 'bg-red-50 text-red-600 border-red-200' },
            { key: 'not_interested' as const, label: systemLanguage === 'ko' ? '관심없음' : 'Not interested', icon: <Minus size={11} />, active: 'bg-slate-100 text-slate-600 border-slate-300' },
          ] as const).map(({ key, label, icon, active }) => (
            <button
              key={key}
              onClick={() => handleFeedback(key)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                currentFeedback === key
                  ? active
                  : 'text-text-muted border-border-theme hover:border-slate-300 hover:text-text-main bg-white'
              )}
            >
              {icon}
              {label}
              {currentFeedback === key && <CheckCircle2 size={10} className="ml-0.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-theme mb-6">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-main')}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab data={data} language={systemLanguage} />}
      {activeTab === 'analysis' && <AnalysisTab data={data} language={systemLanguage} t={t as unknown as Record<string, string>} />}
      {activeTab === 'strategy' && <StrategyTab data={data} language={systemLanguage} t={t as unknown as Record<string, string>} userBackground={userBackground} />}
      {activeTab === 'checklist' && <ChecklistTab data={data} language={systemLanguage} />}
    </div>
  );
}
