import React from 'react';
import { AnalysisResponse, UserBackground, InterviewQuestion } from '../../../types';
import { CopyButton } from '../../ui/CopyButton';
import { generateCareerInterviewQuestions } from '../../../services/gemini';

interface StrategyTabProps {
  data: AnalysisResponse;
  language: 'en' | 'ko' | 'zh';
  t: Record<string, string>;
  userBackground?: UserBackground;
}

export function StrategyTab({ data, language, t, userBackground }: StrategyTabProps) {
  const [questions, setQuestions] = React.useState<InterviewQuestion[]>([]);
  const [isLoadingQ, setIsLoadingQ] = React.useState(false);
  const [qError, setQError] = React.useState<string | null>(null);

  const handleGenerateQuestions = async () => {
    if (!userBackground) return;
    setIsLoadingQ(true);
    setQError(null);
    try {
      const res = await generateCareerInterviewQuestions(userBackground, data);
      setQuestions(res.questions);
    } catch {
      setQError(language === 'ko' ? '질문 생성에 실패했습니다.' : 'Failed to generate questions.');
    } finally {
      setIsLoadingQ(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t.positioning}</p>
          <CopyButton text={data.strategy} label={t.copy} copiedLabel={t.copied} />
        </div>
        <p className="text-sm text-text-main leading-relaxed p-4 bg-accent/5 border border-accent/10 rounded-xl">{data.strategy}</p>
      </section>

      <section className="space-y-2.5">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t.resumeImprovements}</p>
        {data.resume_improvements.map((imp, i) => (
          <div key={i} className="flex gap-3 text-sm text-text-main">
            <span className="text-xs font-bold text-text-muted w-5 shrink-0 mt-0.5">{i + 1}.</span>{imp}
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t.actionableNextSteps}</p>
        {data.actionable_next_steps.map((step, i) => (
          <div key={i} className="flex gap-3 items-start p-3.5 rounded-xl bg-slate-50 border border-border-theme text-sm text-text-main">
            <span className="w-5 h-5 rounded-lg bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
            {step}
          </div>
        ))}
      </section>

      {data.resume_bullets.length > 0 && (
        <section className="space-y-2">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t.resumeOptimization}</p>
          {data.resume_bullets.map((b, i) => (
            <div key={i} className="flex gap-2.5 items-start text-sm text-text-main">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />{b}
            </div>
          ))}
        </section>
      )}

      {userBackground && (
        <section className="space-y-3 pt-2 border-t border-border-theme">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t.interviewQuestions}</p>
            {questions.length === 0 && (
              <button onClick={handleGenerateQuestions} disabled={isLoadingQ}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-[#E55252] disabled:opacity-50 transition-all">
                {isLoadingQ
                  ? <><span className="w-3 h-3 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />{t.generatingQ}</>
                  : t.generateInterviewQ}
              </button>
            )}
          </div>
          {qError && <p className="text-xs text-red-500">{qError}</p>}
          {questions.map((q, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-border-theme space-y-2">
              <span className="inline-block text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">{q.category}</span>
              <p className="text-sm font-semibold text-text-main">{q.question}</p>
              <p className="text-xs text-text-muted"><span className="font-medium text-text-main/70">{t.rationale}:</span> {q.rationale}</p>
              <p className="text-xs text-text-muted"><span className="font-medium text-text-main/70">{t.angle}:</span> {q.answerAngle}</p>
              {q.followUpQuestions?.length > 0 && (
                <div className="pt-2 border-t border-border-theme space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    {language === 'ko' ? '예상 꼬리 질문' : language === 'zh' ? '可能的追問' : 'Likely Follow-ups'}
                  </p>
                  {q.followUpQuestions.map((fq, j) => (
                    <div key={j} className="flex gap-2 text-xs text-text-muted">
                      <span className="text-accent/60 shrink-0">↳</span>{fq}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
