import React from 'react';

const MESSAGES: Record<'en' | 'ko' | 'zh', string[]> = {
  en: [
    'Analyzing your background...',
    'Parsing job descriptions...',
    'Identifying hidden expectations...',
    'Calculating fit scores...',
    'Generating application strategies...',
    'Optimizing resume bullets...',
    'Comparing opportunities...',
    'Rebuilding your resume...',
    'Finalizing decision...',
  ],
  ko: [
    '배경 분석 중...',
    '직무 기술서 파싱 중...',
    '숨겨진 기대치 식별 중...',
    '적합도 점수 계산 중...',
    '지원 전략 생성 중...',
    '이력서 항목 최적화 중...',
    '기회 비교 중...',
    '이력서 재구성 중...',
    '최종 결정 중...',
  ],
  zh: [
    '正在分析背景...',
    '正在解析職位描述...',
    '正在識別隱藏需求...',
    '正在計算匹配分數...',
    '正在生成求職策略...',
    '正在優化簡歷要點...',
    '正在比較職位機會...',
    '正在重構您的簡歷...',
    '正在完成決冊...',
  ],
};

export function useLoadingMessages(isLoading: boolean, language: 'en' | 'ko' | 'zh', initialMessage: string) {
  const [message, setMessage] = React.useState(initialMessage);

  React.useEffect(() => {
    if (!isLoading) return;
    const messages = MESSAGES[language];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setMessage(messages[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading, language]);

  return message;
}
