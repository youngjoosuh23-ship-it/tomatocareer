import React from 'react';
import { UserBackground, CompanyInfo } from '../types';
import { Plus, Briefcase, User, Send, Upload, CheckCircle2 } from 'lucide-react';
import { translations } from '../lib/translations';
import * as pdfjsLib from 'pdfjs-dist';
import { JobCard } from './form/JobCard';
import { PriorityRanker } from './form/PriorityRanker';

if (typeof ReadableStream !== 'undefined' && !ReadableStream.prototype[Symbol.asyncIterator]) {
  (ReadableStream.prototype as any)[Symbol.asyncIterator] = async function* (this: ReadableStream) {
    const reader = this.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  };
}

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface AnalysisFormProps {
  onAnalyze: (background: UserBackground, companies: CompanyInfo[]) => void;
  isLoading: boolean;
  systemLanguage: 'en' | 'ko' | 'zh';
  contentLanguage: 'en' | 'ko' | 'zh';
  prefillJob?: { companyName: string; role: string; jdText: string };
  onPrefillConsumed?: () => void;
}

const PANEL: React.CSSProperties = {
  background: 'rgba(255,255,255,0.88)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.85)',
  borderRadius: 22,
  padding: 28,
  boxShadow: '0 12px 40px -16px rgba(180,50,50,0.14), inset 0 1px 0 rgba(255,255,255,0.9)',
};

const FIELD_LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#4a4a47',
  marginBottom: 7,
  letterSpacing: '-0.01em',
};

const DIVIDER: React.CSSProperties = {
  height: 1,
  background: 'rgba(29,29,27,0.08)',
  margin: '20px 0',
};

const BACKGROUND_KEY = 'career_copilot_background';

