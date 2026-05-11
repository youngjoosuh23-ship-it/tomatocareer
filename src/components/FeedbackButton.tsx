import React from 'react';

interface FeedbackButtonProps {
  language: 'en' | 'ko' | 'zh';
}

export function FeedbackButton({ language }: FeedbackButtonProps) {
  return (
    <a
      href="https://forms.gle/XTbJqva2n7Z757Vr7"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-xs font-bold rounded-full shadow-lg hover:bg-[#E55252] transition-all hover:scale-105 active:scale-95"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      {language === 'ko' ? '피드백 보내기' : language === 'zh' ? '發送意見' : 'Feedback'}
    </a>
  );
}
