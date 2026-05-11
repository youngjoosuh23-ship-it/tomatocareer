import { Type } from "@google/genai";
import { createAI, getClientIp, withRetry, checkRateLimit } from "./_shared";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rl = checkRateLimit(getClientIp(req), 10);
  if (rl === 'minute') return res.status(429).json({ error: '잠깐! 1분에 5회까지만 사용할 수 있어요. 잠시 후 다시 시도해 주세요.' });
  if (rl === 'daily') return res.status(429).json({ error: '일일 무료 사용 횟수(10회)를 초과했습니다. 내일 다시 시도해주세요.' });

  const { background, company } = req.body;

  // Input size validation
  if (background?.resumeText && background.resumeText.length > 50000)
    return res.status(400).json({ error: 'Resume text too long (max 50,000 chars)' });
  if (company?.jd_text && company.jd_text.length > 20000)
    return res.status(400).json({ error: 'Job description too long (max 20,000 chars)' });
  if (background?.experience && background.experience.length > 3000)
    return res.status(400).json({ error: 'Experience field too long (max 3,000 chars)' });
  const languageName = background.content_language === 'ko' ? 'Korean' : background.content_language === 'zh' ? 'Chinese' : 'English';
  const p = background.priorities;
  const rankToWeight = (rank: number) => Math.round(rank / 15 * 100);
  const priorityNote = p
    ? `\n[Candidate's Priority Rankings (5=most important, 1=least — each rank used exactly once)]
- Job Fit (직무 적합도): rank ${p.job_fit}/5 → weight ${rankToWeight(p.job_fit)}%
- Growth (성장 가능성): rank ${p.growth}/5 → weight ${rankToWeight(p.growth)}%
- Culture Fit (문화 적합성): rank ${p.culture}/5 → weight ${rankToWeight(p.culture)}%
- Risk (리스크): rank ${p.risk}/5 → weight ${rankToWeight(p.risk)}%
- Compensation (보상): rank ${p.compensation}/5 → weight ${rankToWeight(p.compensation)}%

Compute fit_score as the weighted average: sum(sub_score × weight) across all 5 dimensions.
Return each sub_score (0–100) in score_breakdown. A gap in a higher-ranked dimension must penalize the score proportionally more.`
    : '';

  const prompt = `
[User Background]
- Major: ${background.major}
- Experience: ${background.experience}
- Skills: ${background.skills}
- Target Roles: ${background.target_roles}
- Constraints: ${background.constraints}
${background.resumeText ? `\n[Resume Content]\n${background.resumeText}` : ''}${priorityNote}

[Company Info]
- Company Name: ${company.company_name}
- Role: ${company.role}

[Job Description]
${company.jd_text}

Analyze the company and role to identify what type of candidate they truly prefer.
Estimate the most likely reasons this candidate would be rejected and suggest improvement actions.
Provide a final decision (APPLY, SKIP, or REVISIT) with detailed reasoning.

YEARS OF EXPERIENCE vs. COMPETENCY PRINCIPLE:
Years of experience is only a proxy for competency — actual skill evidence matters more than tenure.
When evaluating fit, follow this process:
1. Identify the competency level actually implied by the JD's required years (use the framework below).
2. Check whether the candidate's resume/background demonstrates those competencies.
3. If years are short but competency evidence is present → assign high fit, note it explicitly.
4. If years are sufficient but competency evidence is absent → assign low fit, note it explicitly.
5. Always explain gaps as: "Years are short but [X experience] covers this" or "Years are sufficient but evidence of [Y competency] is missing."

Expected competency by seniority band:
- 1–2 years: Execution focus, follows direction well, learns fast
- 3–4 years: Independent planning, budget judgment, guides juniors
- 5+ years: Sets strategy, leads cross-team collaboration, owns full outcomes

Additionally, provide:
1. Resume Gap Analysis: Specific gaps between the user's resume/background and the JD requirements. Apply the competency-over-years principle — distinguish between a years gap and a genuine skill gap.
2. Resume Improvement Suggestions: Concrete ways to improve the resume for this specific role.
3. Role-Level Insights: Insights about the seniority, culture, and specific expectations of this role level.
4. Actionable Next Steps: A list of clear steps the user should take.
5. Culture Summary: 2-3 sentences describing the company's work culture, values, and team environment based on the JD signals.
6. Missing Keywords: Important technical skills, tools, or domain terms from the JD that are absent from the candidate's resume/background. List only terms that are genuinely missing.
7. Application Checklist: 8-10 concrete pre-application tasks with categories (e.g. "Resume", "Networking", "Research", "Interview Prep").

SCORING RULES (MUST follow exactly):
- fit_score: integer from 0 to 100 (e.g. 72). This is the overall weighted fit percentage.
- hiring_probability: integer from 0 to 100 (e.g. 35). This is the estimated % chance of being hired.
- score_breakdown values (job_fit, growth, culture, risk, compensation): each an integer from 0 to 100.
- DO NOT use 0-10 or 0-1 scales. All numeric scores must be on the 0-100 scale.

IMPORTANT: You MUST return all text fields in ${languageName}.
`;

  try {
    const ai = createAI();
    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `You are an AI career decision copilot. Your role is to analyze a job opportunity based on the job description and the user's background, and return a structured decision to support job application strategy. You MUST return your response in valid JSON format only.

          STRICT LANGUAGE RULE:
          - Regardless of the input language (Job Description or Background), the output MUST be entirely in ${languageName}.
          - If the requested language is Korean, ALL descriptive text and analysis MUST be in Korean.
          - If the requested language is English, ALL descriptive text and analysis MUST be in English.
          - If the requested language is Chinese, ALL descriptive text and analysis MUST be in Chinese (Traditional).
          - Do not mix languages. Use technical terms in the target language where possible, or include English terms in parentheses only if mission-critical.`,
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rejection_reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvement_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
              ideal_candidate_profile: { type: Type.STRING },
              hidden_expectations: { type: Type.ARRAY, items: { type: Type.STRING } },
              company: { type: Type.STRING },
              role: { type: Type.STRING },
              decision: { type: Type.STRING, enum: ["APPLY", "SKIP", "REVISIT"] },
              fit_score: { type: Type.NUMBER, description: "Overall fit score 0-100 integer (e.g. 72)" },
              priority: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
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
              hiring_probability: { type: Type.NUMBER, description: "Hiring probability 0-100 integer (e.g. 35)" },
              score_breakdown: {
                type: Type.OBJECT,
                properties: {
                  job_fit:      { type: Type.NUMBER, description: "0-100 integer" },
                  growth:       { type: Type.NUMBER, description: "0-100 integer" },
                  culture:      { type: Type.NUMBER, description: "0-100 integer" },
                  risk:         { type: Type.NUMBER, description: "0-100 integer" },
                  compensation: { type: Type.NUMBER, description: "0-100 integer" },
                },
              },
              culture_summary: { type: Type.STRING },
              missing_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              application_checklist: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item:     { type: Type.STRING },
                    category: { type: Type.STRING },
                  },
                  required: ['item', 'category'],
                },
              },
            },
            required: [
              "rejection_reasons", "improvement_actions", "ideal_candidate_profile",
              "hidden_expectations", "company", "role", "decision", "fit_score",
              "priority", "key_reasons", "strengths", "gaps", "risks", "strategy",
              "resume_bullets", "next_action", "resume_gap_analysis", "resume_improvements",
              "role_insights", "actionable_next_steps", "hiring_probability", "score_breakdown",
              "culture_summary", "missing_keywords", "application_checklist"
            ]
          }
        },
      });
      return JSON.parse(response.text ?? '{}');
    });

    return res.json(result);
  } catch (err: any) {
    const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
    return res.status(isRateLimit ? 429 : 500).json({ error: err.message || 'Analysis failed' });
  }
}
