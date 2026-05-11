import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AnalysisResponse } from '../../../types';

interface ChecklistTabProps {
  data: AnalysisResponse;
  language: 'en' | 'ko' | 'zh';
}

export function ChecklistTab({ data, language }: ChecklistTabProps) {
  const [checkedItems, setCheckedItems] = React.useState<Set<number>>(new Set());

  const toggleItem = (idx: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  if (!data.application_checklist?.length) {
    return (
      <p className="text-sm text-text-muted text-center py-10">
        {language === 'ko' ? '분석을 실행하면 체크리스트가 생성됩니다.' : 'Run analysis to generate your checklist.'}
      </p>
    );
  }

  const grouped = data.application_checklist.reduce((acc, item, idx) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push({ ...item, idx });
    return acc;
  }, {} as Record<string, { item: string; category: string; idx: number }[]>);

  return (
    <div className="space-y-4 animate-in">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
          {language === 'ko'
            ? `${checkedItems.size} / ${data.application_checklist.length} 완료`
            : language === 'zh'
              ? `已完成 ${checkedItems.size} / ${data.application_checklist.length}`
              : `${checkedItems.size} / ${data.application_checklist.length} done`}
        </p>
        {checkedItems.size > 0 && (
          <button onClick={() => setCheckedItems(new Set())} className="text-[11px] text-text-muted hover:text-accent transition-colors">
            {language === 'ko' ? '초기화' : language === 'zh' ? '重置' : 'Reset'}
          </button>
        )}
      </div>

      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${(checkedItems.size / data.application_checklist.length) * 100}%` }}
        />
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="space-y-2">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{category}</p>
          {items.map(({ item, idx }) => (
            <button
              key={idx}
              onClick={() => toggleItem(idx)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                checkedItems.has(idx)
                  ? 'bg-emerald-50 border-emerald-200 opacity-70'
                  : 'bg-white border-border-theme hover:border-accent/30'
              }`}
            >
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                checkedItems.has(idx) ? 'bg-emerald-500 border-emerald-500' : 'border-border-theme'
              }`}>
                {checkedItems.has(idx) && <CheckCircle2 size={12} className="text-white" />}
              </span>
              <span className={`text-sm ${checkedItems.has(idx) ? 'line-through text-text-muted' : 'text-text-main'}`}>
                {item}
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
