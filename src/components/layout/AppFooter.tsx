import React from 'react';
import { translations } from '../../lib/translations';

interface AppFooterProps {
  language: 'en' | 'ko' | 'zh';
}

const TomatoLogoSmall = () => (
  <svg viewBox="0 0 100 100" fill="none" width="18" height="18">
    <circle cx="50" cy="55" r="33" fill="#FF6B6B"/>
    <path d="M50 22 C36 7 14 15 21 27 C28 19 40 19 50 22Z" fill="#6ab870"/>
    <path d="M50 22 C64 7 86 15 79 27 C72 19 60 19 50 22Z" fill="#6ab870"/>
    <ellipse cx="50" cy="23" rx="9" ry="4" fill="#5aaa5e"/>
    <rect x="47" y="3" width="6" height="17" rx="3" fill="#4a8c4e"/>
    <circle cx="39" cy="57" r="4.5" fill="#9b2020"/>
    <circle cx="61" cy="57" r="4.5" fill="#9b2020"/>
    <circle cx="40.5" cy="55.5" r="1.8" fill="white"/>
    <circle cx="62.5" cy="55.5" r="1.8" fill="white"/>
    <path d="M36 70 Q50 84 64 70" fill="none" stroke="#9b2020" strokeWidth="3.5" strokeLinecap="round"/>
  </svg>
);

export function AppFooter({ language }: AppFooterProps) {
  const t = translations[language];

  return (
    <footer className="border-t border-border-theme bg-white py-8 mt-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-text-muted">
          <TomatoLogoSmall />
          <span className="text-xs font-semibold text-text-muted tracking-wide">{t.title}</span>
        </div>
        <p className="text-xs text-text-muted/60">
          {language === 'en'
            ? 'Powered by Gemini 2.0 Flash & 2.5 Pro'
            : language === 'ko'
              ? 'Gemini 2.0 Flash & 2.5 Pro 기반'
              : '基於 Gemini 2.0 Flash & 2.5 Pro'}
        </p>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-4 pt-4 border-t border-border-theme/50">
        <p className="text-[11px] text-text-muted/50 leading-relaxed text-center">
          {language === 'ko'
            ? '입력하신 이력서 및 직무 정보는 AI 분석 목적으로만 사용되며 서버에 저장되지 않습니다. 분석 결과는 Google Gemini API를 통해 생성되며, 개인정보는 수집·보관되지 않습니다.'
            : language === 'zh'
              ? '您輸入的履歷與職位資料僅用於 AI 分析，不會儲存於伺服器。分析結果透過 Google Gemini API 生成，我們不收集或保留任何個人資料。'
              : 'Your resume and job information is used solely for AI analysis and is not stored on our servers. Results are generated via the Google Gemini API. No personal data is collected or retained.'}
        </p>
      </div>
    </footer>
  );
}
