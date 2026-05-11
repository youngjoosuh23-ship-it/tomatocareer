import React from 'react';

interface Props {
  language: 'en' | 'ko' | 'zh';
  onStartClick: () => void;
}

const copy: Record<'en' | 'ko' | 'zh', { h1: string; sub: string; cta: string }> = {
  en: {
    h1: 'One resume.\nLet\'s refine it together',
    sub: 'Polish your wording, restructure your story,\nand prep for interviews — all in one place.',
    cta: 'Get Started',
  },
  ko: {
    h1: '이력서 한 장,\n같이 다듬어볼까요',
    sub: '공고에 맞게 표현을 정리하고,\n면접 답변까지 한 번에 준비해 드려요.',
    cta: '시작하기',
  },
  zh: {
    h1: '一份履歷，\n一起來打磨',
    sub: '整理措辭、重構結構，\n面試答案一次準備到位。',
    cta: '開始',
  },
};

export function HeroSection({ language, onStartClick }: Props) {
  const c = copy[language];
  const lines = c.h1.split('\n');

  return (
    <section className="relative overflow-hidden">
      {/* max-width stage */}
      <div className="relative max-w-[1240px] mx-auto px-10 pt-16 pb-28 min-h-[720px] max-sm:min-h-[560px] max-sm:px-5 max-sm:pt-8 max-sm:pb-20">

        {/* ── Floating shapes ── */}

        {/* s1: green folded paper — top-left */}
        <div className="shape-bob absolute" style={{ top: 40, left: '4%', width: 90, height: 110, '--rot': '-8deg', animationDelay: '0s' } as React.CSSProperties}>
          <svg viewBox="0 0 90 110" className="w-full h-full">
            <path d="M8 6 H64 L82 24 V100 a4 4 0 0 1-4 4 H8 a4 4 0 0 1-4-4 V10 a4 4 0 0 1 4-4 z" fill="#7bc99a"/>
            <path d="M64 6 V20 a4 4 0 0 0 4 4 H82" fill="none" stroke="#1d1d1b" strokeWidth="1.5"/>
            <circle cx="34" cy="46" r="1.8" fill="#1d1d1b"/>
            <circle cx="50" cy="46" r="1.8" fill="#1d1d1b"/>
            <path d="M34 56 q8 6 16 0" fill="none" stroke="#1d1d1b" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>

        {/* s2: yellow circle — top, inner-left */}
        <div className="shape-bob absolute" style={{ top: 60, left: '22%', width: 46, height: 46, animationDelay: '-1s' } as React.CSSProperties}>
          <svg viewBox="0 0 46 46" className="w-full h-full">
            <circle cx="23" cy="23" r="22" fill="#f5d35b"/>
          </svg>
        </div>

        {/* s3: lilac star — top, inner-right */}
        <div className="shape-bob absolute" style={{ top: 50, right: '22%', width: 64, height: 64, '--rot': '10deg', animationDelay: '-2s' } as React.CSSProperties}>
          <svg viewBox="0 0 64 64" className="w-full h-full">
            <path d="M32 4 L37 26 L59 32 L37 38 L32 60 L27 38 L5 32 L27 26 Z" fill="#b9a8e0"/>
          </svg>
        </div>

        {/* s4: coral check badge — mid-left edge */}
        <div className="shape-bob absolute max-sm:hidden" style={{ top: 220, left: '2%', width: 78, height: 78, '--rot': '-12deg', animationDelay: '-3s' } as React.CSSProperties}>
          <svg viewBox="0 0 78 78" className="w-full h-full">
            <path d="M39 4 L48 12 L60 10 L62 22 L73 28 L66 38 L73 48 L62 54 L60 66 L48 64 L39 72 L30 64 L18 66 L16 54 L5 48 L12 38 L5 28 L16 22 L18 10 L30 12 Z" fill="#ec7a6a"/>
            <path d="M28 40 L36 47 L52 30" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* s5: blue smiley arc — mid-right edge (hidden mobile) */}
        <div className="shape-bob absolute max-sm:hidden" style={{ top: 200, right: '3%', width: 110, height: 70, animationDelay: '-1.5s' } as React.CSSProperties}>
          <svg viewBox="0 0 110 70" className="w-full h-full">
            <path d="M5 65 a50 50 0 0 1 100 0 z" fill="#8ec5e8"/>
            <circle cx="42" cy="48" r="2" fill="#1d1d1b"/>
            <circle cx="68" cy="48" r="2" fill="#1d1d1b"/>
            <path d="M46 56 q9 5 18 0" fill="none" stroke="#1d1d1b" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>

        {/* s6: cream cloud doc — bottom-left */}
        <div className="shape-bob absolute max-sm:hidden" style={{ top: 480, left: '4%', width: 130, height: 110, '--rot': '-6deg', animationDelay: '-2.5s' } as React.CSSProperties}>
          <svg viewBox="0 0 130 110" className="w-full h-full">
            <path d="M65 14 c-22 0 -38 14 -38 32 c-14 4 -22 14 -22 28 c0 18 16 30 36 30 h66 c20 0 30 -10 30 -26 c0 -16 -10 -26 -26 -28 c-2 -22 -22 -36 -46 -36 z" fill="#fbe9d4"/>
            <circle cx="55" cy="62" r="2.4" fill="#1d1d1b"/>
            <circle cx="80" cy="62" r="2.4" fill="#1d1d1b"/>
            <path d="M55 76 q12 8 25 0" fill="none" stroke="#1d1d1b" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* s7: coral pentagon — bottom inner-left (hidden mobile) */}
        <div className="shape-bob absolute max-sm:hidden" style={{ top: 560, left: '22%', width: 80, height: 86, '--rot': '6deg', animationDelay: '-1s' } as React.CSSProperties}>
          <svg viewBox="0 0 80 86" className="w-full h-full">
            <path d="M40 4 L74 30 L62 80 H18 L6 30 Z" fill="#ec7a6a"/>
            <circle cx="32" cy="44" r="2" fill="#1d1d1b"/>
            <circle cx="48" cy="44" r="2" fill="#1d1d1b"/>
            <path d="M32 54 q8 6 16 0" fill="none" stroke="#1d1d1b" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>

        {/* s8: yellow burst — bottom-right */}
        <div className="shape-bob absolute max-sm:hidden" style={{ top: 480, right: '4%', width: 110, height: 110, '--rot': '8deg', animationDelay: '-3.5s' } as React.CSSProperties}>
          <svg viewBox="0 0 110 110" className="w-full h-full">
            <path d="M55 4 L62 18 L78 12 L74 28 L90 30 L80 42 L94 52 L78 56 L82 72 L66 70 L62 86 L52 76 L40 88 L36 72 L20 76 L24 60 L8 56 L20 44 L8 32 L24 28 L20 12 L36 18 L42 4 L52 16 Z" fill="#f5d35b"/>
            <circle cx="46" cy="46" r="2" fill="#1d1d1b"/>
            <circle cx="62" cy="46" r="2" fill="#1d1d1b"/>
            <path d="M46 56 q8 6 16 0" fill="none" stroke="#1d1d1b" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>

        {/* s9: tiny scattered dots (hidden mobile) */}
        <div className="absolute max-sm:hidden" style={{ top: 620, right: '18%', width: 16, height: 16 }}>
          <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#7bc99a"/></svg>
        </div>
        <div className="absolute max-sm:hidden" style={{ top: 160, right: '8%', width: 10, height: 10 }}>
          <svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#ec7a6a"/></svg>
        </div>
        <div className="absolute max-sm:hidden" style={{ top: 380, left: '1%', width: 12, height: 12 }}>
          <svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" fill="#8ec5e8"/></svg>
        </div>

        {/* ── Headline block (z-index above shapes) ── */}
        <div
          className="relative text-center max-w-[720px] mx-auto"
          style={{ zIndex: 2, marginTop: 'clamp(40px, 8vw, 100px)' }}
        >
          <h1
            style={{
              fontFamily: "'Pretendard Variable', 'Pretendard', 'Inter', sans-serif",
              fontSize: 'clamp(36px, 5vw, 56px)',
              lineHeight: 1.25,
              letterSpacing: '-0.035em',
              fontWeight: 800,
              margin: '0 0 24px',
              color: '#1d1d1b',
            }}
          >
            {lines.map((line, i) => (
              <React.Fragment key={i}>
                {i < lines.length - 1
                  ? <>{line}<br /></>
                  : <>{line}<span style={{ color: '#ec7a6a' }}>.</span></>}
              </React.Fragment>
            ))}
          </h1>

          <p
            style={{
              fontFamily: "'Pretendard Variable', 'Pretendard', 'Inter', sans-serif",
              fontSize: 17,
              lineHeight: 1.7,
              color: '#6e6e6a',
              margin: '0 auto 40px',
              maxWidth: 480,
              letterSpacing: '-0.005em',
              whiteSpace: 'pre-line',
            }}
          >
            {c.sub}
          </p>

          <button
            className="cta-circle"
            onClick={onStartClick}
            style={{ fontFamily: "'Pretendard Variable', 'Pretendard', 'Inter', sans-serif" }}
          >
            {c.cta}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <polyline points="5 12 12 19 19 12"/>
            </svg>
          </button>
        </div>

      </div>
    </section>
  );
}
