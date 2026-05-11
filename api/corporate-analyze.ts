import { createAI, getClientIp, withRetry, checkRateLimit } from "./_shared";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rl = checkRateLimit(getClientIp(req), 10);
  if (rl === 'minute') return res.status(429).json({ error: '잠깐! 1분에 5회까지만 사용할 수 있어요. 잠시 후 다시 시도해 주세요.' });
  if (rl === 'daily') return res.status(429).json({ error: '일일 무료 사용 횟수(10회)를 초과했습니다. 내일 다시 시도해주세요.' });

  const { companyName, language = 'ko' } = req.body;
  const langLabel = language === 'ko' ? 'Korean' : language === 'zh' ? 'Traditional Chinese' : 'English';

  try {
    const ai = createAI();
    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze the company "${companyName}" with a focus on data accuracy and recent updates.

    CRITICAL INSTRUCTIONS:
    1. Use Google Search to find information from official and highly reliable sources:
       - DART (전자공시시스템) for Korean companies' financial statements and business reports.
       - Official Corporate Websites (IR sections) for future strategies and investor relations.
       - Reputable financial news outlets for recent events.
    2. Cross-reference data from multiple sources to ensure accuracy.
    3. Provide the exact source URLs or references for key financial figures in the "dataVerification.sources" array.
    4. Market cap should be updated as of the latest trading day.
    5. IMPORTANT: ALL text values (descriptions, summaries, notes, labels) MUST be written in ${langLabel}.

    Return ONLY a JSON object with this EXACT structure (no markdown, no code blocks, just raw JSON):
    {
      "overview": {
        "companyName": "string",
        "industry": "string",
        "businessDetails": "string (detailed description of main business activities)",
        "isListed": "string (e.g. KOSPI, NASDAQ, Unlisted)",
        "marketCap": "string (e.g. 300조원, $500B)"
      },
      "product": {
        "products": "string (physical products)",
        "goods": "string (goods/merchandise)",
        "services": "string (services offered)",
        "keyProducts": "string (flagship / best-selling products)",
        "strengths": "string (competitive advantages)",
        "weaknesses": "string (known weaknesses or challenges)"
      },
      "customer": {
        "characteristics": "string (target customer profile and characteristics)"
      },
      "financials": [
        { "year": "2024", "revenue": "string", "operatingProfit": "string", "netIncome": "string", "notes": "string" },
        { "year": "2023", "revenue": "string", "operatingProfit": "string", "netIncome": "string", "notes": "string" },
        { "year": "2022", "revenue": "string", "operatingProfit": "string", "netIncome": "string", "notes": "string" }
      ],
      "competitors": [
        { "name": "string", "description": "string" },
        { "name": "string", "description": "string" }
      ],
      "future": {
        "strategicDirection": "string (2-3 sentence executive summary of where this company is strategically headed — synthesize their growth vision, key bets, and long-term ambition in plain language)",
        "growthEngines": "string (future growth drivers and strategies)",
        "newMarketStrategy": "string (new market entry plans)"
      },
      "dataVerification": {
        "sources": ["string (URL or source name)", "..."],
        "accuracyNotes": "string (notes on data reliability and any caveats)",
        "lastUpdated": "${new Date().toLocaleDateString()}"
      }
    }`,
        config: {
          temperature: 0,
          tools: [{ googleSearch: {} }],
        }
      });

      if (!response.text) throw new Error("No response from AI");
      const raw = response.text.trim();
      const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
      if (!jsonMatch) throw new Error("Could not parse JSON from response");
      return JSON.parse(jsonMatch[1]);
    });

    return res.json(result);
  } catch (err: any) {
    const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
    return res.status(isRateLimit ? 429 : 500).json({ error: err.message || 'Analysis failed' });
  }
}
