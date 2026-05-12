import React from 'react';
import { History, ListChecks, Sparkles, BarChart3, Briefcase, Wand2 } from 'lucide-react';
import { translations } from '../../lib/translations';
import { AuthButton } from '../AuthButton';
import { cn } from '../../lib/utils';

interface AppHeaderProps {
  language: 'en' | 'ko' | 'zh';
  onLanguageChange: (lang: 'en' | 'ko' | 'zh') => void;
  appMode: 'career' | 'corporate' | 'jobs' | 'agent';
  view: 'form' | 'result' | 'rebuild' | 'history' | 'tracker';
  onLogoClick: () => void;
  onNavCareer: () => void;
  onNavCorporate: () => void;
  onNavJobs: () => void;
  onNavHistory: () => void;
  onNavTracker: () => void;
  onNavAgent: () => void;
}

const TomatoLogo = () => (
  <svg viewBox="0 0 100 100" fill="none" width="28" height="28">
    <circle cx="50" cy="55" r="33" fill="#FF6B6B"/>
    <path d="M50 22 C36 7 14 15 21 27 C28 19 40 19 50 22Z" fill="#6ab870"/>
    <path d="M50 22 C64 7 86 15 79 27 C72 19 60 19 50 22Z" fill="#6ab870"/>
    <ellipse cx="50" cy="23" rx="9" ry="4" fill="#5aaa5e"/>
    <rect x="47" y="3" width="6" height="17" rx="3" fill="#4a8c4e"/>
    <ellipse cx="35" cy="44" rx="9" ry="5.5" fill="rgba(255,255,255,0.28)" transform="rotate(-20,35,44)"/>
    <circle cx="39" cy="57" r="4.5" fill="#9b2020"/>
    <circle cx="61" cy="57" r="4.5" fill="#9b2020"/>
    <circle cx="40.5" cy="55.5" r="1.8" fill="white"/>
    <circle cx="62.5" cy="55.5" r="1.8" fill="white"/>
    <path d="M36 70 Q50 84 64 70" fill="none" stroke="#9b2020" strokeWidth="3.5" strokeLinecap="round"/>
  </svg>
);

export function AppHeader({
  language,
  onLanguageChange,
  appMode,
  view,
  onLogoClick,
  onNavCareer,
  onNavCorporate,
  onNavJobs,
  onNavHistory,
  onNavTracker,
  onNavAgent,
}: AppHeaderProps) {
  const t = translations[language];

  const navItems = [
    { id: 'agent',       label: language === 'en' ? 'Auto Agent' : 'AI 자동 분석', icon: <Wand2 size={13} />, onClick: onNavAgent, active: appMode === 'agent', highlight: true },
    { id: 'career-form', label: 'Career Copilot', icon: <Sparkles size={13} />, onClick: onNavCareer, active: appMode === 'career' && view !== 'history' && view !== 'tracker', highlight: false },
    { id: 'corporate',   label: 'Corporate Insight', icon: <BarChart3 size={13} />, onClick: onNavCorporate, active: appMode === 'corporate', highlight: false },
    { id: 'jobs',        label: 'Job Finder', icon: <Briefcase size={13} />, onClick: onNavJobs, active: appMode === 'jobs', highlight: false },
    { id: 'history',     label: t.history, icon: <History size={13} />, onClick: onNavHistory, active: appMode === 'career' && view === 'history', highlight: false },
    { id: 'tracker',     label: t.tracker, icon: <ListChecks size={13} />, onClick: onNavTracker, active: appMode === 'career' && view === 'tracker', highlight: false },
  ];

  return (
    <header className="h-14 bg-white border-b border-border-theme flex items-center justify-between px-6 sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-6">
        <button onClick={onLogoClick} className="flex items-center gap-2 group">
          <div className="w-7 h-7 flex items-center justify-center">
            <TomatoLogo />
          </div>
          <span className="font-bold text-sm text-text-main tracking-tight hidden sm:block">{t.title}</span>
        </button>

        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                item.active
                  ? 'bg-accent/10 text-accent'
                  : item.highlight
                  ? 'text-accent/80 hover:text-accent hover:bg-accent/8 border border-accent/20'
                  : 'text-text-muted hover:text-text-main hover:bg-slate-100'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
          {(['en', 'ko', 'zh'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => onLanguageChange(lang)}
              className={cn(
                'px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all',
                language === lang ? 'bg-white shadow-sm text-accent' : 'text-text-muted hover:text-text-main'
              )}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
        <AuthButton systemLanguage={language} />
      </div>
    </header>
  );
}
