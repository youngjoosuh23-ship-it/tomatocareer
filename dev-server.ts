import express from 'express';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

import analyze from './api/analyze';
import compare from './api/compare';
import careerQuestions from './api/career-questions';
import corporateAnalyze from './api/corporate-analyze';
import corporateFile from './api/corporate-file';
import corporateQuestions from './api/corporate-questions';
import corporateTranslate from './api/corporate-translate';
import rebuild from './api/rebuild';
import jdInput from './api/jd-input';
import translateAnalysis from './api/translate-analysis';
import suggestCompanies from './api/suggest-companies';
import findJobs from './api/find-jobs';

const app = express();
app.use(express.json({ limit: '50mb' }));

app.all('/api/analyze', analyze);
app.all('/api/compare', compare);
app.all('/api/career-questions', careerQuestions);
app.all('/api/corporate-analyze', corporateAnalyze);
app.all('/api/corporate-file', corporateFile);
app.all('/api/corporate-questions', corporateQuestions);
app.all('/api/corporate-translate', corporateTranslate);
app.all('/api/rebuild', rebuild);
app.all('/api/jd-input', jdInput);
app.all('/api/translate-analysis', translateAnalysis);
app.all('/api/suggest-companies', suggestCompanies);
app.all('/api/find-jobs', findJobs);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server → http://localhost:${PORT}`);
});
