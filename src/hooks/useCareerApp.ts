import React from 'react';
import { UserBackground, CompanyInfo, AnalysisResponse, ComparisonResult } from '../types';
import { analyzeJobOpportunity, compareJobOpportunities, rebuildResume } from '../services/gemini';
import { saveToHistory } from '../services/careerHistoryService';
import { submitBenchmarkData } from '../services/supabaseService';
import { translations } from '../lib/translations';

type View = 'form' | 'result' | 'rebuild' | 'history' | 'tracker';

export function useCareerApp(language: 'en' | 'ko' | 'zh') {
  const t = translations[language];

  const [analyses, setAnalyses] = React.useState<AnalysisResponse[]>([]);
  const [comparison, setComparison] = React.useState<ComparisonResult | undefined>(undefined);
  const [rebuiltResume, setRebuiltResume] = React.useState<string | null>(null);
  const [activeAnalysisForRebuild, setActiveAnalysisForRebuild] = React.useState<AnalysisResponse | null>(null);
  const [userBackground, setUserBackground] = React.useState<UserBackground | null>(null);
  const [view, setView] = React.useState<View>('form');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = React.useState(t.analyzing);

  React.useEffect(() => {
    if (userBackground) {
      setUserBackground(prev => prev ? { ...prev, content_language: language } : null);
    }
  }, [language]);

  const handleAnalyze = async (background: UserBackground, companies: CompanyInfo[], isLanguageSwitch = false) => {
    setIsLoading(true);
    setError(null);

    const updatedBackground = { ...background, content_language: language };
    setUserBackground(updatedBackground);

    try {
      const resultsData: AnalysisResponse[] = [];
      for (const company of companies) {
        const result = await analyzeJobOpportunity(updatedBackground, company);
        resultsData.push(result);
        if (companies.length > 1) await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setAnalyses(resultsData);

      let compResult: ComparisonResult | undefined;
      if (resultsData.length > 1) {
        compResult = await compareJobOpportunities(updatedBackground, resultsData);
        setComparison(compResult);
      } else {
        setComparison(undefined);
      }

      saveToHistory(resultsData, compResult, updatedBackground);

      resultsData.forEach(r => {
        submitBenchmarkData({
          company: r.company,
          role: r.role,
          fit_score: r.fit_score,
          hiring_probability: r.hiring_probability,
          decision: r.decision,
          background_summary: `${updatedBackground.major} / ${updatedBackground.target_roles}`,
        }).catch(() => {});
      });

      if (view === 'rebuild' && activeAnalysisForRebuild) {
        const newActive = resultsData.find(r =>
          r.company === activeAnalysisForRebuild.company && r.role === activeAnalysisForRebuild.role
        ) || resultsData[0];
        handleRebuildResume(newActive, updatedBackground);
      } else {
        setView('result');
        if (!isLanguageSwitch) window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error(err);
      const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('Quota exceeded');
      setError(isRateLimit ? t.rateLimitFinalError : t.analysisError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRebuildResume = async (analysis: AnalysisResponse, backgroundOverride?: UserBackground) => {
    const background = backgroundOverride || userBackground;
    if (!background) {
      setError(language === 'ko' ? '이력서 재구성을 위해 먼저 분석을 실행해주세요.' : 'Please run an analysis first to rebuild your resume.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage(t.rebuildingResume);
    try {
      const result = await rebuildResume(background, analysis);
      setRebuiltResume(result.rebuilt_resume);
      setActiveAnalysisForRebuild(analysis);
      setView('rebuild');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('Quota exceeded');
      setError(isRateLimit ? t.rateLimitFinalError : t.rebuildError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalyses([]);
    setComparison(undefined);
    setRebuiltResume(null);
    setActiveAnalysisForRebuild(null);
    setView('form');
    setError(null);
  };

  const handleBackToAnalysis = () => {
    setView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRestore = (
    restoredAnalyses: AnalysisResponse[],
    restoredComparison?: ComparisonResult,
    restoredBackground?: UserBackground
  ) => {
    setAnalyses(restoredAnalyses);
    setComparison(restoredComparison);
    if (restoredBackground) setUserBackground(restoredBackground);
    setView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
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
    setLoadingMessage,
    handleAnalyze,
    handleRebuildResume,
    handleReset,
    handleBackToAnalysis,
    handleRestore,
  };
}
