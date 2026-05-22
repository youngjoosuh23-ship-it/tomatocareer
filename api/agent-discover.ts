import { Type } from "@google/genai";
import { createAI, getClientIp, withRetry, checkRateLimit } from "./_shared";

export interface DiscoveredJob {
  company_name: string;
  role: string;
  jd_url: string;
  reason: string;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rl = checkRateLimit(getClientIp(req), 10);
  if (rl === 'minute') return res.status(429).json({ error: '잠깐! 1분에 5회까지만 사용할 수 있어요. 잠시 후 다시 시도해 주세요.' });
  if (rl === 'daily') return res.status(429).json({ error: '일일 무료 사용 횟수(10회)를 초과했습니다. 내일 다시 시도해주세요.' });

  const { background, language = 'ko', feedbackHints } = req.body;
  if (!background?.target_roles) return res.status(400).json({ error: 'background with target_roles required' });

  const location: string = background.location || '';
  const excludedCompanies: string[] = feedbackHints?.excluded_companies ?? [];
  const preferredRoles: string[] = feedbackHints?.preferred_roles ?? [];

  const ai = createAI();

  // Step 1: Use Gemini with Google Search grounding to find real job listings
  const searchPrompt = `Search Google for currently open job postings that match this candidate:

Target Roles: ${background.target_roles}
Skills: ${background.skills}
Career Level: ${background.career_level || 'mid'}
Industries: ${(background.target_industries || []).join(', ')}
${location ? `Preferred Location: ${location} — prioritize jobs in or near this location, or remote-friendly roles` : ''}
${preferredRoles.length > 0 ? `User has previously shown interest in roles like: ${preferredRoles.join(', ')} — prioritize similar opportunities` : ''}

Find 5 specific, real job postings with direct URLs to the job application pages.
Include a mix of company sizes (large tech, mid-size, startup).
For each job, provide: company name, exact job title, and the direct URL to apply.
${location ? `Strongly prefer jobs located in ${location} or explicitly offering remote/hybrid options.` : ''}
${excludedCompanies.length > 0 ? `IMPORTANT: Do NOT suggest jobs at these companies (user is not interested): ${excludedCompanies.join(', ')}` : ''}`;

  try {
    const searchResponse = await withRetry(async () => {
      const r = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: searchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0,
        },
      });
      return r;
    });

    // Extract grounding chunks (URLs Google Search actually found)
    const chunks = (searchResponse.candidates?.[0] as any)?.groundingMetadata?.groundingChunks ?? [];
    const webSources: { uri: string; title: string }[] = chunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({ uri: c.web.uri as string, title: (c.web.title as string) || '' }));

    // Filter for likely job posting URLs
    const jobUrlKeywords = [
      'linkedin.com/jobs', 'indeed.com/viewjob', 'indeed.com/rc/clk',
      'glassdoor.com/job', 'greenhouse.io', 'lever.co', 'ashbyhq.com',
      'workday.com', 'myworkdayjobs.com', 'smartrecruiters.com',
      'icims.com', 'jobvite.com', '/careers/', '/jobs/', '/job/',
    ];
    const jobSources = webSources.filter(s =>
      jobUrlKeywords.some(k => s.uri.toLowerCase().includes(k))
    );

    const searchText = searchResponse.text ?? '';

    // Step 2: Structured extraction — turn the search text + URLs into clean job objects
    const structuredResponse = await withRetry(async () => {
      const r = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Extract job opportunities from this search result. Return exactly 5 jobs (or fewer if not enough found).

Search result text:
${searchText.substring(0, 4000)}

URLs found by Google Search (use these as jd_url when possible):
${(jobSources.length > 0 ? jobSources : webSources.slice(0, 15))
  .map(s => `- ${s.title}: ${s.uri}`)
  .join('\n')}

Candidate profile:
- Target Roles: ${background.target_roles}
- Skills: ${background.skills}
- Career Level: ${background.career_level || 'mid'}

For each job return:
- company_name: company name
- role: exact job title
- jd_url: direct URL to the job posting (prefer job-specific URLs over general search pages)
- reason: 1 sentence why this matches the candidate

Rules:
- jd_url must be a real URL (no placeholder text)
- Prefer specific job posting URLs over general careers homepages
- If a URL is from LinkedIn, Indeed, Greenhouse, Lever, or Ashby, it's likely a job posting
${excludedCompanies.length > 0 ? `- EXCLUDE any jobs at these companies: ${excludedCompanies.join(', ')}` : ''}`,
        config: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              jobs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    company_name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    jd_url: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ['company_name', 'role', 'jd_url', 'reason'],
                },
              },
            },
            required: ['jobs'],
          },
        },
      });
      if (!r.text) throw new Error('No response from AI');
      return JSON.parse(r.text);
    });

    // Filter out jobs with obviously invalid URLs
    const validJobs = (structuredResponse.jobs as DiscoveredJob[]).filter(j => {
      try {
        const url = new URL(j.jd_url);
        return ['http:', 'https:'].includes(url.protocol);
      } catch {
        return false;
      }
    });

    return res.json({ jobs: validJobs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to discover jobs' });
  }
}
