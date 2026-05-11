import React, { useState, useEffect } from 'react';
import { Clock, Trash2, RotateCcw, ChevronRight } from 'lucide-react';
import { CareerHistoryItem, loadHistory, deleteHistoryItem, clearHistory } from '../../services/careerHistoryService';
import { AnalysisResponse, ComparisonResult, UserBackground } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
  onRestore: (analyses: AnalysisResponse[], comparison?: ComparisonResult, background?: UserBackground) => void;
  systemLanguage: 'en' | 'ko' | 'zh';
}

const DECISION_COLORS = {
  APPLY: 'bg-emerald-100 text-emerald-700',
  REVISIT: 'bg-amber-100 text-amber-700',
  SKIP: 'bg-rose-100 text-rose-700',
};

export function CareerHistoryView({ onRestore, systemLanguage }: Props) {
  const [history, setHistory] = useState<CareerHistoryItem[]>([]);

  const label = {
    en: { title: 'Analysis History', empty: 'No history yet.', restore: 'Restore', deleteAll: 'Clear All', ago: 'ago' },
    ko: { title: '분석 히스토리', empty: '아직 기록이 없습니다.', restore: '복원', deleteAll: '전체 삭제', ago: '전' },
    zh: { title: '分析記錄', empty: '尚無記錄。', restore: '還原', deleteAll: '清除全部', ago: '前' },
  }[systemLanguage];

  useEffect(() => { setHistory(loadHistory()); }, []);

  const handleDelete = (id: string) => setHistory(deleteHistoryItem(id));

  const handleClearAll = () => { clearHistory(); setHistory([]); };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}일 ${label.ago}`;
    if (h > 0) return `${h}시간 ${label.ago}`;
    if (m > 0) return `${m}분 ${label.ago}`;
    return systemLanguage === 'en' ? 'Just now' : '방금 전';
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black flex items-center gap-2">
          <Clock size={20} className="text-accent" /> {label.title}
        </h2>
        {history.length > 0 && (
          <button onClick={handleClearAll}
            className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors">
            <Trash2 size={13} /> {label.deleteAll}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 text-text-muted text-sm">{label.empty}</div>
      ) : (
        <div className="space-y-3">
          {history.map(item => (
            <div key={item.id} className="bg-white border border-border-theme rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex flex-col gap-0.5 mb-1">
                  {item.analyses.map(a => (
                    <div key={a.company + a.role} className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-sm text-text-main shrink-0">{a.company}</span>
                      <span className="text-text-muted text-xs truncate min-w-0">· {a.role}</span>
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0', DECISION_COLORS[a.decision])}>
                        {a.decision}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-text-muted">
                  {timeAgo(item.timestamp)} · {item.analyses.length}개 포지션
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-text-muted hover:text-rose-500 transition-colors">
                  <Trash2 size={15} />
                </button>
                <button onClick={() => onRestore(item.analyses, item.comparison, item.background)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-accent/10 text-accent hover:bg-accent/20 text-xs font-bold rounded-lg transition-all">
                  <RotateCcw size={12} /> {label.restore} <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
