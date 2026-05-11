import React from 'react';

const TOMATO_SVG = (width: number, height: number) => (
  <svg viewBox="0 0 100 100" fill="none" width={width} height={height}>
    <rect x="47" y="3" width="6" height="14" rx="3" fill="#5a9e5e"/>
    <path d="M50 15 C37 4 18 12 25 24 C31 17 41 15 50 15Z" fill="#7bc99a"/>
    <path d="M50 15 C63 4 82 12 75 24 C69 17 59 15 50 15Z" fill="#7bc99a"/>
    <circle cx="50" cy="62" r="33" fill="#FF7C7C"/>
    <ellipse cx="35" cy="47" rx="9" ry="6" fill="rgba(255,255,255,0.35)" transform="rotate(-20,35,47)"/>
    <circle cx="40" cy="61" r="3" fill="#7a2020"/>
    <circle cx="60" cy="61" r="3" fill="#7a2020"/>
    <path d="M38 72 Q50 82 62 72" fill="none" stroke="#7a2020" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export function TomatoParticles() {
  return (
    <>
      <div className="absolute pointer-events-none shape-bob" style={{ zIndex: 1, top: 110, left: '2%', width: 80, height: 80, '--rot': '-8deg', animationDelay: '0s' } as React.CSSProperties}>
        {TOMATO_SVG(80, 80)}
      </div>
      <div className="absolute pointer-events-none shape-bob" style={{ zIndex: 1, top: 300, right: '3%', width: 100, height: 100, '--rot': '10deg', animationDelay: '-2s' } as React.CSSProperties}>
        {TOMATO_SVG(100, 100)}
      </div>
      <div className="absolute pointer-events-none shape-bob" style={{ zIndex: 1, top: 600, left: '4%', width: 88, height: 88, '--rot': '6deg', animationDelay: '-4s' } as React.CSSProperties}>
        {TOMATO_SVG(88, 88)}
      </div>
    </>
  );
}
