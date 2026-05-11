import React from 'react';
import { Search, ExternalLink, Briefcase, AlertCircle, Building2 } from 'lucide-react';
import { findJobs } from '../services/gemini';

interface Props {
  systemLanguage: 'en' | 'ko' | 'zh';
}

const L = (ko: string, en: string, zh: string, lang: 'en' | 'ko' | 'zh') =>
  lang === 'ko' ? ko : lang === 'zh' ? zh : en;

const LinkedInIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

interface BoardLink { label: string; href: string; icon: React.ReactNode; description: string }

function getJobBoardLinks(company: string, lang: 'en' | 'ko' | 'zh'): BoardLink[] {
  const q = encodeURIComponent(company);
  const slug = company.toLowerCase().replace(/\s+/g, '-');
  return [
    {
      label: 'LinkedIn Jobs',
      href: `https://www.linkedin.com/company/${slug}/jobs/`,
      icon: <LinkedInIcon />,
      description: L('회사 공식 LinkedIn 채용 페이지', 'Company LinkedIn jobs page', '公司 LinkedIn 招聘頁面', lang),
    },
    {
      label: 'LinkedIn Search',
      href: `https://www.linkedin.com/jobs/search/?keywords=${q}&f_TPR=r2592000`,
      icon: <LinkedInIcon />,
      description: L('최근 1개월 LinkedIn 검색', 'LinkedIn search — last 30 days', 'LinkedIn 近30天搜尋', lang),
    },
    {
      label: 'Indeed',
      href: `https://www.indeed.com/jobs?q=${q}`,
      icon: <span className="w-4 h-4 rounded-sm bg-[#003A9B] flex items-center justify-center text-white text-[9px] font-black leading-none flex-shrink-0">i</span>,
      description: L('Indeed 채용공고 검색', 'Indeed job search', 'Indeed 職位搜尋', lang),
    },
    {
      label: 'Glassdoor',
      href: `https://www.glassdoor.com/Jobs/${q}-jobs-SRCH_KE0,${company.length}.htm`,
      icon: <span className="w-4 h-4 rounded-full bg-[#0CAA41] flex items-center justify-center text-white text-[9px] font-black leading-none flex-shrink-0">G</span>,
      description: L('Glassdoor 채용공고 + 리뷰', 'Glassdoor jobs + reviews', 'Glassdoor 職位＋評價', lang),
    },
  ];
}

export function JobFinderView({ systemLanguage: lang }: Props) {
  const [query, setQuery] = React.useState('');
  const [state, setState] = React.useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [careersUrl, setCareersUrl] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setState('loading');
    setCareersUrl('');
    try {
      const result = await findJobs(query.trim());
      setCareersUrl(result.careers_url ?? '');
      setState('done');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to find careers page');
      setState('error');
    }
  };

  const boardLinks = state === 'done' ? getJobBoardLinks(query, lang) : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-text-main tracking-tight flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
            <Briefcase size={16} className="text-accent" />
          </span>
          {L('채용공고 탐색', 'Job Finder', '職位搜尋', lang)}
        </h1>
        <p className="text-sm text-text-muted">
          {L(
            '회사 이름을 입력하면 공식 채용 페이지와 구직 플랫폼 링크를 안내해 드립니다',
            'Enter a company name to get direct links to their jobs on major platforms',
            '輸入公司名稱，取得各大平台的招聘連結',
            lang
          )}
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white border border-border-theme rounded-xl px-4 shadow-sm focus-within:border-accent/40 transition-colors">
          <Building2 size={16} className="text-text-muted shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={L('회사 이름 입력 (예: Google, 삼성, Kakao...)', 'Company name (e.g. Google, Samsung, Kakao...)', '公司名稱（例如 Google、三星）', lang)}
            className="flex-1 py-3.5 text-sm bg-transparent outline-none text-text-main placeholder:text-text-muted/50"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={state === 'loading' || !query.trim()}
          className="flex items-center gap-2 px-5 py-3.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-[#E55252] disabled:opacity-40 transition-all shadow-sm shadow-accent/20 shrink-0"
        >
          {state === 'loading'
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Search size={15} />}
          {L('검색', 'Search', '搜尋', lang)}
        </button>
      </div>

      {/* Error */}
      {state === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}

      {/* Results */}
      {state === 'done' && (
        <div className="space-y-4">
          {/* Official careers page */}
          {careersUrl ? (
            <a
              href={careersUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3.5 bg-accent/5 border border-accent/20 rounded-xl text-sm hover:bg-accent/10 transition-colors group"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Building2 size={14} className="text-accent shrink-0" />
                <span className="font-semibold text-accent">{L('공식 채용 페이지', 'Official Careers Page', '官方招聘頁面', lang)}</span>
                <span className="text-text-muted truncate text-xs">{careersUrl}</span>
              </span>
              <ExternalLink size={13} className="text-accent/60 group-hover:text-accent transition-colors shrink-0 ml-2" />
            </a>
          ) : (
            <p className="text-xs text-text-muted/60 px-1">
              {L('공식 채용 페이지를 찾지 못했습니다. 아래 플랫폼에서 검색해 보세요.', 'Could not find the official careers page. Try searching below.', '找不到官方招聘頁面，請透過以下平台搜尋。', lang)}
            </p>
          )}

          {/* Job board links */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest px-1">
              {L('구직 플랫폼에서 실시간 공고 확인', 'Find live job postings on', '在招聘平台查看即時職缺', lang)}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {boardLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-white border border-border-theme rounded-xl hover:border-accent/30 hover:shadow-sm transition-all group"
                >
                  {link.icon}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-main">{link.label}</p>
                    <p className="text-xs text-text-muted truncate">{link.description}</p>
                  </div>
                  <ExternalLink size={12} className="text-text-muted/40 group-hover:text-accent transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </div>

          {/* Hint for Career Copilot */}
          <div className="flex items-start gap-3 px-4 py-3.5 bg-slate-50 border border-border-theme rounded-xl">
            <Briefcase size={14} className="text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted leading-relaxed">
              {L(
                '마음에 드는 공고를 찾으셨나요? JD 내용을 복사해서 Career Copilot의 URL 입력 또는 텍스트 붙여넣기로 분석할 수 있어요.',
                'Found a role you like? Copy the job description and analyze it in Career Copilot via URL or paste.',
                '找到喜歡的職位了嗎？複製 JD 內容，在 Career Copilot 貼上即可分析。',
                lang
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
