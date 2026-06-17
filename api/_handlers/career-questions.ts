import { Type } from "@google/genai";
import { createAI, getClientIp, withRetry, checkRateLimit } from "./_shared";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rl = checkRateLimit(getClientIp(req), 10);
  if (rl === 'minute') return res.status(429).json({ error: '잠깐! 1분에 5회까지만 사용할 수 있어요. 잠시 후 다시 시도해 주세요.' });
  if (rl === 'daily') return res.status(429).json({ error: '일일 무료 사용 횟수(10회)를 초과했습니다. 내일 다시 시도해주세요.' });

  const { background, analysis } = req.body;
  const lang = background?.content_language === 'ko' ? 'Korean' : background?.content_language === 'zh' ? 'Chinese' : 'English';

  try {
    const ai = createAI();
    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate 7-9 interview preparation questions for the following job application.

[Candidate Background]
- Major: ${background.major}
- Experience: ${background.experience}
- Skills: ${background.skills}
${background.resumeText ? `- Resume: ${background.resumeText.substring(0, 2000)}` : ''}

[Target Position]
- Company: ${analysis.company}
- Role: ${analysis.role}
- Fit Score: ${analysis.fit_score}%
- Identified Gaps: ${analysis.gaps.join(', ')}
- Key Strengths: ${analysis.strengths.join(', ')}
- Hidden Expectations: ${analysis.hidden_expectations.join(', ')}

Generate questions that:
1. Target the candidate's identified gaps
2. Verify the claimed strengths with behavioral evidence
3. Cover the hidden expectations
4. Include one culture-fit question specific to the company

For each question also provide 2-3 likely follow-up questions the interviewer might ask after hearing the initial answer.
Respond entirely in ${lang}.`,
        config: {
          temperature: 0,
          responseMimeType: 'application/json',
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
                    answerAngle: { type: Type.STRING },
                    followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['category', 'question', 'rationale', 'answerAngle', 'followUpQuestions'],
                },
              },
            },
            required: ['questions'],
          },
        },
      });
      return JSON.parse(response.text);
    });

    return res.json(result);
  } catch (err: any) {
    const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
    return res.status(isRateLimit ? 429 : 500).json({ error: err.message || 'Failed to generate questions' });
  }
}
