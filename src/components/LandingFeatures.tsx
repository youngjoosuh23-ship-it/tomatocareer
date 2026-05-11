import React from 'react';
import { cn } from '../lib/utils';
import { translations } from '../lib/translations';

interface Props {
  language: 'en' | 'ko' | 'zh';
}

interface FeatureItem {
  icon: string;
  name: string;
  desc: string;
  unique?: boolean;
  comingSoon?: boolean;
}

const featureData: Record<'en' | 'ko' | 'zh', FeatureItem[]> = {
  en: [
    {
      icon: '🎯',
      name: 'Hiring Probability Score',
      desc: 'Real match between your background and the JD — 0 to 100%.',
      unique: true,
    },
    {
      icon: '🏢',
      name: 'Corporate Deep Analysis',
      desc: 'Financials, competitors, growth direction — context other tools miss.',
      unique: true,
    },
    {
      icon: '🔗',
      name: 'JD URL Auto-Parse',
      desc: 'Paste any job posting URL and we extract the full JD automatically.',
      unique: true,
    },
    {
      icon: '📝',
      name: 'ATS-Optimized Resume',
      desc: 'JD keywords woven in, machine-readable structure, 6-second scan layout.',
    },
    {
      icon: '🎤',
      name: 'Interview Question Generator',
      desc: 'AI-predicted interview questions + answer angle for this specific role.',
      unique: true,
    },
    {
      icon: '📊',
      name: 'Multi-Job Comparison',
      desc: 'Analyze up to 5 postings side-by-side and get a ranked recommendation.',
    },
  ],
  ko: [
    {
      icon: '🎯',
      name: '합격 확률 예측',
      desc: '내 배경과 JD의 실질 매칭을 0-100% 수치로 제공. 단순 키워드 매칭이 아님.',
      unique: true,
    },
    {
      icon: '🏢',
      name: '기업 재무·경쟁사 분석',
      desc: '재무 지표, 경쟁사, 성장 방향까지 — 채용 공고엔 없는 맥락을 제공.',
      unique: true,
    },
    {
      icon: '🔗',
      name: '공고 URL 자동 분석',
      desc: 'URL만 붙여넣으면 JD 전체를 자동으로 파싱. 복붙 필요 없음.',
      unique: true,
    },
    {
      icon: '📝',
      name: 'ATS 최적화 이력서 재구성',
      desc: 'JD 키워드 자동 반영, 기계가 읽을 수 있는 구조, 6초 스캔 레이아웃.',
    },
    {
      icon: '🎤',
      name: '면접 예상 질문 생성',
      desc: '면접관 시각에서 예측한 질문 + 이 직무에 맞는 답변 전략 제공.',
      unique: true,
    },
    {
      icon: '📊',
      name: '복수 공고 동시 비교',
      desc: '최대 5개 공고를 나란히 분석하고 AI 추천 순위로 최적 선택.',
    },
  ],
  zh: [
    {
      icon: '🎯',
      name: '錄用概率預測',
      desc: '精確計算您的背景與職位描述的真實匹配度（0-100%）。',
      unique: true,
    },
    {
      icon: '🏢',
      name: '企業財務·競爭者分析',
      desc: '財務指標、競爭對手、成長方向 — 提供招聘公告沒有的背景資訊。',
      unique: true,
    },
    {
      icon: '🔗',
      name: '職位 URL 自動解析',
      desc: '只需貼上招聘連結，系統自動提取完整職位描述。',
      unique: true,
    },
    {
      icon: '📝',
      name: 'ATS 最佳化簡歷重構',
      desc: '自動嵌入關鍵詞，機器可讀結構，6 秒掃描佈局。',
    },
    {
      icon: '🎤',
      name: '面試問題生成',
      desc: 'AI 預測面試官視角的問題，附帶針對該職位的答題策略。',
      unique: true,
    },
    {
      icon: '📊',
      name: '多職位同步比較',
      desc: '最多 5 個職位並排分析，AI 排名推薦最佳選擇。',
    },
  ],
};

const competitorRows: Record<'en' | 'ko' | 'zh', { label: string; note: string }[]> = {
  en: [
    { label: 'Resume design tools', note: 'Template & ATS only. No strategy.' },
    { label: 'Korean cover letter tools', note: 'Cover letter only. No fit score.' },
    { label: 'CareerCopilot', note: 'Full pipeline: analysis → strategy → resume → interview.' },
  ],
  ko: [
    { label: 'Enhancv 등 해외 툴', note: '이력서 디자인 + ATS만. 전략 없음.' },
    { label: '합격닷컴 등 자소서 툴', note: '자소서 첨삭만. 합격 확률 없음.' },
    { label: '커리어코파일럿', note: '분석 → 전략 → 이력서 → 면접 — 풀 파이프라인.' },
  ],
  zh: [
    { label: 'Enhancv 等海外工具', note: '僅簡歷設計 + ATS。無策略。' },
    { label: '韓國自傳工具', note: '僅自傳修改。無錄用率預測。' },
    { label: '職場副駕駛', note: '分析 → 策略 → 簡歷 → 面試 — 完整流程。' },
  ],
};

export function LandingFeatures({ language }: Props) {
  const t = translations[language];
  const features = featureData[language];
  const rows = competitorRows[language];

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6">
      {/* Section title */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border-theme" />
        <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">
          {t.featureGridTitle}
        </p>
        <div className="h-px flex-1 bg-border-theme" />
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {features.map((f, i) => (
          <div
            key={i}
            className={cn(
              'bg-white rounded-2xl border p-4 space-y-2 transition-shadow hover:shadow-md',
              f.unique ? 'border-accent/30 bg-gradient-to-br from-white to-accent/[0.03]' : 'border-border-theme'
            )}
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-xl leading-none">{f.icon}</span>
              {f.unique && (
                <span className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                  {t.uniqueFeature}
                </span>
              )}
              {f.comingSoon && (
                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                  {t.comingSoon}
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-text-main leading-snug">{f.name}</p>
            <p className="text-[11px] text-text-muted leading-snug">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Competitor comparison strip */}
      <div className="bg-white rounded-2xl border border-border-theme overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-4 px-5 py-3 text-sm',
              i !== rows.length - 1 && 'border-b border-border-theme',
              i === rows.length - 1 && 'bg-accent/[0.03]'
            )}
          >
            <span className={cn(
              'shrink-0 w-1.5 h-1.5 rounded-full',
              i === rows.length - 1 ? 'bg-accent' : 'bg-slate-300'
            )} />
            <span className={cn(
              'font-semibold w-44 shrink-0 text-xs',
              i === rows.length - 1 ? 'text-accent' : 'text-text-muted'
            )}>
              {row.label}
            </span>
            <span className={cn(
              'text-xs',
              i === rows.length - 1 ? 'text-text-main font-medium' : 'text-text-muted'
            )}>
              {row.note}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