export function AnalysisForm({ onAnalyze, isLoading, systemLanguage, contentLanguage, prefillJob, onPrefillConsumed }: AnalysisFormProps) {
  const t = translations[systemLanguage];

  const [background, setBackground] = React.useState<UserBackground>(() => {
    try {
      const saved = localStorage.getItem(BACKGROUND_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, content_language: contentLanguage };
      }
    } catch {}
    return { major: '', experience: '', skills: '', target_roles: '', constraints: '', resumeText: '', fileName: '', content_language: contentLanguage };
  });

  const [companies, setCompanies] = React.useState<CompanyInfo[]>([{ company_name: '', role: '', jd_text: '' }]);
  const [fileName, setFileName] = React.useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(BACKGROUND_KEY);
      if (saved) return JSON.parse(saved).fileName || null;
    } catch {}
    return null;
  });
  const [isParsing, setIsParsing] = React.useState(false);
  const [inputMethod, setInputMethod] = React.useState<'manual' | 'upload' | 'paste'>('manual');

  const [jdInputMethods, setJdInputMethods] = React.useState<Array<'url' | 'text' | 'file'>>(['text']);
  const [jdUrls, setJdUrls] = React.useState<string[]>(['']);
  const [jdFetchStates, setJdFetchStates] = React.useState<Array<'idle' | 'loading' | 'success' | 'error' | 'login'>>(['idle']);
  const [jdFileStates, setJdFileStates] = React.useState<Array<'idle' | 'loading' | 'success' | 'error'>>(['idle']);

  React.useEffect(() => {
    setBackground(prev => ({ ...prev, content_language: contentLanguage }));
  }, [contentLanguage]);

  React.useEffect(() => {
    try { localStorage.setItem(BACKGROUND_KEY, JSON.stringify(background)); } catch {}
  }, [background]);

  React.useEffect(() => {
    if (!prefillJob) return;
    setCompanies([{ company_name: prefillJob.companyName, role: prefillJob.role, jd_text: prefillJob.jdText }]);
    setJdInputMethods(['text']);
    setJdUrls(['']);
    setJdFetchStates(['idle']);
    setJdFileStates(['idle']);
    onPrefillConsumed?.();
  }, [prefillJob]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsParsing(true);
    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdfData = new Uint8Array(arrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: pdfData, disableStream: true, disableRange: true }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        setBackground({ ...background, resumeText: fullText, fileName: file.name });
      } else {
        const text = await file.text();
        setBackground({ ...background, resumeText: text, fileName: file.name });
      }
    } catch (err) {
      console.error('Error parsing file:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleClearResume = () => {
    setBackground(prev => ({ ...prev, resumeText: '', fileName: '' }));
    setFileName(null);
  };

  const addCompany = () => {
    setCompanies([...companies, { company_name: '', role: '', jd_text: '' }]);
    setJdInputMethods([...jdInputMethods, 'text']);
    setJdUrls([...jdUrls, '']);
    setJdFetchStates([...jdFetchStates, 'idle']);
    setJdFileStates([...jdFileStates, 'idle']);
  };

  const removeCompany = (index: number) => {
    if (companies.length > 1) {
      setCompanies(companies.filter((_, i) => i !== index));
      setJdInputMethods(jdInputMethods.filter((_, i) => i !== index));
      setJdUrls(jdUrls.filter((_, i) => i !== index));
      setJdFetchStates(jdFetchStates.filter((_, i) => i !== index));
      setJdFileStates(jdFileStates.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onAnalyze(background, companies);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[1400px] mx-auto px-10 max-sm:px-5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-6">

        {/* Left: My Background */}
        <div>
          <div style={PANEL} className="lg:sticky lg:top-20">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: '#FFF0F0', color: '#FF6B6B', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <User size={16} />
              </span>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: '#1d1d1b' }}>{t.yourBackground}</span>
            </div>

            {/* Segment control */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,107,107,0.06)', padding: 5, borderRadius: 12, marginBottom: 22 }}>
              {(['manual', 'upload', 'paste'] as const).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setInputMethod(method)}
                  style={{
                    flex: 1, textAlign: 'center', padding: '9px', borderRadius: 9,
                    fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s', border: 'none', fontFamily: 'inherit',
                    ...(inputMethod === method
                      ? { background: '#fff', color: '#FF6B6B', boxShadow: '0 2px 8px -2px rgba(180,50,50,0.12)' }
                      : { background: 'transparent', color: '#6e6e6a' }),
                  }}
                >
                  {method === 'manual' ? t.manualEntry : method === 'upload' ? t.uploadResume : t.pasteResume}
                </button>
              ))}
            </div>

            {/* Manual */}
            {inputMethod === 'manual' && (
              <>
                <div className="mb-4">
                  <label style={FIELD_LABEL}>{t.major}</label>
                  <input type="text" value={background.major}
                    onChange={(e) => setBackground({ ...background, major: e.target.value })}
                    className="form-input" placeholder={t.majorPlaceholder} required />
                </div>
                <div className="mb-4">
                  <label style={FIELD_LABEL}>{t.experience}</label>
                  <textarea value={background.experience}
                    onChange={(e) => setBackground({ ...background, experience: e.target.value })}
                    className="form-input" style={{ minHeight: 90 }}
                    placeholder={t.experiencePlaceholder} required />
                </div>
                <div className="mb-4">
                  <label style={FIELD_LABEL}>{t.skills}</label>
                  <input type="text" value={background.skills}
                    onChange={(e) => setBackground({ ...background, skills: e.target.value })}
                    className="form-input" placeholder={t.skillsPlaceholder} required />
                </div>
              </>
            )}

            {/* Upload */}
            {inputMethod === 'upload' && (
              <div className="mb-4">
                <label style={FIELD_LABEL}>{t.resume}</label>
                <input type="file" accept=".pdf,.txt,.md" onChange={handleFileUpload} className="hidden" id="resume-upload" />
                <label
                  htmlFor="resume-upload"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 12, width: '100%', height: 192,
                    border: `2px dashed ${fileName ? 'rgba(255,107,107,0.4)' : 'rgba(29,29,27,0.12)'}`,
                    borderRadius: 14, cursor: 'pointer',
                    background: fileName ? 'rgba(255,107,107,0.04)' : 'rgba(255,255,255,0.5)',
                    color: fileName ? '#FF6B6B' : '#6e6e6a', transition: 'all 0.15s',
                  }}
                >
                  {isParsing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, border: '3px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>Parsing...</span>
                    </div>
                  ) : fileName ? (
                    <>
                      <CheckCircle2 size={28} />
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>{fileName}</p>
                        <p style={{ fontSize: 10, opacity: 0.6, margin: '2px 0 0' }}>Click to replace</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleClearResume(); }}
                        style={{ fontSize: 10, color: '#e05252', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px' }}
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,107,107,0.08)', display: 'grid', placeItems: 'center' }}>
                        <Upload size={18} style={{ opacity: 0.7 }} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{t.resumePlaceholder}</p>
                        <p style={{ fontSize: 10, opacity: 0.5, margin: '2px 0 0' }}>PDF · TXT · MD</p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            )}

            {/* Paste */}
            {inputMethod === 'paste' && (
              <div className="mb-4">
                <label style={FIELD_LABEL}>{t.pasteResume}</label>
                <textarea
                  value={background.resumeText}
                  onChange={(e) => setBackground({ ...background, resumeText: e.target.value })}
                  className="form-input" style={{ minHeight: 180 }}
                  placeholder={t.pasteResumePlaceholder}
                  required={inputMethod === 'paste'}
                />
              </div>
            )}

            <div style={DIVIDER} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={FIELD_LABEL}>{t.targetRoles}</label>
                <input type="text" value={background.target_roles}
                  onChange={(e) => setBackground({ ...background, target_roles: e.target.value })}
                  className="form-input" placeholder={t.targetRolesPlaceholder} required />
              </div>
              <div>
                <label style={FIELD_LABEL}>{t.constraints}</label>
                <input type="text" value={background.constraints}
                  onChange={(e) => setBackground({ ...background, constraints: e.target.value })}
                  className="form-input" placeholder={t.constraintsPlaceholder} />
              </div>
            </div>

            <div style={DIVIDER} />
            <PriorityRanker
              priorities={background.priorities}
              onChange={(priorities) => setBackground(prev => ({ ...prev, priorities }))}
              language={systemLanguage}
            />
          </div>
        </div>

        {/* Right: Job Opportunities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: '#1d1d1b' }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: '#FFF0F0', color: '#FF6B6B', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Briefcase size={16} />
              </span>
              {t.jobOpportunity}
              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: '#FFF0F0', color: '#FF6B6B', fontSize: 13, fontWeight: 700, marginLeft: 4 }}>
                {companies.length}
              </span>
            </div>
            <button
              type="button"
              onClick={addCompany}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '9px 14px', background: 'rgba(255,107,107,0.08)',
                color: '#FF6B6B', border: '1px dashed rgba(255,107,107,0.35)',
                borderRadius: 10, fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
            >
              <Plus size={14} />
              {t.addAnotherJob}
            </button>
          </div>

          {companies.map((company, index) => (
            <JobCard
              key={index}
              index={index}
              company={company}
              canRemove={companies.length > 1}
              jdInputMethod={jdInputMethods[index] ?? 'text'}
              jdUrl={jdUrls[index] ?? ''}
              jdFetchState={jdFetchStates[index] ?? 'idle'}
              jdFileState={jdFileStates[index] ?? 'idle'}
              onUpdate={(field, value) => {
                const updated = [...companies];
                updated[index] = { ...updated[index], [field]: value };
                setCompanies(updated);
              }}
              onRemove={() => removeCompany(index)}
              onSetMethod={(method) => {
                const updated = [...jdInputMethods];
                updated[index] = method;
                setJdInputMethods(updated);
              }}
              onSetUrl={(url) => {
                const updated = [...jdUrls];
                updated[index] = url;
                setJdUrls(updated);
              }}
              onFetchStateChange={(state) => {
                const updated = [...jdFetchStates];
                updated[index] = state;
                setJdFetchStates(updated);
              }}
              onFileStateChange={(state) => {
                const updated = [...jdFileStates];
                updated[index] = state;
                setJdFileStates(updated);
              }}
              onCompanyUpdate={(updated) => {
                const all = [...companies];
                all[index] = updated;
                setCompanies(all);
              }}
              t={t as unknown as Record<string, string>}
            />
          ))}
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40, paddingBottom: 20, gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9e9e9a', fontWeight: 500 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6B6B', display: 'inline-block' }} />
          {contentLanguage === 'ko' ? '결과물이 한국어로 생성됩니다'
            : contentLanguage === 'zh' ? '結果將以繁體中文生成'
            : 'Results will be generated in English'}
          <span style={{ color: '#c0c0bc', margin: '0 2px' }}>·</span>
          <span style={{ color: '#FF6B6B', fontWeight: 600 }}>
            {contentLanguage === 'ko' ? 'KO' : contentLanguage === 'zh' ? 'ZH' : 'EN'}
          </span>
          <span style={{ color: '#c0c0bc' }}>
            {contentLanguage === 'ko' ? ' (헤더에서 변경 가능)' : contentLanguage === 'zh' ? ' (可於標題更改)' : ' (change in header)'}
          </span>
        </div>
        <button
          type="submit"
          disabled={isLoading || isParsing}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '14px 40px', background: '#FF6B6B', color: '#fff',
            borderRadius: 14, fontWeight: 700, fontSize: 15,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(255,107,107,0.35)',
            minWidth: 220, letterSpacing: '-0.01em',
            opacity: (isLoading || isParsing) ? 0.4 : 1,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
        >
          {isLoading ? (
            <>
              <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              {t.analyzing}
            </>
          ) : (
            <>
              <Send size={16} />
              {companies.length > 1 ? t.compareJobs : t.runAnalysis}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
