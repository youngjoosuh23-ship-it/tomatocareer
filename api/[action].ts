import agentDiscover from "./_handlers/agent-discover";
import agentParse from "./_handlers/agent-parse";
import analyze from "./_handlers/analyze";
import careerQuestions from "./_handlers/career-questions";
import compare from "./_handlers/compare";
import corporateAnalyze from "./_handlers/corporate-analyze";
import corporateFile from "./_handlers/corporate-file";
import corporateQuestions from "./_handlers/corporate-questions";
import corporateTranslate from "./_handlers/corporate-translate";
import findJobs from "./_handlers/find-jobs";
import jdInput from "./_handlers/jd-input";
import rebuild from "./_handlers/rebuild";
import suggestCompanies from "./_handlers/suggest-companies";
import translateAnalysis from "./_handlers/translate-analysis";

const routes: Record<string, (req: any, res: any) => Promise<any>> = {
  "agent-discover": agentDiscover,
  "agent-parse": agentParse,
  analyze,
  "career-questions": careerQuestions,
  compare,
  "corporate-analyze": corporateAnalyze,
  "corporate-file": corporateFile,
  "corporate-questions": corporateQuestions,
  "corporate-translate": corporateTranslate,
  "find-jobs": findJobs,
  "jd-input": jdInput,
  rebuild,
  "suggest-companies": suggestCompanies,
  "translate-analysis": translateAnalysis,
};

export default async function handler(req: any, res: any) {
  const action = req.query.action as string;
  const route = routes[action];
  if (!route) return res.status(404).json({ error: `Unknown action: ${action}` });
  return route(req, res);
}
