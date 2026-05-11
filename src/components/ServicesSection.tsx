import React from 'react';

interface Props {
  language: 'en' | 'ko' | 'zh';
}

const copy: Record<'en' | 'ko' | 'zh', {
  heading: string;
  lead: string;
  cols: { title: string; items: string[] }[];
}> = {
  en: {
    heading: 'Here\'s what we help with',
    lead: 'From job analysis to interview prep — pick only what you need.',
    cols: [
      { title: 'Analyze', items: ['Auto-parse job posting', 'Hiring probability score', 'Company culture summary', 'Missing keyword finder'] },
      { title: 'Resume', items: ['Rewrite & refine bullets', 'Restructure layout', 'ATS-friendly conversion', 'EN / KR version'] },
      { title: 'Interview', items: ['Predict likely questions', 'Answer angle coaching', 'Follow-up Q prep', 'Final review checklist'] },
    ],
  },
  ko: {
    heading: '이런 걸 도와드려요',
    lead: '공고 분석부터 면접까지, 필요한 단계만 골라 쓸 수 있어요.',
    cols: [
      { title: '분석', items: ['공고 자동 파싱', '합격 가능성 진단', '회사 분위기 요약', '부족한 키워드 찾기'] },
      { title: '이력서', items: ['표현 다듬기', '구조 재정리', 'ATS 친화 변환', '한·영 버전 정리'] },
      { title: '면접', items: ['예상 질문 뽑기', '답변 방향 코칭', '꼬리질문 대비', '최종 점검 체크리스트'] },
    ],
  },
  zh: {
    heading: '我們可以幫你做這些',
    lead: '從職位分析到面試準備，按需選用。',
    cols: [
      { title: '分析', items: ['自動解析職位', '錄用概率診斷', '公司氛圍摘要', '缺失關鍵詞定位'] },
      { title: '履歷', items: ['措辭精修', '結構重整', 'ATS 友好轉換', '中英雙版本'] },
      { title: '面試', items: ['預測面試題', '答題方向教練', '追問題備戰', '最終確認清單'] },
    ],
  },
};

/* Colored marker shapes — one per column, matching design */
const colMarkers = [
  // 분석 — blue circle
  <svg key="a" viewBox="0 0 14 14" width={14} height={14}><circle cx="7" cy="7" r="7" fill="#8ec5e8"/></svg>,
  // 이력서 — mint square
  <svg key="b" viewBox="0 0 14 14" width={14} height={14}><rect width="14" height="14" fill="#7bc99a"/></svg>,
  // 면접 — coral triangle
  <svg key="c" viewBox="0 0 14 14" width={14} height={14}><polygon points="7,0 14,14 0,14" fill="#ec7a6a"/></svg>,
];

/* Top icon characters per column */
const colIcons = [
  // 분석 — coral document character
  <svg key="a" viewBox="0 0 56 70" width={56} height={70}>
    <rect x="6" y="6" width="44" height="58" rx="3" fill="#ec7a6a"/>
    <circle cx="22" cy="30" r="1.8" fill="#1d1d1b"/>
    <circle cx="34" cy="30" r="1.8" fill="#1d1d1b"/>
    <path d="M22 40 q6 5 12 0" fill="none" stroke="#1d1d1b" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>,
  // 이력서 — mint pentagon character
  <svg key="b" viewBox="0 0 56 70" width={56} height={70}>
    <path d="M28 6 L52 30 L40 62 H16 L4 30 Z" fill="#7bc99a"/>
    <circle cx="22" cy="32" r="1.8" fill="#1d1d1b"/>
    <circle cx="34" cy="32" r="1.8" fill="#1d1d1b"/>
    <path d="M22 42 q6 5 12 0" fill="none" stroke="#1d1d1b" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>,
  // 면접 — yellow circle character
  <svg key="c" viewBox="0 0 56 70" width={56} height={70}>
    <circle cx="28" cy="35" r="26" fill="#f5d35b"/>
    <circle cx="22" cy="32" r="1.8" fill="#1d1d1b"/>
    <circle cx="34" cy="32" r="1.8" fill="#1d1d1b"/>
    <path d="M22 42 q6 5 12 0" fill="none" stroke="#1d1d1b" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>,
];

export function ServicesSection({ language }: Props) {
  const c = copy[language];

  return (
    <section
      style={{
        background: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.7)',
      }}
    >
      <div
        className="max-w-[1100px] mx-auto"
        style={{ padding: '80px 40px 100px' }}
      >
        <h2
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', 'Inter', sans-serif",
            textAlign: 'center',
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 14px',
            color: '#1d1d1b',
          }}
        >
          {c.heading}
        </h2>
        <p
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', 'Inter', sans-serif",
            textAlign: 'center',
            color: '#6e6e6a',
            margin: '0 auto 56px',
            maxWidth: 460,
            fontSize: 15.5,
            lineHeight: 1.65,
          }}
        >
          {c.lead}
        </p>

        {/* 3-column grid */}
        <div
          className="grid gap-14 max-sm:grid-cols-1 max-sm:gap-9"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
        >
          {c.cols.map((col, i) => (
            <div key={i}>
              {/* Top character icon */}
              <div style={{ marginBottom: 18 }}>{colIcons[i]}</div>

              {/* Column header with marker */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 14,
                  borderBottom: '1px solid #1d1d1b',
                  marginBottom: 18,
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Pretendard Variable', 'Pretendard', 'Inter', sans-serif",
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: '#1d1d1b',
                  }}
                >
                  {col.title}
                </h3>
                {colMarkers[i]}
              </div>

              {/* Item list */}
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  color: '#4a4a47',
                  fontSize: 14.5,
                  lineHeight: 2,
                  letterSpacing: '-0.005em',
                  fontFamily: "'Pretendard Variable', 'Pretendard', 'Inter', sans-serif",
                }}
              >
                {col.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
