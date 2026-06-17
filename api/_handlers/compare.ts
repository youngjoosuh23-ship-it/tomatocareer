import { Type } from "@google/genai";
import { createAI, getClientIp, withRetry, checkRateLimit } from "./_shared";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rl = checkRateLimit(getClientIp(req), 10);
  if (rl === 'minute') return res.status(429).json({ error: '잠깐! 1분에 5회까지만 사용할 수 있어요. 잠시 후 다시 시도해 주세요.' });
  if (rl === 'daily') return res.status(429).json({ error: '일일 무료 사용 횟수(10회)를 초과했습니다. 내일 다시 시도해주세요.' });

  const { background, results } = req.body;

  // Input size validation
  if (!Array.isArray(results) || results.length > 5)
    return res.status(400).json({ error: 'Too many results to compare (max 5)' });

  const languageName = background.content_language === 'ko' ? 'Korean' : background.content_language === 'zh' ? 'Chinese' : 'English';

  const prompt = `
[User Background]
- Major: ${background.major}
- Experience: ${background.experience}
- Skills: ${background.skills}

[Analysis Results to Compare]
${results.map((r: any, i: number) => `
Job ${i + 1}: ${r.company} - ${r.role}
- Fit Score: ${r.fit_score}
- Hiring Probability: ${r.hiring_probability}%
- Decision: ${r.decision}
- Key Reasons: ${r.key_reasons.join(', ')}
`).join('\n')}

Based on the above analysis results, provide a side-by-side comparison and a final recommendation on which job the user should prioritize.

IMPORTANT: You MUST return all text fields in ${languageName}.
`;

  try {
    const ai = createAI();
    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `You are an AI career strategist. Your role is to compare multiple job opportunities for a candidate and provide a clear recommendation on prioritization. You MUST return your response in valid JSON format only.

          STRICT LANGUAGE RULE:
          - Regardless of the input language, the output comparison MUST be entirely in ${languageName}.
          - If the requested language is Korean, ALL descriptive text and comparison MUST be in Korean.
          - If the requested language is English, ALL descriptive text and comparison MUST be in English.
          - If the requested language is Chinese, ALL descriptive text and comparison MUST be in Chinese (Traditional).`,
          temperature: 0,
          responseMimeType: "application/json",
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
                  required: ["company_name", "rank", "reason"]
                }
              },
              comparison_summary: { type: Type.STRING },
            },
            required: ["recommendation", "rankings", "comparison_summary"]
          }
        }
      });
      if (!response.text) throw new Error("No response from AI");
      return JSON.parse(response.text);
    });

    return res.json(result);
  } catch (err: any) {
    const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
    return res.status(isRateLimit ? 429 : 500).json({ error: err.message || 'Comparison failed' });
  }
}
