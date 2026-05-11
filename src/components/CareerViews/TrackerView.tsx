import React, { useState, useEffect } from 'react';
import { Trash2, ChevronRight, StickyNote } from 'lucide-react';
import {
  ApplicationRecord,
  ApplicationStatus,
  loadApplications,
  updateApplication,
  deleteApplication,
} from '../../services/trackerService';
import { cn } from '../../lib/utils';

interface Props {
  systemLanguage: 'en' | 'ko' | 'zh';
}

const PIPELINE: { status: ApplicationStatus; label: { en: string; ko: string; zh: string }; color: string }[] = [
  { status: 'analyzed',   label: { en: 'Analyzed',   ko: '분석 완료',  zh: '已分析'   }, color: 'bg-slate-200 text-slate-700'   },
  { status: 'applied',    label: { en: 'Applied',    ko: '지원 완료',  zh: '已投遞'   }, color: 'bg-blue-100 text-blue-700'     },
  { status: 'screening',  label: { en: 'Screening',  ko: '서류 심사',  zh: '書面審查'  }, color: 'bg-indigo-100 text-indigo-700' },
  { status: 'interview1', label: { en: '1st Interview', ko: '1차 면접', zh: '一面'    }, color: 'bg-violet-100 text-violet-700' },
  { status: 'interview2', label: { en: '2nd Interview', ko: '2차 면접', zh: '二面'    }, color: 'bg-purple-100 text-purple-700' },
  { status: 'final',      label: { en: 'Final Round', ko: '최종 면접', zh: '終面'     }, color: 'bg-amber-100 text-amber-700'   },
  { status: 'offer',      label: { en: 'Offer',      ko: '합격',      zh: '錄取'     }, color: 'bg-emerald-100 text-emerald-700'},
  { status: 'rejected',   label: { en: 'Rejected',   ko: '불합격',    zh: '未錄取'   }, color: 'bg-rose-100 text-rose-700'     },
];

const DECISION_DOT: Record<string, string> = {
  APPLY: 'bg-emerald-500', REVISIT: 'bg-amber-500', SKIP: 'bg-rose-500',
};

export function TrackerView({ systemLanguage }: Props) {
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  useEffect(() => { setApps(loadApplications()); }, []);

  const lang = systemLanguage;
  const label = {
    en: { title: 'Application Tracker', empty: 'No applications tracked. Mark a job as applied from the analysis result page.', deadline: 'Deadline', notes: 'Notes', save: 'Save', cancel: 'Cancel' },
    ko: { title: '지원 현황 트래커', empty: '추적 중인 지원이 없습니다. 분석 결과 페이지에서 지원 완료 표시를 해보세요.', deadline: '마감일', notes: '메모', save: '저장', cancel: '취소' },
    zh: { title: '投遞追蹤', empty: '尚無追蹤記錄。請在分析結果頁面標記已投遞。', deadline: '截止日期', notes: '備註', save: '儲存', cancel: '取消' },
  }[lang];

  const getStepLabel = (s: ApplicationStatus) =>
    PIPELINE.find(p => p.status === s)?.label[lang] ?? s;

  const getStepColor = (s: ApplicationStatus) =>
    PIPELINE.find(p => p.status === s)?.color ?? 'bg-slate-100 text-slate-600';

  const handleStatus = (id: string, status: ApplicationStatus) =>
    setApps(updateApplication(id, { status }));

  const handleDelete = (id: string) => setApps(deleteApplication(id));

  const handleDeadline = (id: string, deadline: string) =>
    setApps(updateApplication(id, { deadline }));

  const handleSaveNotes = (id: string) => {
    setApps(updateApplication(id, { notes: notesDraft }));
    setEditingNotes(null);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <h2 className="text-xl font-black flex items-center gap-2">
        <ChevronRight size={20} className="text-accent" /> {label.title}
      </h2>

      {apps.length === 0 ? (
        <div className="text-center py-20 text-text-muted text-sm max-w-sm mx-auto">{label.empty}</div>
      ) : (
        <div className="space-y-4">
          {apps.map(app => (
            <div key={app.id} className="bg-white border border-border-theme rounded-xl overflow-hidden shadow-sm">
              {/* Header */}
              <div className="px-5 py-3 flex items-center justify-between gap-3 border-b border-border-theme bg-slate-50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('w-2 h-2 rounded-full shrink-0', DECISION_DOT[app.analysis.decision] ?? 'bg-slate-400')} />
                  <span className="font-bold text-sm truncate">{app.company}</span>
                  <span className="text-text-muted text-xs truncate">· {app.role}</span>
                  <span className="text-[10px] font-bold text-text-muted">Fit {app.analysis.fit_score}%</span>
                </div>
                <button onClick={() => handleDelete(app.id)} className="text-text-muted hover:text-rose-500 transition-colors shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Pipeline */}
              <div className="px-5 py-4 space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {PIPELINE.map(step => (
                    <button
                      key={step.status}
                      onClick={() => handleStatus(app.id, step.status)}
                      className={cn(
                        'px-2.5 py-1 text-[11px] font-bold rounded-full transition-all',
                        app.status === step.status
                          ? step.color + ' ring-2 ring-offset-1 ring-current'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      )}
                    >
                      {step.label[lang]}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 flex-wrap text-xs text-text-muted">
                  <label className="flex items-center gap-1.5">
                    <span className="font-medium">{label.deadline}:</span>
                    <input
                      type="date"
                      value={app.deadline ?? ''}
                      onChange={e => handleDeadline(app.id, e.target.value)}
                      className="border border-border-theme rounded px-2 py-0.5 text-xs text-text-main outline-none focus:ring-1 focus:ring-accent"
                    />
                  </label>
                  <span className="text-[11px]">
                    {lang === 'ko' ? '현재 상태:' : lang === 'zh' ? '目前狀態:' : 'Status:'}
                    <span className={cn('ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold', getStepColor(app.status))}>
                      {getStepLabel(app.status)}
                    </span>
                  </span>
                </div>

                {/* Notes */}
                {editingNotes === app.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesDraft}
                      onChange={e => setNotesDraft(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border-theme focus:ring-2 focus:ring-accent outline-none resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveNotes(app.id)}
                        className="px-3 py-1 bg-accent text-white text-xs font-bold rounded-lg">
                        {label.save}
                      </button>
                      <button onClick={() => setEditingNotes(null)}
                        className="px-3 py-1 bg-slate-100 text-xs font-bold rounded-lg">
                        {label.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingNotes(app.id); setNotesDraft(app.notes); }}
                    className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-main transition-colors"
                  >
                    <StickyNote size={12} />
                    {app.notes ? app.notes.substring(0, 60) + (app.notes.length > 60 ? '…' : '') : label.notes + '...'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
