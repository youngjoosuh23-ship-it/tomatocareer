import { Type } from "@google/genai";
import { createAI, getClientIp, withRetry, checkRateLimit } from "./_shared";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rl = checkRateLimit(getClientIp(req), 10);
  if (rl === 'minute') return res.status(429).json({ error: '잠깐! 1분에 5회까지만 사용할 수 있어요. 잠시 후 다시 시도해 주세요.' });
  if (rl === 'daily') return res.status(429).json({ error: '일일 무료 사용 횟수(10회)를 초과했습니다. 내일 다시 시도해주세요.' });

  const { fileData, mimeType } = req.body;
  if (!fileData || !mimeType) return res.status(400).json({ error: 'fileData and mimeType required' });

  const SUPPORTED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (!SUPPORTED.includes(mimeType)) return res.status(400).json({ error: 'Unsupported file type. Use PDF, JPEG, PNG, or WebP.' });

  if (fileData.length > 10 * 1024 * 1024) return res.status(400).json({ error: 'File too large (max 10MB)' });

  const base64 = (fileData as string).replace(/^data:[^;]+;base64,/, '');

  try {
    const ai = createAI();
    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            text: `You are an expert resume parser. Carefully read this resume and extract structured career information.

Instructions:
- major: Academic field / degree (e.g. "Computer Science, B.S.", "Business Administration")
- experience: Concise work history summary (2-4 sentences, include company names, roles, years)
- skills: Comma-separated list of key technical and soft skills found on the resume
- target_roles: 2-3 specific job titles this person would be best suited for, based on their background
- constraints: Any mentioned preferences (remote, location, visa, part-time, etc.) or write "None mentioned"
- location: The candidate's current city/country or preferred work location (e.g. "Seoul, Korea", "San Francisco, CA", "Remote"). Extract from address, contact info, or any location hints. Return empty string if not found.
- target_industries: Array of 2-4 industry sectors this person has worked in or is suited for
- career_level: One of "entry" (0-2 yrs), "mid" (2-5 yrs), "senior" (5-10 yrs), "executive" (10+ yrs or management)
- resumeText: The full readable text extracted from the resume

Be specific and accurate. Extract real information from the document — do not invent details.`
          },
          { inlineData: { mimeType, data: base64 } },
        ],
        config: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              major: { type: Type.STRING },
              experience: { type: Type.STRING },
              skills: { type: Type.STRING },
              target_roles: { type: Type.STRING },
              constraints: { type: Type.STRING },
              location: { type: Type.STRING },
              target_industries: { type: Type.ARRAY, items: { type: Type.STRING } },
              career_level: { type: Type.STRING, enum: ['entry', 'mid', 'senior', 'executive'] },
              resumeText: { type: Type.STRING },
            },
            required: ['major', 'experience', 'skills', 'target_roles', 'constraints', 'location', 'target_industries', 'career_level', 'resumeText'],
          },
        },
      });
      if (!response.text) throw new Error('No response from AI');
      return JSON.parse(response.text);
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to parse resume' });
  }
}
