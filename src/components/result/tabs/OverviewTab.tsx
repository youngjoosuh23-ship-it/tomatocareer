import React from 'react';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { AnalysisResponse } from '../../../types';

interface OverviewTabProps {
  data: AnalysisResponse;
  language: 'en' | 'ko' | 'zh';
}

export function OverviewTab({ data, language }: OverviewTabProps) {
  return (
    <div className="space-y-4 animate-in">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
        <ArrowRight size={15} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-emerald-800">{data.next_action}</p>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-border-theme">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
          {language === 'ko' ? '이상적인 지원자 프로필' : language === 'zh' ? '理想候選人檔案' : 'Ideal Candidate Profile'}
        </p>
        <p className="text-sm text-text-main italic leading-relaxed">"{data.ideal_candidate_profile}"</p>
      </div>

      {data.hidden_expectations.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            {language === 'ko' ? '숨겨진 기대치' : language === 'zh' ? '隱藏期望' : 'Hidden Expectations'}
          </p>
          {data.hidden_expectations.map((e, i) => (
            <div key={i} className="flex gap-2.5 items-start text-sm text-text-main p-3 rounded-xl bg-amber-50/60 border border-amber-100/80">
              <Lightbulb size={13} className="text-amber-500 shrink-0 mt-0.5" />
              {e}
            </div>
          ))}
        </div>
      )}

      {data.culture_summary && (
        <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">
            {language === 'ko' ? '문화 & 분위기' : language === 'zh' ? '文化氛圍' : 'Culture & Vibe'}
          </p>
          <p className="text-sm text-text-main leading-relaxed">{data.culture_summary}</p>
        </div>
      )}
    </div>
  );
}
