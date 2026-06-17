import { createAI, getClientIp, withRetry, checkRateLimit } from "./_shared";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rl = checkRateLimit(getClientIp(req), 10);
  if (rl === 'minute') return res.status(429).json({ error: '잠깐! 1분에 5회까지만 사용할 수 있어요. 잠시 후 다시 시도해 주세요.' });
  if (rl === 'daily') return res.status(429).json({ error: '일일 무료 사용 횟수(10회)를 초과했습니다. 내일 다시 시도해주세요.' });

  const { report, targetLang } = req.body;

  try {
    const ai = createAI();
    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Translate the following Corporate Analysis Report data into ${targetLang === 'ko' ? 'Korean' : 'English'}.

    Current Data (JSON):
    ${JSON.stringify(report)}

    CRITICAL INSTRUCTIONS:
    1. Maintain the exact same JSON structure.
    2. Only translate the string values (descriptions, names, details).
    3. Keep technical terms or specific proper nouns if they are commonly used in the target language (e.g., DART, KOSPI).
    4. Ensure natural and professional business terminology in the target language.
    5. Financial figures and years should NOT be changed, but 'notes' should be translated.
    6. Return ONLY the translated JSON object, no markdown wrapping.`,
        config: {
          temperature: 0,
          responseMimeType: "application/json"
        }
      });

      if (!response.text) throw new Error("Translation failed");
      return JSON.parse(response.text);
    });

    return res.json(result);
  } catch (err: any) {
    const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
    return res.status(isRateLimit ? 429 : 500).json({ error: err.message || 'Translation failed' });
  }
}
