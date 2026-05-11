import { Type } from "@google/genai";
import { createAI, getClientIp, withRetry, checkRateLimit } from "./_shared";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rl = checkRateLimit(getClientIp(req), 10);
  if (rl === 'minute') return res.status(429).json({ error: '잠깐! 1분에 5회까지만 사용할 수 있어요. 잠시 후 다시 시도해 주세요.' });
  if (rl === 'daily') return res.status(429).json({ error: '일일 무료 사용 횟수(10회)를 초과했습니다. 내일 다시 시도해주세요.' });

  const { fileContent, fileName, language = 'ko', isPdf = false } = req.body;

  if (isPdf && typeof fileContent === 'string' && fileContent.length > 20_000_000)
    return res.status(400).json({ error: 'PDF too large (max ~15MB)' });

  const instructions = `
    CRITICAL INSTRUCTIONS:
    1. Extract data for: company overview, product analysis, customer characteristics, financials (last 3-4 years if available), competitors, and future strategy.
    2. Respond ONLY in the specified JSON format.
    3. If a piece of data is missing, use an empty string or empty array.
    4. Ensure the output is written in ${language === 'ko' ? 'Korean' : 'English'}.
    5. Provide sources and accuracy notes based on the uploaded file in 'dataVerification'.`;

  try {
    const ai = createAI();
    const result = await withRetry(async () => {
      // PDF → send as Gemini inline data (native PDF reading, no text extraction needed)
      // Other formats → send raw text in the prompt
      const contents: any = isPdf
        ? [{ text: `You are a corporate analyst. Extract all relevant corporate information from the attached PDF file (${fileName}) and map it to the "CorporateAnalysisReport" JSON schema.${instructions}` },
           { inlineData: { mimeType: 'application/pdf', data: (fileContent as string).replace(/^data:application\/pdf;base64,/, '') } }]
        : `You are a corporate analyst. Extract all relevant corporate information from the following file content and map it to the "CorporateAnalysisReport" JSON schema.\n\n    File Name: ${fileName}\n    File Content:\n    ${(fileContent as string).substring(0, 20000)}${instructions}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overview: {
                type: Type.OBJECT,
                properties: {
                  companyName: { type: Type.STRING },
                  industry: { type: Type.STRING },
                  businessDetails: { type: Type.STRING },
                  isListed: { type: Type.STRING },
                  marketCap: { type: Type.STRING }
                },
                required: ["companyName", "industry", "businessDetails", "isListed", "marketCap"]
              },
              product: {
                type: Type.OBJECT,
                properties: {
                  products: { type: Type.STRING },
                  goods: { type: Type.STRING },
                  services: { type: Type.STRING },
                  keyProducts: { type: Type.STRING },
                  strengths: { type: Type.STRING },
                  weaknesses: { type: Type.STRING }
                },
                required: ["products", "keyProducts", "strengths", "weaknesses"]
              },
              customer: {
                type: Type.OBJECT,
                properties: { characteristics: { type: Type.STRING } },
                required: ["characteristics"]
              },
              financials: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    year: { type: Type.STRING },
                    revenue: { type: Type.STRING },
                    operatingProfit: { type: Type.STRING },
                    netIncome: { type: Type.STRING },
                    notes: { type: Type.STRING }
                  },
                  required: ["year", "revenue", "operatingProfit", "netIncome"]
                }
              },
              competitors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "description"]
                }
              },
              future: {
                type: Type.OBJECT,
                properties: {
                  strategicDirection: { type: Type.STRING },
                  growthEngines: { type: Type.STRING },
                  newMarketStrategy: { type: Type.STRING }
                },
                required: ["strategicDirection", "growthEngines", "newMarketStrategy"]
              },
              dataVerification: {
                type: Type.OBJECT,
                properties: {
                  sources: { type: Type.ARRAY, items: { type: Type.STRING } },
                  accuracyNotes: { type: Type.STRING },
                  lastUpdated: { type: Type.STRING }
                },
                required: ["sources", "accuracyNotes"]
              }
            },
            required: ["overview", "product", "customer", "financials", "competitors", "future", "dataVerification"]
          }
        }
      });

      if (!response.text) throw new Error("File processing failed");
      return JSON.parse(response.text);
    });

    return res.json(result);
  } catch (err: any) {
    const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
    return res.status(isRateLimit ? 429 : 500).json({ error: err.message || 'File processing failed' });
  }
}
