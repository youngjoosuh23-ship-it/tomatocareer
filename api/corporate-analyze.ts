import { createAI, getClientIp, withRetry, checkRateLimit } from "./_shared";

async function fetchClinicalTrials(company: string): Promise<{
  total: number; recruiting: number;
  byPhase: { phase: string; count: number }[];
  therapeuticAreas: string[];
  note: string;
} | null> {
  try {
    const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(company)}&pageSize=40&fields=Phase,OverallStatus,Condition`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const data = await r.json();
    const studies = data.studies ?? [];
    if (studies.length === 0) return null;

    const phaseCount: Record<string, number> = {};
    const areas = new Set<string>();
    let recruiting = 0;

    for (const s of studies) {
      const status = s.protocolSection?.statusModule?.overallStatus ?? '';
      const phases: string[] = s.protocolSection?.designModule?.phases ?? ['N/A'];
      const conditions: string[] = s.protocolSection?.conditionsModule?.conditions ?? [];

      if (['RECRUITING', 'ACTIVE_NOT_RECRUITING', 'NOT_YET_RECRUITING'].includes(status)) recruiting++;
      for (const phase of phases) {
        phaseCount[phase] = (phaseCount[phase] ?? 0) + 1;
      }
      conditions.slice(0, 2).forEach(c => areas.add(c));
    }

    const byPhase = Object.entries(phaseCount)
      .map(([phase, count]) => ({ phase: phase.replace('PHASE', 'Phase '), count }))
      .sort((a, b) => b.count - a.count);

    return {
      total: data.totalCount ?? studies.length,
      recruiting,
      byPhase,
      therapeuticAreas: [...areas].slice(0, 6),
      note: `ClinicalTrials.gov 기준 (${new Date().toLocaleDateString('ko-KR')})`,
    };
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rl = checkRateLimit(getClientIp(req), 10);
  if (rl === 'minute') return res.status(429).json({ error: '잠깐! 1분에 5회까지만 사용할 수 있어요. 잠시 후 다시 시도해 주세요.' });
  if (rl === 'daily') return res.status(429).json({ error: '일일 무료 사용 횟수(10회)를 초과했습니다. 내일 다시 시도해주세요.' });

  const { companyName, language = 'ko' } = req.body;
  const langLabel = language === 'ko' ? 'Korean' : language === 'zh' ? 'Traditional Chinese' : 'English';

  const pipeline = await fetchClinicalTrials(companyName);
  const pipelineContext = pipeline
    ? `\n[ClinicalTrials.gov Data — use this as ground truth for pipeline section]\nTotal trials: ${pipeline.total}, Active/Recruiting: ${pipeline.recruiting}\nBy Phase: ${pipeline.byPhase.map(p => `${p.phase}(${p.count})`).join(', ')}\nTherapeutic Areas: ${pipeline.therapeuticAreas.join(', ')}\n`
    : '\n[No ClinicalTrials.gov data found — company may not run clinical trials (MedTech device company, etc.)]\n';

  try {
    const ai = createAI();
    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze the company "${companyName}" with a focus on data accuracy and recent updates.
${pipelineContext}

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
      "pipeline": {
        "total": "number (total clinical trial count, 0 if none)",
        "recruiting": "number (actively recruiting trials)",
        "byPhase": [{ "phase": "string (e.g. Phase 1)", "count": "number" }],
        "therapeuticAreas": ["string (disease/condition area)"],
        "note": "string (data source note or explanation if no trials found)"
      },
      "funding": {
        "stage": "string (one of: Seed, Series A, Series B, Series C+, IPO/Public, Subsidiary/Division, Unknown)",
        "lastRound": "string (e.g. Series B $120M, 2023-09 — or 'N/A' if public/subsidiary)",
        "totalRaised": "string (total funding raised — or market cap if public)",
        "keyInvestors": ["string (notable investor names)"],
        "hiringOutlook": "string (2 sentences: what this funding stage means for hiring — stability, growth velocity, role scope)"
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
      const parsed = JSON.parse(jsonMatch[1]);
      // ClinicalTrials.gov 실제 데이터로 AI 추정값 덮어쓰기
      if (pipeline) parsed.pipeline = pipeline;
      return parsed;
    });

    return res.json(result);
  } catch (err: any) {
    const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
    return res.status(isRateLimit ? 429 : 500).json({ error: err.message || 'Analysis failed' });
  }
}
