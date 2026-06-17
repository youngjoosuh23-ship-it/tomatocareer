import { Type } from "@google/genai";
import { createAI, withRetry, getClientIp, checkRateLimit } from "./_shared";

function pickTextFields(analysis: any) {
  return {
    rejection_reasons: analysis.rejection_reasons,
    improvement_actions: analysis.improvement_actions,
    ideal_candidate_profile: analysis.ideal_candidate_profile,
    hidden_expectations: analysis.hidden_expectations,
    key_reasons: analysis.key_reasons,
    strengths: analysis.strengths,
    gaps: analysis.gaps,
    risks: analysis.risks,
    strategy: analysis.strategy,
    resume_bullets: analysis.resume_bullets,
    next_action: analysis.next_action,
    resume_gap_analysis: analysis.resume_gap_analysis,
    resume_improvements: analysis.resume_improvements,
    role_insights: analysis.role_insights,
    actionable_next_steps: analysis.actionable_next_steps,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rl = checkRateLimit(getClientIp(req), 10);
  if (rl === 'minute') return res.status(429).json({ error: '잠깐! 1분에 5회까지만 사용할 수 있어요. 잠시 후 다시 시도해 주세요.' });
  if (rl === 'daily') return res.status(429).json({ error: '일일 무료 사용 횟수(10회)를 초과했습니다. 내일 다시 시도해주세요.' });

  const { analyses, comparison, targetLanguage } = req.body;
  if (!analyses || !targetLanguage) return res.status(400).json({ error: 'Missing required fields' });

  if (!Array.isArray(analyses) || analyses.length > 5)
    return res.status(400).json({ error: 'Too many analyses to translate (max 5)' });

  const langLabel = targetLanguage === 'ko' ? 'Korean' : targetLanguage === 'zh' ? 'Traditional Chinese' : 'English';

  try {
    const ai = createAI();

    // Only send text fields — strips numbers/enums to keep payload small
    const textOnlyAnalyses = analyses.map(pickTextFields);

    const translatedTextOnly: any[] = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Translate the following job analysis text fields to ${langLabel}.

RULES:
- Translate ALL string values faithfully.
- Preserve array lengths exactly — do NOT add or remove items.
- Return valid JSON only, wrapped as { "analyses": [...] }.

Input:
${JSON.stringify({ analyses: textOnlyAnalyses })}`,
        config: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analyses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    rejection_reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
                    improvement_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    ideal_candidate_profile: { type: Type.STRING },
                    hidden_expectations: { type: Type.ARRAY, items: { type: Type.STRING } },
                    key_reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
                    risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                    strategy: { type: Type.STRING },
                    resume_bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                    next_action: { type: Type.STRING },
                    resume_gap_analysis: { type: Type.ARRAY, items: { type: Type.STRING } },
                    resume_improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
                    role_insights: { type: Type.ARRAY, items: { type: Type.STRING } },
                    actionable_next_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                },
              },
            },
          },
        },
      });
      if (!response.text) throw new Error('No response from AI');
      const parsed = JSON.parse(response.text);
      if (!Array.isArray(parsed.analyses)) throw new Error('Invalid translation response structure');
      return parsed.analyses;
    });

    // Merge translated text back with original non-translatable fields (numbers, enums, names)
    const mergedAnalyses = translatedTextOnly.map((translated: any, i: number) => ({
      ...analyses[i],
      ...translated,
    }));

    let translatedComparison = comparison;
    if (comparison) {
      translatedComparison = await withRetry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Translate the following comparison result to ${langLabel}. Translate only "recommendation", "comparison_summary", and each ranking's "reason". Keep "company_name" and "rank" unchanged. Return valid JSON only.\n\n${JSON.stringify(comparison)}`,
          config: {
            temperature: 0,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                recommendation: { type: Type.STRING },
                rankings: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      company_name: { type: Type.STRING },
                      rank: { type: Type.NUMBER },
                      reason: { type: Type.STRING },
                    },
                  },
                },
                comparison_summary: { type: Type.STRING },
              },
            },
          },
        });
        if (!response.text) throw new Error('No response from AI');
        return JSON.parse(response.text);
      });
    }

    return res.json({ analyses: mergedAnalyses, comparison: translatedComparison });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Translation failed' });
  }
}
