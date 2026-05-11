import React from 'react';
import { AnalysisResponse, UserBackground } from '../types';
import { translations } from '../lib/translations';
import { cn } from '../lib/utils';
import {
  ChevronLeft,
  Download,
  Copy,
  Check,
  FileText,
  Sparkles,
  Edit3,
  Eye,
  FileDown,
  History,
  Loader2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { diffWords } from 'diff';
import { rebuildResume } from '../services/gemini';

interface ResumeRebuilderProps {
  analysis: AnalysisResponse;
  background: UserBackground;
  rebuiltResume: string;
  onBack: () => void;
  systemLanguage: 'en' | 'ko' | 'zh';
  contentLanguage: 'en' | 'ko' | 'zh';
}

export function ResumeRebuilder({ analysis, background, rebuiltResume: initialResume, onBack, systemLanguage }: ResumeRebuilderProps) {
  const t = translations[systemLanguage];
  const [copied, setCopied] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'preview' | 'edit' | 'diff'>('preview');
  const [content, setContent] = React.useState(initialResume);
  const resumeRef = React.useRef<HTMLDivElement>(null);
  const [activeLang, setActiveLang] = React.useState<'en' | 'ko' | 'zh'>(background.content_language ?? 'en');
  const [isTranslating, setIsTranslating] = React.useState(false);

  const handleLangSwitch = async (lang: 'en' | 'ko' | 'zh') => {
    if (lang === activeLang || isTranslating) return;
    setIsTranslating(true);
    try {
      const updatedBg = { ...background, content_language: lang };
      const result = await rebuildResume(updatedBg, analysis);
      setContent(result.rebuilt_resume);
      setActiveLang(lang);
      setViewMode('preview');
    } catch {
      // silently keep current content on error
    } finally {
      setIsTranslating(false);
    }
  };

  React.useEffect(() => {
    setContent(initialResume);
  }, [initialResume]);

  const originalText = React.useMemo(() => {
    if (background.resumeText) return background.resumeText;
    return `${t.major}: ${background.major}\n\n${t.experience}: ${background.experience}\n\n${t.skills}: ${background.skills}`;
  }, [background, t.major, t.experience, t.skills]);

  const diff = React.useMemo(() => diffWords(originalText, content), [originalText, content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadMd = () => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `Optimized_Resume_${analysis.company}.md`;
    document.body.appendChild(element);
    element.click();
  };

  const handleDownloadPdf = () => {
    if (!resumeRef.current) return;
    const opt = {
      margin: 1,
      filename: `Optimized_Resume_${analysis.company}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const },
    };
    html2pdf().set(opt).from(resumeRef.current).save();
  };

  const viewModes = [
    { id: 'preview' as const, icon: <Eye size={12} />, label: t.previewResume },
    { id: 'diff'    as const, icon: <History size={12} />, label: t.showChanges },
    { id: 'edit'    as const, icon: <Edit3 size={12} />, label: t.editResume },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-20">
      {/* Page header */}
      <div className="flex items-center justify-between py-6">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-main transition-colors group">
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          {t.backToAnalysis}
        </button>
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
            {(['en', 'ko', 'zh'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => handleLangSwitch(lang)}
                disabled={isTranslating}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  activeLang === lang ? 'bg-white shadow-sm text-accent' : 'text-text-muted hover:text-text-main'
                } disabled:opacity-50`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          {isTranslating && <Loader2 size={14} className="text-accent animate-spin" />}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
            <Sparkles size={13} />
            {t.rebuiltResume}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl font-extrabold text-text-main tracking-tight">{t.resumeRebuilderTitle}</h1>
        <p className="text-sm text-text-muted max-w-xl mx-auto leading-relaxed">{t.resumeRebuilderDesc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original panel */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
              <FileText size={12} className="text-text-muted" />
            </div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">{t.originalResume}</span>
          </div>

          <div className="bg-white rounded-2xl border border-border-theme shadow-sm h-[680px] overflow-y-auto p-6 space-y-5">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t.major}</p>
              <p className="text-sm text-text-main font-medium">{background.major}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t.experience}</p>
              <p className="text-sm text-text-main whitespace-pre-wrap leading-relaxed">{background.experience}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t.skills}</p>
              <p className="text-sm text-text-main">{background.skills}</p>
            </div>
            {background.resumeText && (
              <div className="space-y-1.5 pt-4 border-t border-border-theme">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t.resume}</p>
                <p className="text-[11px] text-text-muted leading-relaxed whitespace-pre-wrap">{background.resumeText}</p>
              </div>
            )}
          </div>
        </div>

        {/* Rebuilt panel */}
        <div className="flex flex-col gap-3">
          {/* Panel top row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center">
                <Sparkles size={12} className="text-accent" />
              </div>
              <span className="text-[11px] font-bold text-accent uppercase tracking-widest">{t.optimizedResume}</span>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-xl gap-0.5">
              {viewModes.map(vm => (
                <button key={vm.id} onClick={() => setViewMode(vm.id)}
                  className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-[10px] font-bold transition-all',
                    viewMode === vm.id ? 'bg-white shadow-sm text-accent' : 'text-text-muted hover:text-text-main')}>
                  {vm.icon}
                  <span className="hidden sm:inline">{vm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2">
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-text-muted hover:text-text-main rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all">
              {copied ? <Check size={11} className="text-success-theme" /> : <Copy size={11} />}
              {copied ? t.copied : t.copy}
            </button>
            <button onClick={handleDownloadMd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-text-muted hover:text-text-main rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all">
              <Download size={11} />
              {t.downloadResume}
            </button>
            <button onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-[#E55252] transition-all shadow-sm shadow-accent/20">
              <FileDown size={11} />
              {t.downloadPdf}
            </button>
          </div>

          {/* Content area */}
          <div className="bg-white rounded-2xl border border-border-theme shadow-sm h-[680px] overflow-hidden flex flex-col">
            {viewMode === 'edit' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full p-6 text-sm font-mono leading-relaxed bg-slate-50 outline-none resize-none text-slate-800 focus:bg-white transition-colors"
                spellCheck={false}
              />
            ) : viewMode === 'diff' ? (
              <div className="flex-1 p-6 overflow-y-auto bg-slate-50 font-mono text-xs leading-relaxed">
                {diff.map((part, index) => (
                  <span
                    key={index}
                    className={cn(
                      part.added && 'bg-emerald-100 text-emerald-800 font-semibold px-0.5 rounded',
                      part.removed && 'bg-red-100 text-red-700 line-through px-0.5 rounded',
                      !part.added && !part.removed && 'text-slate-500'
                    )}
                  >
                    {part.value}
                  </span>
                ))}
              </div>
            ) : (
              <div
                ref={resumeRef}
                className="flex-1 p-8 overflow-y-auto prose prose-slate max-w-none prose-sm
                  prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-slate-900
                  prose-p:leading-relaxed prose-strong:text-slate-900
                  prose-ul:list-disc prose-li:my-1 bg-white"
              >
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
