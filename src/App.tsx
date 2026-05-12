import React from 'react';
import { AnalysisForm } from './components/AnalysisForm';
import { AnalysisResult } from './components/AnalysisResult';
import { ResumeRebuilder } from './components/ResumeRebuilder';
import { CorporateDashboard } from './components/CorporateDashboard';
import { CareerHistoryView } from './components/CareerViews/CareerHistoryView';
import { TrackerView } from './components/CareerViews/TrackerView';
import { AgentView } from './components/AgentView';
import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { JobFinderView } from './components/JobFinderView';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from './lib/translations';
import { AppHeader } from './components/layout/AppHeader';
import { AppFooter } from './components/layout/AppFooter';
import { FeedbackButton } from './components/FeedbackButton';
import { TomatoParticles } from './components/TomatoParticles';
import { LoadingOverlay, LoadingSpinner } from './components/LoadingOverlay';
import { useCareerApp } from './hooks/useCareerApp';
import { useLoadingMessages } from './hooks/useLoadingMessages';

export default function App() {
  const formRef = React.useRef<HTMLDivElement>(null);
  const [appMode, setAppMode] = React.useState<'career' | 'corporate' | 'jobs' | 'agent'>('career');
  const [language, setLanguage] = React.useState<'en' | 'ko' | 'zh'>('en');
  const [prefillJob, setPrefillJob] = React.useState<{ companyName: string; role: string; jdText: string } | null>(null);

  const t = translations[language];

  const {
    analyses,
    comparison,
    rebuiltResume,
    activeAnalysisForRebuild,
    userBackground,
    view,
    setView,
    isLoading,
    error,
    setError,
    loadingMessage,
    handleAnalyze,
    handleRebuildResume,
    handleReset,
    handleBackToAnalysis,
    handleRestore,
  } = useCareerApp(language);

  const currentLoadingMessage = useLoadingMessages(isLoading, language, loadingMessage);

  React.useEffect(() => {
    if (appMode === 'corporate' || appMode === 'agent' || (view === 'form' && appMode === 'career')) {
      document.body.classList.add('form-view');
    } else {
      document.body.classList.remove('form-view');
    }
    return () => document.body.classList.remove('form-view');
  }, [view, appMode]);

  return (
    <div className="min-h-screen bg-bg font-sans text-text-main">
      <AppHeader
        language={language}
        onLanguageChange={setLanguage}
        appMode={appMode}
        view={view}
        onLogoClick={() => { setAppMode('career'); setView('form'); }}
        onNavCareer={() => { setAppMode('career'); setView('form'); }}
        onNavCorporate={() => setAppMode('corporate')}
        onNavJobs={() => setAppMode('jobs')}
        onNavHistory={() => { setAppMode('career'); setView('history'); }}
        onNavTracker={() => { setAppMode('career'); setView('tracker'); }}
        onNavAgent={() => setAppMode('agent')}
      />

      {appMode === 'agent' ? (
        <AgentView
          systemLanguage={language}
          onDone={(analyses, comparison, background) => {
            handleRestore(analyses, comparison, background);
            setAppMode('career');
          }}
        />
      ) : appMode === 'jobs' ? (
        <JobFinderView systemLanguage={language} />
      ) : appMode === 'career' ? (
        <main style={{ position: 'relative' }}>
          {view === 'form' && <TomatoParticles />}

          <AnimatePresence mode="wait">
            {view === 'tracker' ? (
              <motion.div key="tracker" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}>
                <TrackerView systemLanguage={language} />
              </motion.div>
            ) : view === 'history' ? (
              <motion.div key="history" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}>
                <CareerHistoryView
                  systemLanguage={language}
                  onRestore={handleRestore}
                />
              </motion.div>
            ) : view === 'form' ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <HeroSection
                  language={language}
                  onStartClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                />
                <ServicesSection language={language} />
                <div ref={formRef} className="py-12 space-y-8">
                  {error && (
                    <div className="max-w-4xl mx-auto px-6">
                      <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                        {error}
                      </div>
                    </div>
                  )}
                  <AnalysisForm
                    onAnalyze={handleAnalyze}
                    isLoading={isLoading}
                    systemLanguage={language}
                    contentLanguage={language}
                    prefillJob={prefillJob ?? undefined}
                    onPrefillConsumed={() => setPrefillJob(null)}
                  />
                  {isLoading && <LoadingSpinner message={currentLoadingMessage} />}
                </div>
              </motion.div>
            ) : view === 'result' ? (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {error && (
                  <div className="max-w-4xl mx-auto px-6 pt-4">
                    <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                        {error}
                      </div>
                      <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
                    </div>
                  </div>
                )}
                <AnalysisResult
                  results={analyses}
                  comparison={comparison}
                  onReset={handleReset}
                  onRebuild={handleRebuildResume}
                  systemLanguage={language}
                  contentLanguage={language}
                  userBackground={userBackground ?? undefined}
                />
                {isLoading && <LoadingOverlay message={currentLoadingMessage} />}
              </motion.div>
            ) : (
              <motion.div key="rebuild" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                {activeAnalysisForRebuild && rebuiltResume && userBackground && (
                  <ResumeRebuilder
                    analysis={activeAnalysisForRebuild}
                    background={userBackground}
                    rebuiltResume={rebuiltResume}
                    onBack={handleBackToAnalysis}
                    systemLanguage={language}
                    contentLanguage={language}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      ) : (
        <CorporateDashboard systemLanguage={language} />
      )}

      <FeedbackButton language={language} />
      <AppFooter language={language} />
    </div>
  );
}
