import { Type } from "@google/genai";
import { createAI, withRetry, getClientIp, checkRateLimit } from "./_shared";

// Handles both JD URL scraping and JD file parsing in one function.
// Request body: { url } for scraping, { fileData, mimeType } for file upload.

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rl = checkRateLimit(getClientIp(req), 20);
  if (rl === 'minute') return res.status(429).json({ error: '잠깐! 1분에 5회까지만 사용할 수 있어요. 잠시 후 다시 시도해 주세요.' });
  if (rl === 'daily') return res.status(429).json({ error: '일일 무료 사용 횟수(20회)를 초과했습니다. 내일 다시 시도해주세요.' });

  const { url, fileData, mimeType } = req.body;

  const schema = {
    type: Type.OBJECT,
    properties: {
      company_name: { type: Type.STRING },
      role: { type: Type.STRING },
      jd_text: { type: Type.STRING },
    },
    required: ['company_name', 'role', 'jd_text'],
  };

  // ── File upload path ────────────────────────────────────────────────
  if (fileData) {
    if (!mimeType) return res.status(400).json({ error: 'mimeType required with fileData' });
    const SUPPORTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!SUPPORTED.includes(mimeType)) return res.status(400).json({ error: 'Unsupported file type' });

    const base64 = (fileData as string).replace(/^data:[^;]+;base64,/, '');
    try {
      const ai = createAI();
      const result = await withRetry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { text: 'Extract the job posting information from this file. Return the company name, job title/role, and the complete job description text (requirements, responsibilities, qualifications). Clean up jd_text to be readable and well-formatted. Return valid JSON only.' },
            { inlineData: { mimeType, data: base64 } },
          ],
          config: { temperature: 0, responseMimeType: 'application/json', responseSchema: schema },
        });
        if (!response.text) throw new Error('No response from AI');
        return JSON.parse(response.text);
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to parse file' });
    }
  }

  // ── URL scraping path ───────────────────────────────────────────────
  if (!url) return res.status(400).json({ error: 'url or fileData required' });

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol))
    return res.status(400).json({ error: 'Only HTTP/HTTPS URLs are allowed' });
  const hostname = parsedUrl.hostname.toLowerCase();
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname))
    return res.status(400).json({ error: 'Internal URLs are not allowed' });

  let pageText: string;
  try {
    // Ashby HQ direct API
    const ashbyMatch = url.match(/jobs\.ashbyhq\.com\/([^/]+)\/([a-f0-9-]{36})/i);
    if (ashbyMatch) {
      const [, org, jobId] = ashbyMatch;
      const apiRes = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${org}?includeCompensation=true`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(12000),
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        const job = (data.jobs || []).find((j: any) => j.id === jobId || j.externalId === jobId);
        if (job) {
          pageText = [
            `Company: ${data.organization?.name || org}`,
            `Role: ${job.title}`,
            `Location: ${job.location || ''}`,
            `Department: ${job.department || ''}`,
            `Employment Type: ${job.employmentType || ''}`,
            `\n${job.descriptionHtml ? job.descriptionHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : job.description || ''}`,
          ].join('\n').substring(0, 14000);
        }
      }
    }

    if (!pageText!) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
        },
        signal: AbortSignal.timeout(12000),
      });

      if (response.status === 401 || response.status === 403)
        return res.status(401).json({ error: 'Login required', requiresLogin: true });
      if (!response.ok)
        return res.status(400).json({ error: `Failed to fetch page: ${response.status}` });

      const html = await response.text();
      const stripped = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ').trim();

      const isSpaShell = stripped.length < 400 ||
        stripped.includes('You need to enable JavaScript') ||
        stripped.includes('enable JavaScript to run');

      if (isSpaShell) {
        const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
          headers: { 'Accept': 'text/plain', 'X-Return-Format': 'text' },
          signal: AbortSignal.timeout(20000),
        });
        pageText = jinaRes.ok ? (await jinaRes.text()).substring(0, 14000) : stripped.substring(0, 14000);
      } else {
        pageText = stripped.substring(0, 14000);
      }
    }
  } catch (err: any) {
    if (err.name === 'TimeoutError') return res.status(408).json({ error: 'Request timed out' });
    return res.status(400).json({ error: 'Failed to fetch URL' });
  }

  try {
    const ai = createAI();
    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Extract the job posting information from this web page. URL: ${url}\n\nPage content:\n${pageText}`,
        config: {
          temperature: 0,
          systemInstruction: 'You are a job description extractor. From the provided web page content, extract the company name, job title/role, and the complete job description text (requirements, responsibilities, qualifications). Clean up the jd_text to be readable and well-formatted. Return valid JSON only.',
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });
      if (!response.text) throw new Error("No response from AI");
      return JSON.parse(response.text);
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to extract job description from page' });
  }
}
