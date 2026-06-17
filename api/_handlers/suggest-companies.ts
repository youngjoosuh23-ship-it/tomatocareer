import { Type } from "@google/genai";
import { createAI, getClientIp, withRetry, checkRateLimit } from "./_shared";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rl = checkRateLimit(getClientIp(req), 30);
  if (rl === 'minute') return res.status(429).json({ error: '잠깐! 1분에 5회까지만 사용할 수 있어요. 잠시 후 다시 시도해 주세요.' });
  if (rl === 'daily') return res.status(429).json({ error: '일일 무료 사용 횟수(30회)를 초과했습니다. 내일 다시 시도해주세요.' });

  const { industry, language = 'ko' } = req.body;
  if (!industry?.trim()) return res.status(400).json({ error: 'industry is required' });

  const langLabel = language === 'ko' ? 'Korean' : language === 'zh' ? 'Traditional Chinese' : 'English';

  try {
    const ai = createAI();
    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `List 8 to 10 well-known companies in the "${industry}" industry or field.
Include a mix of large established companies and notable startups/mid-size companies.
Include companies active globally and in Asia (especially Korea, Japan, Taiwan if relevant).
Respond entirely in ${langLabel}.`,
        config: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              companies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    size: { type: Type.STRING },
                    notable_for: { type: Type.STRING },
                  },
                  required: ['name', 'description', 'size', 'notable_for'],
                },
              },
            },
            required: ['companies'],
          },
        },
      });
      if (!response.text) throw new Error('No response from AI');
      return JSON.parse(response.text);
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to suggest companies' });
  }
}
