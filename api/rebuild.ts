import { Type } from "@google/genai";
import { createAI, getClientIp, withRetry, checkRateLimit } from "./_shared";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rl = checkRateLimit(getClientIp(req), 10);
  if (rl === 'minute') return res.status(429).json({ error: '잠깐! 1분에 5회까지만 사용할 수 있어요. 잠시 후 다시 시도해 주세요.' });
  if (rl === 'daily') return res.status(429).json({ error: '일일 무료 사용 횟수(10회)를 초과했습니다. 내일 다시 시도해주세요.' });

  const { background, analysis } = req.body;

  // Input size validation
  if (background?.resumeText && background.resumeText.length > 50000)
    return res.status(400).json({ error: 'Resume text too long (max 50,000 chars)' });
  if (background?.experience && background.experience.length > 3000)
    return res.status(400).json({ error: 'Experience field too long (max 3,000 chars)' });

  const languageName = background.content_language === 'ko' ? 'Korean' : background.content_language === 'zh' ? 'Chinese' : 'English';

  const prompt = `
## Candidate Background
- Education/Major: ${background.major}
- Experience Summary: ${background.experience}
- Skills: ${background.skills}
- Target Roles: ${background.target_roles}
${background.resumeText ? `\n## Full Original Resume\n${background.resumeText}` : ''}

## Target Opportunity
- Company: ${analysis.company}
- Role: ${analysis.role}
- Fit Score: ${analysis.fit_score}%

## Deep Job Analysis (use these to extract ATS keywords and prioritize content)
**Ideal Candidate Profile:** ${analysis.ideal_candidate_profile}
**Candidate Strengths to Amplify:** ${analysis.strengths.join(' | ')}
**Gaps to Strategically Bridge:** ${analysis.gaps.join(' | ')}
**Hidden Expectations (critical keywords):** ${analysis.hidden_expectations.join(' | ')}
**Role-Specific Insights:** ${analysis.role_insights.join(' | ')}

## AI-Generated Optimized Bullets (incorporate and expand these)
${analysis.resume_bullets.map((b: string) => `- ${b}`).join('\n')}

## Required Improvements
${analysis.resume_improvements.map((imp: string, i: number) => `${i + 1}. ${imp}`).join('\n')}

## Gap Analysis
${analysis.resume_gap_analysis.map((g: string) => `- ${g}`).join('\n')}

---

Rebuild this candidate's resume using all the analysis above. Apply the following three principles without exception:

### PRINCIPLE 1 — ATS Optimization
- Extract ALL keywords from "Hidden Expectations", "Role-Specific Insights", and the role title, and weave them naturally into the resume text
- Use standard section headers only: Summary, Experience, Education, Skills, Projects (no creative alternatives)
- NEVER use tables, images, columns, text boxes, or special Unicode characters (→, ★, ✓, etc.)
- Use plain hyphens (-) for bullets only
- Keep formatting machine-readable: no bold inside bullet text, no nested bullet levels beyond 2
- NEVER mention the target company name ("${analysis.company}") anywhere in the resume — company-specific references belong in a cover letter, not a resume. The resume must be reusable across multiple applications.

### PRINCIPLE 2 — Show the Person, Not Just the Job Title
- Transform every duty statement into an achievement statement:
  BAD:  "Managed a team of 5 engineers"
  GOOD: "Led 5-engineer team to deliver X feature 2 weeks ahead of schedule, reducing customer churn by 12%"
- Each bullet must answer: What did you DO → How did you do it → What was the measurable RESULT
- If exact numbers are unknown, use credible approximations (e.g., "~30% reduction", "10K+ users")
- Add 1-2 lines in the Summary showing the candidate's working style or values that match the company culture

### PRINCIPLE 3 — 6-Second Scan Structure
- Place the strongest, most role-relevant achievement FIRST under each job entry
- Summary section (3 lines max): lead with the #1 reason this person fits this role and industry — describe the candidate's expertise, working style, and value. Do NOT name the target company or write as if addressing them directly.
- Core Competencies section: list 8-12 keywords that directly mirror the JD — this is the ATS keyword block
- Each bullet point: max 2 lines, start with a strong action verb, end with a metric or outcome
- Suggested section order: Summary → Core Competencies → Experience (reverse chronological) → Education → Skills/Certifications

CRITICAL: The entire rebuilt resume MUST be in ${languageName}.
`;

  try {
    const ai = createAI();
    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `You are a senior resume strategist who specializes in three areas simultaneously:
1. ATS (Applicant Tracking System) optimization — you know exactly which keywords, structures, and formats get past automated filters.
2. Human-centered storytelling — you transform bland duty lists into compelling achievement narratives that reveal the candidate's impact, working style, and values.
3. Recruiter UX — you design resumes that communicate the candidate's fit within the first 6 seconds of scanning.

Your output must be a complete, ready-to-submit resume in clean Markdown. Return valid JSON only.

STRICT LANGUAGE RULE: The rebuilt resume MUST be entirely in ${languageName}. No exceptions.`,
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rebuilt_resume: { type: Type.STRING },
            },
            required: ["rebuilt_resume"]
          }
        }
      });
      if (!response.text) throw new Error("No response from AI");
      return JSON.parse(response.text);
    });

    return res.json(result);
  } catch (err: any) {
    const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
    return res.status(isRateLimit ? 429 : 500).json({ error: err.message || 'Resume rebuild failed' });
  }
}
