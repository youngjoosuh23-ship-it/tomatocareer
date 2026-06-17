import { Type } from "@google/genai";
import { createAI, getClientIp, withRetry, checkRateLimit } from "./_shared";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rl = checkRateLimit(getClientIp(req), 10);
  if (rl === 'minute') return res.status(429).json({ error: '잠깐! 1분에 5회까지만 사용할 수 있어요. 잠시 후 다시 시도해 주세요.' });
  if (rl === 'daily') return res.status(429).json({ error: '일일 무료 사용 횟수(10회)를 초과했습니다. 내일 다시 시도해주세요.' });

  const { report, language } = req.body;

  try {
    const ai = createAI();
    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Based on the following Corporate Analysis Report for "${report.overview.companyName}", generate 6-9 insightful interview questions categorized by job field (e.g., General/Strategy, Engineering/IT, Marketing/Sales).

    Data:
    ${JSON.stringify(report)}

    Requirements:
    1. Focus on business strategy, competitive landscape, growth potential, and specific strengths/weaknesses mentioned in the report.
    2. Group questions by relevant job fields or categories.
    3. Provide a "Why this question?" rationale for each.
    4. Provide a "Recommended answer angle" for each.
    5. Respond in ${language === 'ko' ? 'Korean' : 'English'}.`,
        config: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    question: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                    answerAngle: { type: Type.STRING }
                  },
                  required: ["category", "question", "rationale", "answerAngle"]
                }
              }
            },
            required: ["questions"]
          }
        }
      });

      if (!response.text) throw new Error("Question generation failed");
      return JSON.parse(response.text);
    });

    return res.json(result);
  } catch (err: any) {
    const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
    return res.status(isRateLimit ? 429 : 500).json({ error: err.message || 'Question generation failed' });
  }
}
