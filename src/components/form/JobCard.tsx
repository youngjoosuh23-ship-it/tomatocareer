import React from 'react';
import { Trash2, Link, FileImage, AlertCircle, CheckCircle } from 'lucide-react';
import { CompanyInfo } from '../../types';
import { scrapeJD, parseJDFile } from '../../services/gemini';

interface JobCardProps {
  index: number;
  company: CompanyInfo;
  canRemove: boolean;
  jdInputMethod: 'url' | 'text' | 'file';
  jdUrl: string;
  jdFetchState: 'idle' | 'loading' | 'success' | 'error' | 'login';
  jdFileState: 'idle' | 'loading' | 'success' | 'error';
  onUpdate: (field: keyof CompanyInfo, value: string) => void;
  onRemove: () => void;
  onSetMethod: (method: 'url' | 'text' | 'file') => void;
  onSetUrl: (url: string) => void;
  onFetchStateChange: (state: 'idle' | 'loading' | 'success' | 'error' | 'login') => void;
  onFileStateChange: (state: 'idle' | 'loading' | 'success' | 'error') => void;
  onCompanyUpdate: (updated: CompanyInfo) => void;
  t: Record<string, string>;
}

const FIELD_LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#4a4a47',
  marginBottom: 7,
  letterSpacing: '-0.01em',
};

const JOB_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.88)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.85)',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 10px 30px -16px rgba(180,50,50,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
};

