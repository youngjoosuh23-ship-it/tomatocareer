import { Type } from "@google/genai";
import { createAI, getClientIp, withRetry, checkRateLimit } from "./_shared";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rl = checkRateLimit(getClientIp(req), 30);
  if (rl === 'minute') return res.status(429).json({ error: '잠깐! 1분에 5회까지만 사용할 수 있어요. 잠시 후 다시 시도해 주세요.' });
  if (rl === 'daily') return res.status(429).json({ error: '일일 무료 사용 횟수(30회)를 초과했습니다. 내일 다시 시도해주세요.' });

  const { companyName } = req.body;
  if (!companyName?.trim()) return res.status(400).json({ error: 'companyName is required' });

  const ai = createAI();

  try {
    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `What is the official careers/jobs page URL for the company "${companyName}"? Return only the URL, empty string if unknown.`,
        config: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: { careers_url: { type: Type.STRING } },
            required: ['careers_url'],
          },
        },
      });

      if (!response.text) throw new Error('No response from AI');
      return JSON.parse(response.text);
    });

    return res.json({ careers_url: result.careers_url ?? '' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to find careers page' });
  }
}
