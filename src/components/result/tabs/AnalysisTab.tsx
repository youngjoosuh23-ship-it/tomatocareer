import React from 'react';
import { AnalysisResponse } from '../../../types';

interface AnalysisTabProps {
  data: AnalysisResponse;
  language: 'en' | 'ko' | 'zh';
  t: Record<string, string>;
}

export function AnalysisTab({ data, language, t }: AnalysisTabProps) {
  return (
    <div className="space-y-6 animate-in">
      <section className="space-y-2.5">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t.strengths}</p>
        <div className="flex flex-wrap gap-2">
          {data.strengths.map((s, i) => (
            <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-medium rounded-full">{s}</span>
          ))}
        </div>
      </section>

      <section className="space-y-2.5">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t.experienceGaps}</p>
        <div className="flex flex-wrap gap-2">
          {data.gaps.map((g, i) => (
            <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 text-xs font-medium rounded-full">{g}</span>
          ))}
        </div>
      </section>

      <section className="space-y-2.5">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t.risks}</p>
        <div className="flex flex-wrap gap-2">
          {data.risks.map((r, i) => (
            <span key={i} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 text-xs font-medium rounded-full">{r}</span>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t.resumeGapAnalysis}</p>
        {data.resume_gap_analysis.map((g, i) => (
          <div key={i} className="flex gap-2.5 items-start text-sm text-text-main">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />{g}
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t.roleLevelInsights}</p>
        {data.role_insights.map((ins, i) => (
          <div key={i} className="flex gap-2.5 items-start text-sm text-text-main">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />{ins}
          </div>
        ))}
      </section>

      {data.missing_keywords?.length > 0 && (
        <section className="space-y-2.5">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            {language === 'ko' ? '누락된 키워드' : language === 'zh' ? '缺少的關鍵字' : 'Missing Keywords'}
          </p>
          <div className="flex flex-wrap gap-2">
            {data.missing_keywords.map((kw, i) => (
              <span key={i} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 border-dashed text-xs font-semibold rounded-full flex items-center gap-1">
                <span className="text-red-400 font-bold">+</span>{kw}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-text-muted/70">
            {language === 'ko'
              ? 'JD에 있지만 이력서에 없는 키워드입니다. 해당 역량이 있다면 이력서에 추가하세요.'
              : language === 'zh'
                ? 'JD 中有但履歷中缺少的關鍵字。若具備相關能力，請加入履歷。'
                : 'Keywords in the JD missing from your resume. Add them if you have the experience.'}
          </p>
        </section>
      )}
    </div>
  );
}
