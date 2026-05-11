import { useState, useEffect } from 'react';
import { CorporateAnalysisReport } from '../../types';
import { Clock, Trash2, ExternalLink } from 'lucide-react';

export interface HistoryItem {
  id: string;
  timestamp: number;
  report: CorporateAnalysisReport;
  searchTerm: string;
}

export function saveReportToHistory(report: CorporateAnalysisReport, searchTerm: string) {
  const saved = localStorage.getItem('corporate_history');
  let history: HistoryItem[] = [];
  if (saved) {
    try { history = JSON.parse(saved); } catch (e) {}
  }
  history.push({ id: Math.random().toString(36).substring(2, 11), timestamp: Date.now(), report, searchTerm });
  if (history.length > 50) history.shift();
  localStorage.setItem('corporate_history', JSON.stringify(history));
}

type Lang = 'ko' | 'en' | 'zh';

export function HistoryView({ onLoadReport, language = 'ko' }: { onLoadReport: (report: CorporateAnalysisReport, searchTerm: string) => void; language?: Lang }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const L = (ko: string, en: string, zh: string) => language === 'ko' ? ko : language === 'zh' ? zh : en;

  useEffect(() => {
    const saved = localStorage.getItem('corporate_history');
    if (saved) {
      try {
        const parsed: HistoryItem[] = JSON.parse(saved);
        setHistory(parsed.filter(item => item?.report?.overview));
      } catch (e) {}
    }
  }, []);

  const handleDelete = (id: string) => {
    const next = history.filter(h => h.id !== id);
    setHistory(next);
    localStorage.setItem('corporate_history', JSON.stringify(next));
  };

  const handleClear = () => {
    setHistory([]);
    localStorage.removeItem('corporate_history');
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-natural-text">{L("히스토리 로그", "History Log", "歷史記錄")}</h2>
          <p className="text-natural-muted mt-1">{L("과거에 분석했던 기업들의 리포트를 다시 불러옵니다.", "Reload previously analyzed company reports.", "重新載入過去分析過的企業報告。")}</p>
        </div>
        {history.length > 0 && (
          <button onClick={handleClear} className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">
            {L("모두 지우기", "Clear All", "清除全部")}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-natural-border shadow-sm">
          <Clock size={40} className="mx-auto text-natural-muted/30 mb-4" />
          <p className="text-natural-muted font-medium">{L("아직 저장된 히스토리가 없습니다.", "No history saved yet.", "尚無歷史記錄。")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.sort((a, b) => b.timestamp - a.timestamp).map(item => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-natural-border shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-natural-accent">{item.searchTerm || item.report.overview.companyName}</h3>
                  <p className="text-xs text-natural-muted mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                </div>
                <button onClick={() => handleDelete(item.id)} className="text-natural-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="text-sm text-natural-muted line-clamp-2">
                {item.report.overview.industry} · {item.report.overview.marketCap}
              </div>
              <button
                onClick={() => onLoadReport(item.report, item.searchTerm)}
                className="mt-auto w-full py-2 bg-natural-bg hover:bg-natural-sidebar transition-colors rounded-lg text-sm font-bold text-natural-accent flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} /> {L("리포트 불러오기", "Load Report", "載入報告")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