export function JobCard({
  index,
  company,
  canRemove,
  jdInputMethod,
  jdUrl,
  jdFetchState,
  jdFileState,
  onUpdate,
  onRemove,
  onSetMethod,
  onSetUrl,
  onFetchStateChange,
  onFileStateChange,
  onCompanyUpdate,
  t,
}: JobCardProps) {
  const handleJdFetch = async () => {
    if (!jdUrl.trim()) return;
    onFetchStateChange('loading');
    try {
      const data = await scrapeJD(jdUrl);
      onCompanyUpdate({
        company_name: data.company_name || company.company_name,
        role: data.role || company.role,
        jd_text: data.jd_text,
      });
      onFetchStateChange('success');
      setTimeout(() => {
        onFetchStateChange('idle');
        onSetMethod('text');
      }, 2000);
    } catch (err: any) {
      onFetchStateChange(err?.status === 401 ? 'login' : 'error');
    }
  };

  const handleJdFileParse = (file: File) => {
    const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!SUPPORTED_TYPES.includes(file.type)) {
      onFileStateChange('error');
      return;
    }
    onFileStateChange('loading');
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileData = e.target?.result as string;
        const data = await parseJDFile(fileData, file.type);
        onCompanyUpdate({
          company_name: data.company_name || company.company_name,
          role: data.role || company.role,
          jd_text: data.jd_text,
        });
        onFileStateChange('success');
        setTimeout(() => {
          onFileStateChange('idle');
          onSetMethod('text');
        }, 2000);
      } catch {
        onFileStateChange('error');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ ...JOB_CARD, animationDelay: `${index * 50}ms` }} className="animate-in">
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 600 }}>
          <span style={{ width: 26, height: 26, borderRadius: 8, background: '#FFF0F0', color: '#FF6B6B', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
            {index + 1}
          </span>
          <span style={{ color: '#4a4a47' }}>{company.company_name || t.companyPlaceholder}</span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#6e6e6a', display: 'grid', placeItems: 'center' }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(200,69,69,0.08)'; el.style.color = '#c84545'; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'transparent'; el.style.color = '#6e6e6a'; }}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Company + Role */}
      <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2">
        <div>
          <label style={FIELD_LABEL}>{t.companyName}</label>
          <input type="text" value={company.company_name}
            onChange={(e) => onUpdate('company_name', e.target.value)}
            className="form-input" placeholder={t.companyPlaceholder} required />
        </div>
        <div>
          <label style={FIELD_LABEL}>{t.roleTitle}</label>
          <input type="text" value={company.role}
            onChange={(e) => onUpdate('role', e.target.value)}
            className="form-input" placeholder={t.rolePlaceholder} required />
        </div>
      </div>

      {/* JD input */}
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 7 }}>
          <label style={{ ...FIELD_LABEL, margin: 0 }}>{t.jobDescription}</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['url', 'text', 'file'] as const).map(tab => {
              const active = jdInputMethod === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onSetMethod(tab)}
                  style={{
                    padding: '5px 11px', borderRadius: 7,
                    background: active ? '#FFF0F0' : 'rgba(255,255,255,0.6)',
                    border: `1px solid ${active ? 'rgba(255,107,107,0.25)' : 'rgba(29,29,27,0.08)'}`,
                    fontSize: 12, fontWeight: 600,
                    color: active ? '#FF6B6B' : '#6e6e6a',
                    cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontFamily: 'inherit',
                  }}
                >
                  {tab === 'url' && <Link size={12} />}
                  {tab === 'file' && <FileImage size={12} />}
                  {tab === 'url' ? t.jdInputUrl : tab === 'file' ? t.jdInputFile : t.jdInputText}
                </button>
              );
            })}
          </div>
        </div>

        {jdInputMethod === 'file' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '28px 16px', borderRadius: 11,
                border: '2px dashed rgba(255,107,107,0.3)',
                background: 'rgba(255,107,107,0.04)',
                cursor: jdFileState === 'loading' ? 'wait' : 'pointer',
              }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleJdFileParse(file); }}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleJdFileParse(f); e.target.value = ''; }}
                disabled={jdFileState === 'loading'}
              />
              {jdFileState === 'loading' ? (
                <>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid #FF6B6B', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                  <span style={{ fontSize: 13, color: '#FF6B6B', fontWeight: 600 }}>{t.jdFileParsing}</span>
                </>
              ) : (
                <>
                  <FileImage size={28} color="#FF6B6B" strokeWidth={1.5} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#FF6B6B' }}>{t.jdInputFile}</span>
                  <span style={{ fontSize: 11, color: '#9e9e9a' }}>{t.jdFileHint}</span>
                </>
              )}
            </label>
            {jdFileState === 'success' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#059669', fontWeight: 500 }}>
                <CheckCircle size={12} /> {t.jdFileSuccess}
              </div>
            )}
            {jdFileState === 'error' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#dc2626', fontWeight: 500 }}>
                <AlertCircle size={12} /> {t.jdFileError}
              </div>
            )}
          </div>
        ) : jdInputMethod === 'url' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="url" value={jdUrl}
                onChange={(e) => onSetUrl(e.target.value)}
                className="form-input" style={{ flex: 1 }} placeholder={t.jdUrlPlaceholder} />
              <button
                type="button"
                onClick={handleJdFetch}
                disabled={jdFetchState === 'loading' || !jdUrl.trim()}
                style={{
                  padding: '10px 16px', background: '#FF6B6B', color: '#fff',
                  fontSize: 12, fontWeight: 600, borderRadius: 11, border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  opacity: (jdFetchState === 'loading' || !jdUrl.trim()) ? 0.4 : 1,
                }}
              >
                {jdFetchState === 'loading' ? t.jdFetching : t.jdFetchBtn}
              </button>
            </div>
            {jdFetchState === 'success' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#059669', fontWeight: 500 }}>
                <CheckCircle size={12} /> {t.jdFetchSuccess}
              </div>
            )}
            {jdFetchState === 'login' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#d97706', fontWeight: 500 }}>
                <AlertCircle size={12} /> {t.jdFetchLoginRequired}
              </div>
            )}
            {jdFetchState === 'error' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#dc2626', fontWeight: 500 }}>
                <AlertCircle size={12} /> {t.jdFetchError}
              </div>
            )}
            {company.jd_text && (
              <textarea value={company.jd_text}
                onChange={(e) => onUpdate('jd_text', e.target.value)}
                className="form-input" style={{ minHeight: 112 }}
                placeholder={t.jdPlaceholder} />
            )}
          </div>
        ) : (
          <textarea value={company.jd_text}
            onChange={(e) => onUpdate('jd_text', e.target.value)}
            className="form-input" style={{ minHeight: 130 }}
            placeholder={t.jdPlaceholder} required />
        )}
      </div>
    </div>
  );
}
