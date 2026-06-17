import React, { useState, useRef } from "react";
import { Building2, Loader2, Download, Printer, Settings, History, LayoutDashboard, Database, Languages, FileUp, MessageSquare, FileText, FileSpreadsheet, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { cn } from "../lib/utils";
import { analyzeCompany, translateReport, processFileData, generateInterviewQuestions } from "../services/corporateService";
import { suggestCompanies, SuggestedCompany } from "../services/gemini";
import {
  InterviewQuestion,
  FinancialIndicator,
  CorporateAnalysisReport
} from "../types";
import { HistoryView, saveReportToHistory } from "./CorporateViews/HistoryView";
import { SettingsView } from "./CorporateViews/SettingsView";
import { TemplatesView } from "./CorporateViews/TemplatesView";

export function CorporateDashboard({ systemLanguage }: { systemLanguage?: 'en' | 'ko' | 'zh' }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [report, setReport] = useState<CorporateAnalysisReport | null>(null);
  const [industryOpen, setIndustryOpen] = useState(false);
  const [industryQuery, setIndustryQuery] = useState('');
  const [industryState, setIndustryState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [industrySuggestions, setIndustrySuggestions] = useState<SuggestedCompany[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [language, setLanguage] = useState<'ko' | 'en' | 'zh'>(
    systemLanguage === 'ko' ? 'ko' : systemLanguage === 'en' ? 'en' : systemLanguage === 'zh' ? 'zh' :
    (localStorage.getItem('corporate_lang') as 'ko' | 'en' | 'zh') || 'ko'
  );

  React.useEffect(() => {
    if (systemLanguage) setLanguage(systemLanguage);
  }, [systemLanguage]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const L = (ko: string, en: string, zh: string) =>
    language === 'ko' ? ko : language === 'zh' ? zh : en;

  const t = {
    title:         L("기업 데이터 자동 생성", "Corporate Data Auto-Fill", "企業數據自動生成"),
    subtitle:      L("기업 이름을 입력하면 AI가 필요한 지표와 데이터를 자동으로 제안합니다.", "Enter a company name and AI will automatically suggest the necessary indicators and data.", "輸入企業名稱，AI 將自動建議所需指標和數據。"),
    placeholder:   L("기업 이름을 입력하세요 (예: 삼성전자, 현대자동차)", "Enter company name (e.g., Samsung, Hyundai)", "請輸入企業名稱（例如：三星電子、現代汽車）"),
    aiFetch:       L("AI 데이터 불러오기", "Fetch AI Data", "AI 擷取資料"),
    manualEntry:   L("수동 데이터 입력", "Manual Entry", "手動輸入"),
    fileUpload:    L("파일 업로드 (PDF, CSV, MD)", "Upload File (PDF, CSV, MD)", "上傳檔案 (PDF, CSV, MD)"),
    dropZone:      L("파일을 이곳에 끌어다 놓으세요", "Drop files here", "將檔案拖放至此"),
    print:         L("인쇄하기", "Print", "列印"),
    navDashboard:  L("기업 분석 대시보드", "Dashboard", "企業分析儀表板"),
    navTemplates:  L("데이터 템플릿 관리", "Templates", "數據模板管理"),
    navHistory:    L("히스토리 로그", "History", "歷史記錄"),
    navSettings:   L("설정", "Settings", "設定"),
    pathLabel:     L("권장 분석 경로:", "Recommended Path:", "建議分析路徑："),
    clearAll:      L("모두 지우기", "Clear All", "清除全部"),
    exportXlsx:    L("표 내보내기 (.XLSX)", "Export (.XLSX)", "匯出 (.XLSX)"),
    dataReset:     L("데이터 초기화", "Reset Data", "重置資料"),
    addYear:       L("+ 연도 추가", "+ Add Year", "+ 新增年度"),
    addComp:       L("+ 경쟁사 추가", "+ Add Competitor", "+ 新增競爭對手"),
    delete:        L("삭제", "Delete", "刪除"),
    interviewTitle:L("추천 면접 질문", "Suggested Interview Questions", "推薦面試問題"),
    interviewBtn:  L("면접 질문 생성", "Generate Questions", "生成面試問題"),
    rationale:     L("질문 의도", "Rationale", "提問意圖"),
    angle:         L("답변 방향", "Answer Angle", "答題方向"),
    exportCsv:     L(".CSV로 내보내기", "Export as .CSV", "匯出為 .CSV"),
    exportPdf:     L(".PDF로 내보내기", "Export as .PDF", "匯出為 .PDF"),
    exportMd:      L(".MD로 내보내기", "Export as .MD", "匯出為 .MD"),
    langToggle:    L("English", "中文", "한국어"),
  };

  const handleIndustrySearch = async () => {
    if (!industryQuery.trim()) return;
    setIndustryState('loading');
    setIndustrySuggestions([]);
    try {
      const { companies } = await suggestCompanies(industryQuery.trim(), language);
      setIndustrySuggestions(companies);
      setIndustryState('done');
    } catch {
      setIndustryState('error');
    }
  };

  const handleSelectCompany = (name: string) => {
    setSearchTerm(name);
    setIndustryOpen(false);
    setIndustrySuggestions([]);
    setIndustryQuery('');
    setIndustryState('idle');
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeCompany(searchTerm, language);
      setReport(data);
      saveReportToHistory(data, searchTerm);
    } catch (err: any) {
      console.error(err);
      const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('Quota');
      if (isRateLimit) {
        setError("API 사용량 제한(Rate Limit)을 초과했습니다. 잠시 후 다시 시도하시거나 새로운 API 키를 설정해주세요.");
      } else {
        setError("데이터를 가져오는 중 오류가 발생했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = async () => {
    const newLang = language === 'ko' ? 'en' : language === 'en' ? 'zh' : 'ko';
    setLanguage(newLang);
    
    if (report) {
      setIsTranslating(true);
      try {
        const translated = await translateReport(report, newLang);
        setReport(translated);
      } catch (err: any) {
        console.error("Translation error:", err);
        const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('Quota');
        if (isRateLimit) {
          setError("API 사용량 제한(Rate Limit)을 초과했습니다. 번역을 일시적으로 사용할 수 없습니다.");
        } else {
          setError("번역 중 오류가 발생했습니다.");
        }
      } finally {
        setIsTranslating(false);
      }
    }
  };

  const handleManualStart = () => {
    const emptyReport: CorporateAnalysisReport = {
      overview: { companyName: "", industry: "", businessDetails: "", isListed: "", marketCap: "" },
      product: { products: "", goods: "", services: "", keyProducts: "", strengths: "", weaknesses: "" },
      customer: { characteristics: "" },
      financials: [
        { year: "2023", revenue: "", operatingProfit: "", netIncome: "", notes: "" },
        { year: "2022", revenue: "", operatingProfit: "", netIncome: "", notes: "" },
        { year: "2021", revenue: "", operatingProfit: "", netIncome: "", notes: "" }
      ],
      competitors: [
        { name: "", description: "" },
        { name: "", description: "" }
      ],
      future: { strategicDirection: "", growthEngines: "", newMarketStrategy: "" },
      dataVerification: {
        sources: ["직접 입력"],
        accuracyNotes: "사용자가 수동으로 입력한 데이터입니다.",
        lastUpdated: new Date().toLocaleDateString()
      }
    };
    setReport(emptyReport);
    setError(null);
  };

  const handleClear = () => {
    if (window.confirm("작성 중인 데이터를 모두 지우겠습니까?")) {
      setReport(null);
      setQuestions([]);
      setSearchTerm("");
    }
  };

  const handleExportXlsx = () => {
    if (!report) return;
    const wb = XLSX.utils.book_new();
    const overviewData = [
      ["Category", "Value"],
      ["Company Name", report.overview.companyName],
      ["Industry", report.overview.industry],
      ["Business Details", report.overview.businessDetails],
      ["Listed", report.overview.isListed],
      ["Market Cap", report.overview.marketCap]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overviewData), "Overview");
    const financialHeaders = ["Year", "Revenue", "Operating Profit", "Net Income"];
    const financialRows = report.financials.map(f => [f.year, f.revenue, f.operatingProfit, f.netIncome]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([financialHeaders, ...financialRows]), "Financials");
    XLSX.writeFile(wb, `${report.overview.companyName}_Analysis_Report.xlsx`);
  };

  const handleExportCsv = () => {
    if (!report) return;
    let csvContent = "Category,Value\n";
    csvContent += `Company Name,${report.overview.companyName}\n`;
    csvContent += `Industry,${report.overview.industry}\n\n`;
    csvContent += "Financials\nYear,Revenue,Operating Profit,Net Income\n";
    report.financials.forEach(f => {
      csvContent += `${f.year},${f.revenue},${f.operatingProfit},${f.netIncome}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${report.overview.companyName}_Report.csv`;
    link.click();
  };

  const handleExportMd = () => {
    if (!report) return;
    let md = `# Corporate Analysis Report: ${report.overview.companyName}\n\n`;
    md += `## Overview\n- **Industry**: ${report.overview.industry}\n- **Market Cap**: ${report.overview.marketCap}\n\n`;
    md += `## Financials\n| Year | Revenue | Operating Profit | Net Income |\n|---|---|---|---|\n`;
    report.financials.forEach(f => {
      md += `| ${f.year} | ${f.revenue} | ${f.operatingProfit} | ${f.netIncome} |\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${report.overview.companyName}_Analysis.md`;
    link.click();
  };

  const handleExportPdf = () => {
    if (!report) return;
    const doc = new jsPDF() as any;
    doc.text(`Corporate Analysis: ${report.overview.companyName}`, 14, 20);
    const financialRows = report.financials.map(f => [f.year, f.revenue, f.operatingProfit, f.netIncome]);
    (doc as any).autoTable({
      startY: 30,
      head: [['Year', 'Revenue', 'Operating Profit', 'Net Income']],
      body: financialRows,
    });
    doc.save(`${report.overview.companyName}_Analysis.pdf`);
  };

  const handleGenerateQuestions = async () => {
    if (!report) return;
    setIsGeneratingQuestions(true);
    try {
      const result = await generateInterviewQuestions(report, language);
      setQuestions(result.questions);
    } catch (err: any) {
      console.error(err);
      const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('Quota');
      if (isRateLimit) {
        setError("API 사용량 제한(Rate Limit)을 초과했습니다. 잠시 후 다시 시도하시거나 새로운 API 키를 설정해주세요.");
      } else {
        setError("질문 생성 중 오류가 발생했습니다.");
      }
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const addFinancialYear = () => {
    if (!report) return;
    const newReport = { ...report };
    newReport.financials = [
      ...newReport.financials,
      { year: "", revenue: "", operatingProfit: "", netIncome: "", notes: "" }
    ];
    setReport(newReport);
  };

  const addCompetitor = () => {
    if (!report) return;
    const newReport = { ...report };
    newReport.competitors = [...newReport.competitors, { name: "", description: "" }];
    setReport(newReport);
  };

  const removeListItem = (section: "financials" | "competitors", index: number) => {
    if (!report) return;
    const newReport = { ...report };
    (newReport[section] as any[]).splice(index, 1);
    setReport(newReport);
  };

  const handleManualEdit = (section: keyof CorporateAnalysisReport, field: string, value: any, index?: number) => {
    if (!report) return;
    const newReport = { ...report };
    if (Array.isArray(newReport[section]) && typeof index === "number") {
      (newReport[section] as any)[index][field] = value;
    } else if (typeof newReport[section] === "object") {
      (newReport[section] as any)[field] = value;
    }
    setReport(newReport);
  };

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'csv', 'md', 'txt'].includes(ext || "")) {
      setError(language === 'ko' ? "지원하지 않는 파일 형식입니다. (PDF, CSV, MD, TXT 가능)" : "Unsupported format. (PDF, CSV, MD, TXT available)");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        try {
          const data = await processFileData(content, file.name, language, ext === 'pdf');
          setReport(data);
          saveReportToHistory(data, file.name);
        } catch (err: any) {
          console.error(err);
          const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('Quota');
          if (isRateLimit) {
            setError(language === 'ko' ? "API 사용량 제한(Rate Limit)을 초과했습니다." : "API Rate Limit exceeded.");
          } else {
            setError(language === 'ko' ? "파일 분석 중 오류가 발생했습니다." : "Error while processing file.");
          }
        } finally {
          setIsLoading(false);
        }
      };
      
      if (ext === 'pdf') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }

    } catch (err) {
      setError(language === 'ko' ? "파일을 읽는 중 오류가 발생했습니다." : "Error reading file.");
      setIsLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex min-h-screen font-sans" style={{ color: '#1d1d1b', position: 'relative' }}>
      {/* Tomato decorations — absolute so they scroll with page content */}
      <div className="absolute pointer-events-none shape-bob" style={{ zIndex: 0, top: 90, right: '4%', width: 70, height: 70, '--rot': '8deg', animationDelay: '-1s' } as React.CSSProperties}>
        <svg viewBox="0 0 100 100" fill="none" width="70" height="70"><rect x="47" y="3" width="6" height="14" rx="3" fill="#5a9e5e"/><path d="M50 15 C37 4 18 12 25 24 C31 17 41 15 50 15Z" fill="#7bc99a"/><path d="M50 15 C63 4 82 12 75 24 C69 17 59 15 50 15Z" fill="#7bc99a"/><circle cx="50" cy="62" r="33" fill="#FF7C7C"/><ellipse cx="35" cy="47" rx="9" ry="6" fill="rgba(255,255,255,0.35)" transform="rotate(-20,35,47)"/><circle cx="40" cy="61" r="3" fill="#7a2020"/><circle cx="60" cy="61" r="3" fill="#7a2020"/><path d="M38 72 Q50 82 62 72" fill="none" stroke="#7a2020" strokeWidth="2.5" strokeLinecap="round"/></svg>
      </div>
      <div className="absolute pointer-events-none shape-bob" style={{ zIndex: 0, bottom: 80, right: '8%', width: 90, height: 90, '--rot': '-10deg', animationDelay: '-3s' } as React.CSSProperties}>
        <svg viewBox="0 0 100 100" fill="none" width="90" height="90"><rect x="47" y="3" width="6" height="14" rx="3" fill="#5a9e5e"/><path d="M50 15 C37 4 18 12 25 24 C31 17 41 15 50 15Z" fill="#7bc99a"/><path d="M50 15 C63 4 82 12 75 24 C69 17 59 15 50 15Z" fill="#7bc99a"/><circle cx="50" cy="62" r="33" fill="#FF7C7C"/><ellipse cx="35" cy="47" rx="9" ry="6" fill="rgba(255,255,255,0.35)" transform="rotate(-20,35,47)"/><circle cx="40" cy="61" r="3" fill="#7a2020"/><circle cx="60" cy="61" r="3" fill="#7a2020"/><path d="M38 72 Q50 82 62 72" fill="none" stroke="#7a2020" strokeWidth="2.5" strokeLinecap="round"/></svg>
      </div>
      <div className="absolute pointer-events-none shape-bob" style={{ zIndex: 0, bottom: 140, left: 280, width: 56, height: 56, '--rot': '6deg', animationDelay: '-2s' } as React.CSSProperties}>
        <svg viewBox="0 0 100 100" fill="none" width="56" height="56"><rect x="47" y="3" width="6" height="14" rx="3" fill="#5a9e5e"/><path d="M50 15 C37 4 18 12 25 24 C31 17 41 15 50 15Z" fill="#7bc99a"/><path d="M50 15 C63 4 82 12 75 24 C69 17 59 15 50 15Z" fill="#7bc99a"/><circle cx="50" cy="62" r="33" fill="#FF7C7C"/><ellipse cx="35" cy="47" rx="9" ry="6" fill="rgba(255,255,255,0.35)" transform="rotate(-20,35,47)"/><circle cx="40" cy="61" r="3" fill="#7a2020"/><circle cx="60" cy="61" r="3" fill="#7a2020"/><path d="M38 72 Q50 82 62 72" fill="none" stroke="#7a2020" strokeWidth="2.5" strokeLinecap="round"/></svg>
      </div>

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] shrink-0" style={{ padding: '36px 20px', borderRight: '1px solid rgba(29,29,27,0.08)', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', color: '#FF6B6B', margin: '0 12px 18px' }}>
          INSIGHT AUTO-FILL
        </p>

        <nav className="flex flex-col gap-1 flex-1">
          <NavItem
            icon={<LayoutDashboard size={18} />}
            label={t.navDashboard}
            isActive={activeNav === "dashboard"}
            onClick={() => setActiveNav("dashboard")}
          />
          <NavItem
            icon={<Database size={18} />}
            label={t.navTemplates}
            isActive={activeNav === "templates"}
            onClick={() => setActiveNav("templates")}
          />
          <NavItem
            icon={<History size={18} />}
            label={t.navHistory}
            isActive={activeNav === "history"}
            onClick={() => setActiveNav("history")}
          />
          <NavItem
            icon={<Settings size={18} />}
            label={t.navSettings}
            isActive={activeNav === "settings"}
            onClick={() => setActiveNav("settings")}
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto" style={{ padding: '44px 56px 80px', maxWidth: 1200, position: 'relative', zIndex: 1 }}>
        {activeNav === "dashboard" && (
        <div className="space-y-6">
          {/* Header */}
          <header style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px', color: '#1d1d1b' }}>{t.title}</h1>
                <p style={{ fontSize: 15, color: '#6e6e6a', margin: 0 }}>{t.subtitle}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={toggleLanguage}
                  disabled={isTranslating}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 10, fontSize: 13.5, fontWeight: 500, color: '#4a4a47', cursor: 'pointer', fontFamily: 'inherit', opacity: isTranslating ? 0.5 : 1 }}
                >
                  {isTranslating ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
                  {t.langToggle}
                </button>
                <button
                  onClick={() => window.print()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 10, fontSize: 13.5, fontWeight: 500, color: '#4a4a47', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <Printer size={14} /> {t.print}
                </button>
              </div>
            </div>

            {/* Path bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.12)', borderRadius: 14, fontSize: 13.5, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: '#FF6B6B' }}>{t.pathLabel}</span>
              <a href="https://dart.fss.or.kr" target="_blank" rel="noopener noreferrer"
                style={{ padding: '5px 11px', borderRadius: 8, background: '#fff', color: '#FF6B6B', fontWeight: 600, textDecoration: 'none' }}>
                DART (전자공시)
              </a>
              <span style={{ color: 'rgba(29,29,27,0.25)' }}>›</span>
              <span style={{ color: '#6e6e6a' }}>{L("기업명 검색", "Search Company", "搜尋企業名稱")}</span>
              <span style={{ color: 'rgba(29,29,27,0.25)' }}>›</span>
              <span style={{ color: '#6e6e6a' }}>{L("사업보고서", "Annual Report", "事業報告書")}</span>
              <span style={{ color: 'rgba(29,29,27,0.25)' }}>›</span>
              <span style={{ color: '#6e6e6a' }}>{L("회사의 개요 & 사업의 개요", "Company & Business Overview", "公司概要 & 事業概要")}</span>
            </div>
          </header>

          {/* Search card */}
          <section
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            style={{
              background: isDragging ? 'rgba(255,107,107,0.05)' : 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
              border: isDragging ? '1px dashed rgba(255,107,107,0.4)' : '1px solid rgba(255,255,255,0.85)',
              borderRadius: 18,
              padding: 22,
              boxShadow: '0 10px 40px -16px rgba(180,50,50,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
              marginBottom: 0,
            }}
          >
            {/* Search row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 12 }}>
              <div style={{ position: 'relative' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#6e6e6a', pointerEvents: 'none' }}>
                  <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
                </svg>
                <input
                  type="text"
                  placeholder={t.placeholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="form-input"
                  style={{ paddingLeft: 44, paddingTop: 14, paddingBottom: 14, fontSize: 15, borderRadius: 12 }}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                style={{ padding: '14px 24px', background: '#FF6B6B', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 22px -8px rgba(255,107,107,0.6)', transition: 'background 0.15s, transform 0.15s', display: 'inline-flex', alignItems: 'center', gap: 8, opacity: isLoading ? 0.6 : 1, whiteSpace: 'nowrap' }}
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : t.aiFetch}
              </button>
            </div>

            {/* Alt buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                onClick={handleManualStart}
                disabled={isLoading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, background: 'rgba(255,107,107,0.05)', border: '1px dashed rgba(255,107,107,0.25)', borderRadius: 12, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: '#FF6B6B', cursor: 'pointer', transition: 'background 0.15s' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4z"/></svg>
                {t.manualEntry}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
                accept=".pdf,.csv,.md,.txt"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, background: 'rgba(123,201,154,0.12)', border: '1px dashed rgba(123,201,154,0.4)', borderRadius: 12, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: '#2e7a4f', cursor: 'pointer', transition: 'background 0.15s' }}
              >
                <FileUp size={15} /> {t.fileUpload}
              </button>
            </div>

            {/* Industry search */}
            {!industryOpen ? (
              <button
                onClick={() => setIndustryOpen(true)}
                style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, background: 'rgba(99,102,241,0.06)', border: '1px dashed rgba(99,102,241,0.3)', borderRadius: 12, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: '#6366f1', cursor: 'pointer', width: '100%', transition: 'background 0.15s' }}
              >
                <Building2 size={15} />
                {L('산업/분야로 기업 찾기', 'Browse by Industry', '依產業瀏覽企業')}
              </button>
            ) : (
              <div style={{ marginTop: 10, background: 'rgba(99,102,241,0.03)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid rgba(99,102,241,0.25)', borderRadius: 10, padding: '0 12px' }}>
                    <Search size={13} color="#6366f1" />
                    <input
                      type="text"
                      value={industryQuery}
                      onChange={e => setIndustryQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleIndustrySearch()}
                      placeholder={L('예) AI, 바이오테크, 반도체, 핀테크...', 'e.g. AI, Biotech, Semiconductor...', '例) AI、生技、半導體...')}
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', background: 'transparent', padding: '10px 0' }}
                      autoFocus
                    />
                  </div>
                  <button onClick={handleIndustrySearch} disabled={industryState === 'loading' || !industryQuery.trim()}
                    style={{ padding: '10px 16px', background: '#6366f1', color: '#fff', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: (!industryQuery.trim() || industryState === 'loading') ? 0.4 : 1, whiteSpace: 'nowrap' }}>
                    {industryState === 'loading' ? L('검색 중...', 'Searching...', '搜尋中...') : L('검색', 'Search', '搜尋')}
                  </button>
                  <button onClick={() => { setIndustryOpen(false); setIndustrySuggestions([]); setIndustryState('idle'); setIndustryQuery(''); }}
                    style={{ padding: 10, background: 'transparent', border: '1px solid rgba(29,29,27,0.1)', borderRadius: 10, cursor: 'pointer', color: '#9e9e9a', display: 'flex', alignItems: 'center' }}>
                    <X size={14} />
                  </button>
                </div>

                {industryState === 'error' && (
                  <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>{L('검색 실패. 다시 시도해주세요.', 'Search failed. Please try again.', '搜尋失敗，請重試。')}</p>
                )}

                {industrySuggestions.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                    {industrySuggestions.map(c => (
                      <button key={c.name} onClick={() => handleSelectCompany(c.name)}
                        style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', background: '#fff', border: '1.5px solid rgba(99,102,241,0.15)', transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.5)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.04)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.15)'; (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1b' }}>{c.name}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#9e9e9a', background: '#f0f0ee', padding: '2px 6px', borderRadius: 999 }}>{c.size}</span>
                        </div>
                        <p style={{ fontSize: 11, color: '#6e6e6a', margin: 0, lineHeight: 1.4 }}>{c.notable_for}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isDragging && (
              <div style={{ paddingTop: 16, textAlign: 'center', color: '#FF6B6B', fontWeight: 700, fontSize: 14 }} className="animate-pulse">
                {t.dropZone}
              </div>
            )}
          </section>

          {error && (
            <div style={{ marginTop: 22, padding: '14px 18px', background: 'rgba(255,230,230,0.7)', border: '1px solid rgba(200,69,69,0.2)', borderRadius: 12, fontSize: 14, color: '#c84545', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, flexShrink: 0 }}><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {(report || isLoading) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 print:space-y-4"
              >
                {/* 1. 기업 개요 - Table Card Style */}
                <Card title={L("1. 기업 개요", "1. Company Overview", "1. 公司概要")}>
                  <div className="divide-y divide-natural-border divide-dotted">
                    <TableRow label={L("기업명", "Company Name", "企業名稱")} value={report?.overview.companyName} isLoading={isLoading} onChange={(v) => handleManualEdit("overview", "companyName", v)} />
                    <TableRow label={L("업종", "Industry", "業種")} value={report?.overview.industry} isLoading={isLoading} onChange={(v) => handleManualEdit("overview", "industry", v)} />
                    <TableRow label={L("사업 내용 상세", "Business Details", "事業內容詳情")} value={report?.overview.businessDetails} isLoading={isLoading} isTextArea onChange={(v) => handleManualEdit("overview", "businessDetails", v)} />
                    <TableRow label={L("상장여부", "Is Listed", "上市狀況")} value={report?.overview.isListed} isLoading={isLoading} onChange={(v) => handleManualEdit("overview", "isListed", v)} />
                    <TableRow label={L("시가총액", "Market Cap", "市值")} value={report?.overview.marketCap} isLoading={isLoading} onChange={(v) => handleManualEdit("overview", "marketCap", v)} />
                  </div>
                </Card>

                {/* 2. 기업분석 - Product */}
                <Card title={L("2. 기업분석 (Product)", "2. Business Analysis", "2. 企業分析")}>
                  <div className="divide-y divide-natural-border divide-dotted">
                    <TableRow label={L("제품", "Products", "產品")} value={report?.product.products} isLoading={isLoading} onChange={(v) => handleManualEdit("product", "products", v)} />
                    <TableRow label={L("상품", "Goods", "商品")} value={report?.product.goods} isLoading={isLoading} onChange={(v) => handleManualEdit("product", "goods", v)} />
                    <TableRow label={L("서비스", "Services", "服務")} value={report?.product.services} isLoading={isLoading} onChange={(v) => handleManualEdit("product", "services", v)} />
                    <TableRow label={L("핵심 상품 / 스테디 셀러", "Key Products", "核心商品")} value={report?.product.keyProducts} isLoading={isLoading} isTextArea onChange={(v) => handleManualEdit("product", "keyProducts", v)} />
                    <TableRow label={L("강점", "Strengths", "優勢")} value={report?.product.strengths} isLoading={isLoading} isTextArea className="bg-[#E9EDC9]/10" onChange={(v) => handleManualEdit("product", "strengths", v)} />
                    <TableRow label={L("약점", "Weaknesses", "弱點")} value={report?.product.weaknesses} isLoading={isLoading} isTextArea className="bg-[#DDBEA9]/10" onChange={(v) => handleManualEdit("product", "weaknesses", v)} />
                  </div>
                </Card>

                {/* 3. 고객 분석 */}
                <Card title={L("3. 주요 고객의 특성", "3. Customer Profile", "3. 主要客戶特性")}>
                  <div className="divide-y divide-natural-border divide-dotted">
                    <TableRow
                      label={L("고객 특성", "Characteristics", "客戶特性")}
                      value={report?.customer.characteristics} 
                      isLoading={isLoading} 
                     
                      isTextArea 
                      onChange={(v) => handleManualEdit("customer", "characteristics", v)} 
                    />
                  </div>
                </Card>

                {/* 4. 재무 상태 */}
                <Card 
                  title="4. Financial State" 
                  extra={<button onClick={addFinancialYear} className="px-3 py-1 bg-white border border-natural-border rounded-md text-[10px] text-natural-accent hover:bg-natural-bg font-bold">{t.addYear}</button>}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#FAF9F7] border-b border-natural-border">
                          <th className="p-4 font-bold text-xs text-natural-muted border-r border-natural-border">{L("지표", "Indicator", "指標")}</th>
                          {isLoading ? (
                            [1, 2, 3].map(i => <th key={i} className="p-4"><div className="h-4 w-12 bg-natural-sidebar animate-pulse rounded" /></th>)
                          ) : (
                            report?.financials.map((f, i) => (
                              <th key={i} className="p-4 font-bold text-xs text-natural-muted border-r border-natural-border/30 relative group">
                                <div className="flex items-center gap-2">
                                  <input 
                                    className="bg-transparent border-none p-0 w-16 focus:ring-0 outline-none" 
                                    value={f.year} 
                                    onChange={(e) => handleManualEdit("financials", "year", e.target.value, i)}
                                  />
                                  <button 
                                    onClick={() => removeListItem("financials", i)}
                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                                  >
                                    ×
                                  </button>
                                </div>
                              </th>
                            ))
                          )}
                          <th className="p-4 font-bold text-xs text-natural-muted text-center">{L("데이터 옵션", "Data Options", "數據選項")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-natural-border divide-dotted">
                        <FinancialRow label={L("매출", "Revenue", "營收")} field="revenue" financials={report?.financials} isLoading={isLoading} onUpdate={(idx, val) => handleManualEdit("financials", "revenue", val, idx)} />
                        <FinancialRow label={L("영업이익", "Operating Profit", "營業利潤")} field="operatingProfit" financials={report?.financials} isLoading={isLoading} onUpdate={(idx, val) => handleManualEdit("financials", "operatingProfit", val, idx)} />
                        <FinancialRow label={L("순이익", "Net Income", "淨利潤")} field="netIncome" financials={report?.financials} isLoading={isLoading} onUpdate={(idx, val) => handleManualEdit("financials", "netIncome", val, idx)} />
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* 5. 경쟁사 & 미래 방향 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                  <Card 
                    title="5. Competitor"
                    extra={<button onClick={addCompetitor} className="px-3 py-1 bg-white border border-natural-border rounded-md text-[10px] text-natural-accent hover:bg-natural-bg font-bold">{t.addComp}</button>}
                  >
                    <div className="p-6 space-y-6">
                      {isLoading ? (
                        [1, 2].map(i => <div key={i} className="h-24 bg-natural-sidebar/50 animate-pulse rounded-lg" />)
                      ) : (
                        report?.competitors.map((c, i) => (
                          <div key={i} className="space-y-3 bg-[#F7F5F0]/50 p-4 rounded-xl border border-natural-border/50 relative group">
                            <button 
                                onClick={() => removeListItem("competitors", i)}
                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-natural-muted hover:text-red-500 transition-all font-bold"
                            >
                              {t.delete}
                            </button>
                            <input
                              className="w-[80%] p-1 font-bold bg-transparent border-b border-natural-border outline-none text-natural-accent"
                              placeholder={L(`경쟁사 ${i + 1}`, `Competitor ${i + 1}`, `競爭對手 ${i + 1}`)}
                              value={c.name}
                              onChange={(e) => handleManualEdit("competitors", "name", e.target.value, i)}
                            />
                            <textarea
                              className="w-full text-sm p-1 bg-transparent border-none outline-none min-h-[80px]"
                              placeholder="경쟁 우위, 차별화 전략 등"
                              value={c.description}
                              onChange={(e) => handleManualEdit("competitors", "description", e.target.value, i)}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                  <Card title={L("6. 미래 방향", "6. Future Direction", "6. 未來方向")}>
                    {/* Strategic direction highlight */}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(29,29,27,0.08)', background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(255,107,107,0.04) 100%)' }}>
                      {isLoading ? (
                        <div className="space-y-2">
                          <div className="h-3 bg-natural-sidebar animate-pulse rounded w-1/3" />
                          <div className="h-4 bg-natural-sidebar animate-pulse rounded w-full" />
                          <div className="h-4 bg-natural-sidebar animate-pulse rounded w-4/5" />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                              <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                            </svg>
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#6366f1', textTransform: 'uppercase', marginBottom: 6 }}>
                              {L('성장 전략 요약', 'Strategic Direction', '策略方向摘要')}
                            </p>
                            <textarea
                              className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed overflow-hidden"
                              style={{ color: '#1d1d1b', fontFamily: 'inherit', fontWeight: 500 }}
                              value={report?.future.strategicDirection || ''}
                              placeholder={L('이 기업이 나아가려는 방향...', 'Where this company is headed...', '企業戰略方向...')}
                              ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                              onChange={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                                handleManualEdit('future', 'strategicDirection', e.target.value);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="divide-y divide-natural-border divide-dotted">
                      <TableRow label={L("미래 성장 동력", "Future Growth Engines", "未來成長動力")} value={report?.future.growthEngines} isLoading={isLoading} isTextArea onChange={(v) => handleManualEdit("future", "growthEngines", v)} />
                      <TableRow label={L("신시장 진출 전략", "New Market Strategy", "新市場進入策略")} value={report?.future.newMarketStrategy} isLoading={isLoading} isTextArea onChange={(v) => handleManualEdit("future", "newMarketStrategy", v)} />
                    </div>
                  </Card>
                </div>

                {/* Biotech Pipeline */}
                {(isLoading || report?.pipeline) && (
                  <Card title="🧬 Clinical Pipeline (ClinicalTrials.gov)">
                    <div className="p-8 space-y-5">
                      {isLoading ? (
                        <div className="space-y-3">
                          <div className="h-5 bg-natural-sidebar animate-pulse rounded w-1/3" />
                          <div className="h-16 bg-natural-sidebar animate-pulse rounded w-full" />
                        </div>
                      ) : report?.pipeline && (
                        <>
                          <div className="flex gap-6">
                            <div className="text-center">
                              <div className="text-3xl font-black text-natural-accent">{report.pipeline.total}</div>
                              <div className="text-[11px] text-natural-muted mt-0.5">전체 임상</div>
                            </div>
                            <div className="text-center">
                              <div className="text-3xl font-black text-emerald-600">{report.pipeline.recruiting}</div>
                              <div className="text-[11px] text-natural-muted mt-0.5">진행 중</div>
                            </div>
                          </div>
                          {report.pipeline.byPhase.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {report.pipeline.byPhase.map((p, i) => (
                                <span key={i} className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-bold text-blue-700">
                                  {p.phase} · {p.count}건
                                </span>
                              ))}
                            </div>
                          )}
                          {report.pipeline.therapeuticAreas.length > 0 && (
                            <div>
                              <div className="text-[11px] font-bold text-natural-muted mb-2">치료 영역</div>
                              <div className="flex flex-wrap gap-1.5">
                                {report.pipeline.therapeuticAreas.map((area, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-natural-sidebar rounded text-[11px] text-natural-muted">{area}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="text-[11px] text-natural-muted">{report.pipeline.note}</div>
                        </>
                      )}
                    </div>
                  </Card>
                )}

                {/* Funding / Stage */}
                {(isLoading || report?.funding) && (
                  <Card title="💰 Funding & Hiring Outlook">
                    <div className="p-8 space-y-4">
                      {isLoading ? (
                        <div className="space-y-3">
                          <div className="h-5 bg-natural-sidebar animate-pulse rounded w-1/4" />
                          <div className="h-12 bg-natural-sidebar animate-pulse rounded w-full" />
                        </div>
                      ) : report?.funding && (
                        <>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="px-4 py-1.5 bg-violet-100 text-violet-700 border border-violet-200 rounded-full text-sm font-black">{report.funding.stage}</span>
                            {report.funding.lastRound && report.funding.lastRound !== 'N/A' && (
                              <span className="text-sm text-natural-muted">{report.funding.lastRound}</span>
                            )}
                            {report.funding.totalRaised && (
                              <span className="text-sm font-bold text-natural-accent">{report.funding.totalRaised}</span>
                            )}
                          </div>
                          {report.funding.keyInvestors.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {report.funding.keyInvestors.map((inv, i) => (
                                <span key={i} className="px-2 py-0.5 bg-natural-sidebar border border-natural-border/50 rounded text-[11px] text-natural-muted">{inv}</span>
                              ))}
                            </div>
                          )}
                          <p className="text-sm text-natural-muted leading-relaxed">{report.funding.hiringOutlook}</p>
                        </>
                      )}
                    </div>
                  </Card>
                )}

                {/* 7. 데이터 신뢰성 검증 */}
                <Card title="7. Source & Accuracy Verification">
                  <div className="p-8 space-y-6">
                    {isLoading ? (
                      <div className="space-y-4">
                        <div className="h-6 bg-natural-sidebar animate-pulse rounded w-1/4" />
                        <div className="h-20 bg-natural-sidebar animate-pulse rounded w-full" />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-natural-accent flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> 데이터 출처 (Reliable Sources)
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {report?.dataVerification.sources.map((source, i) => {
                              const trimmedSource = source.trim();
                              const isUrl = trimmedSource.startsWith('http://') || trimmedSource.startsWith('https://');
                              return (
                                <span key={i} className="px-3 py-1 bg-[#F2F4F7] border border-natural-border/50 rounded-full text-[11px] text-natural-muted">
                                  {isUrl ? (
                                    <a href={trimmedSource} target="_blank" rel="noopener noreferrer" className="hover:text-natural-accent underline underline-offset-2">
                                      {trimmedSource}
                                    </a>
                                  ) : source}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-natural-accent flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> 검증 및 신뢰도 분석
                          </h3>
                          <div className="p-4 bg-[#F9F8F6] rounded-xl border border-natural-border italic text-sm leading-relaxed text-natural-muted">
                             "{report?.dataVerification.accuracyNotes}"
                             <div className="mt-3 text-[10px] font-medium not-italic">
                                최종 확인일: {report?.dataVerification.lastUpdated}
                             </div>
                          </div>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-4 items-start">
                           <div className="p-2 bg-amber-100 rounded-lg">
                             <Building2 size={16} className="text-amber-600" />
                           </div>
                           <div className="space-y-1">
                             <p className="text-xs font-bold text-amber-900">데이터 정합성 유의사항</p>
                             <p className="text-[11px] text-amber-700 leading-normal">
                                본 리포트는 DART 공시자료 및 공식 IR 자료를 우선적으로 분석했으나, 시장 데이터의 특성상 실시간 변동이 있을 수 있습니다. 정확한 의사결정을 위해 최종적으로 각 기관의 공식 사이트를 재확인하시기 바랍니다.
                             </p>
                           </div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                {/* 8. 추천 면접 질문 (Interview Questions) */}
                <Card 
                  title={`8. ${t.interviewTitle}`}
                  extra={
                    <button 
                      onClick={handleGenerateQuestions}
                      disabled={isGeneratingQuestions || isLoading}
                      className="px-3 py-1 bg-natural-accent text-white rounded-md text-[10px] hover:opacity-90 font-bold disabled:opacity-50 flex items-center gap-1"
                    >
                      {isGeneratingQuestions ? <Loader2 size={10} className="animate-spin" /> : <MessageSquare size={10} />}
                      {t.interviewBtn}
                    </button>
                  }
                >
                  <div className="p-6 space-y-8">
                    {questions.length === 0 && !isGeneratingQuestions ? (
                      <div className="text-center py-10 text-natural-muted text-sm italic">
                        {L("데이터를 기반으로 면접 질문을 예측해보세요.", "Predict interview questions based on the data.", "根據數據預測面試問題。")}
                      </div>
                    ) : (
                      <div className="space-y-10">
                        {Object.entries(
                          questions.reduce((acc, q) => {
                            if (!acc[q.category]) acc[q.category] = [];
                            acc[q.category].push(q);
                            return acc;
                          }, {} as Record<string, InterviewQuestion[]>)
                        ).map(([category, catQuestions], groupIdx) => (
                          <div key={groupIdx} className="space-y-4">
                            <h3 className="text-xs font-bold text-natural-muted uppercase tracking-widest px-1 flex items-center gap-2">
                              <span className="w-1 h-3 bg-natural-accent rounded-full" />
                              {category}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {(catQuestions as InterviewQuestion[]).map((q, i) => (
                                <div key={i} className="p-5 bg-[#FAF9F7] rounded-[15px] border border-natural-border space-y-3 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 flex items-center justify-center bg-natural-accent text-white rounded-full text-[10px] font-bold shrink-0 mt-0.5">Q</span>
                                    <p className="text-sm font-bold text-natural-text leading-tight">{q.question}</p>
                                  </div>
                                  <div className="pl-9 space-y-2">
                                    <div className="text-[11px] text-natural-muted leading-relaxed">
                                      <span className="font-bold text-natural-accent mr-1">[{t.rationale}]</span> {q.rationale}
                                    </div>
                                    <div className="text-[11px] text-natural-muted leading-relaxed bg-white/60 p-2 rounded-lg border border-dashed border-natural-border">
                                      <span className="font-bold text-natural-accent-light mr-1">[{t.angle}]</span> {q.answerAngle}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {isGeneratingQuestions && (
                      <div className="space-y-4">
                        {[1, 2].map(i => (
                          <div key={i} className="h-24 bg-natural-sidebar/50 animate-pulse rounded-2xl" />
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Footer Controls in Report */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.85)', borderRadius: 18, padding: 24, boxShadow: '0 10px 40px -16px rgba(180,50,50,0.12)' }}>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2 text-xs text-natural-muted">
                      <span className="w-2 h-2 rounded-full bg-natural-accent-light" /> {L("정상 데이터", "Verified", "已驗證")}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-natural-muted">
                      <span className="w-2 h-2 rounded-full bg-[#DDBEA9]" /> {L("확인 필요", "Need Review", "需要確認")}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button 
                      onClick={handleClear}
                      className="px-6 py-2.5 bg-white border border-natural-border text-red-500 rounded-lg font-semibold text-sm hover:bg-red-50 shadow-sm transition-all"
                    >
                      {t.clearAll}
                    </button>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button 
                        onClick={handleExportXlsx}
                        className="px-4 py-2.5 bg-natural-accent-light text-white rounded-lg font-semibold text-sm hover:opacity-90 shadow-sm transition-all flex items-center gap-2"
                      >
                        <FileSpreadsheet size={16} /> {t.exportXlsx}
                      </button>
                      <button 
                        onClick={handleExportCsv}
                        className="px-4 py-2.5 bg-white border border-natural-border text-natural-accent rounded-lg font-semibold text-sm hover:bg-natural-bg transition-all flex items-center gap-2"
                      >
                        <Download size={16} /> .CSV
                      </button>
                      <button 
                        onClick={handleExportPdf}
                        className="px-4 py-2.5 bg-white border border-natural-border text-natural-accent rounded-lg font-semibold text-sm hover:bg-natural-bg transition-all flex items-center gap-2"
                      >
                        <FileText size={16} /> .PDF
                      </button>
                      <button 
                        onClick={handleExportMd}
                        className="px-4 py-2.5 bg-white border border-natural-border text-natural-accent rounded-lg font-semibold text-sm hover:bg-natural-bg transition-all flex items-center gap-2"
                      >
                        <FileUp size={16} /> .MD
                      </button>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {!report && !isLoading && (
            <div style={{ marginTop: 80, textAlign: 'center' }}>
              <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, display: 'block', margin: '0 auto 24px' }}>
                <circle cx="60" cy="60" r="50" fill="rgba(255,255,255,0.7)" stroke="rgba(255,107,107,0.2)" strokeWidth="1.5"/>
                <circle cx="50" cy="55" r="2.5" fill="#1d1d1b"/>
                <circle cx="70" cy="55" r="2.5" fill="#1d1d1b"/>
                <path d="M48 70 q12 8 24 0" fill="none" stroke="#1d1d1b" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p style={{ fontSize: 17, fontWeight: 600, color: '#4a4a47', margin: '0 0 6px' }}>
                {L("분석할 기업을 검색해 주세요", "Search for a company to analyze", "請搜尋要分析的企業")}
              </p>
              <p style={{ fontSize: 13.5, fontStyle: 'italic', color: '#6e6e6a', margin: 0 }}>
                {L("수집된 데이터를 기반으로 분석표를 자동 완성해 드립니다.", "We'll auto-fill the analysis based on collected data.", "我們將根據收集的數據自動填寫分析表。")}
              </p>
            </div>
          )}
        </div>
        )}

        {activeNav === "history" && (
          <HistoryView language={language} onLoadReport={(rep, term) => {
            setReport(rep);
            setSearchTerm(term);
            setActiveNav("dashboard");
          }} />
        )}

        {activeNav === "settings" && <SettingsView language={language} />}

        {activeNav === "templates" && (
          <TemplatesView language={language} onManualStart={() => {
            handleManualStart();
            setActiveNav("dashboard");
          }} />
        )}
      </main>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: any, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 12px', borderRadius: 12,
        fontSize: 14.5, fontWeight: isActive ? 600 : 500,
        color: isActive ? '#FF6B6B' : '#4a4a47',
        cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
        background: isActive ? 'rgba(255,255,255,0.85)' : 'transparent',
        boxShadow: isActive ? '0 4px 14px -8px rgba(255,107,107,0.3)' : 'none',
        border: 'none', width: '100%', textAlign: 'left',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ color: isActive ? '#FF6B6B' : '#6e6e6a', flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  );
}

function Card({ title, children, extra }: { title: string, children: React.ReactNode, extra?: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(24px) saturate(160%)',
      WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      border: '1px solid rgba(255,255,255,0.85)',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 10px 40px -16px rgba(180,50,50,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
    }}>
      <div style={{ padding: '12px 20px', background: 'rgba(255,107,107,0.04)', borderBottom: '1px solid rgba(29,29,27,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, color: '#6e6e6a', margin: 0 }}>{title}</h2>
        {extra}
      </div>
      {children}
    </div>
  );
}

function TableRow({ label, value, isLoading, isTextArea = false, className, onChange }: { label: string, value?: string, isLoading: boolean, isTextArea?: boolean, className?: string, onChange: (v: string) => void }) {
  return (
    <div className={cn("grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr_100px] items-start", className)}>
      <div className="p-3 bg-[#FAF9F7]/50 font-semibold text-xs border-r border-natural-border h-full flex items-center text-natural-accent">
        {label}
      </div>
      <div className="p-2 relative group border-r border-natural-border/30 md:border-r">
        {isLoading ? (
          <div className="h-4 bg-natural-sidebar animate-pulse rounded w-3/4 m-2" />
        ) : (
          <>
            {isTextArea ? (
              <textarea
                className="w-full px-3 py-2 rounded-lg bg-transparent border border-transparent focus:bg-[#F7F5F0] focus:border-natural-border outline-none transition-all min-h-[60px] text-sm leading-relaxed resize-none overflow-hidden"
                value={value || ""}
                ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                onChange={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                  onChange(e.target.value);
                }}
              />
            ) : (
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg bg-transparent border border-transparent focus:bg-[#F7F5F0] focus:border-natural-border outline-none transition-all text-sm"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
              />
            )}
            {value && <span className="absolute top-2 right-2 bg-[#E9EDC9] text-[#606C38] px-1.5 py-0.5 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">AI</span>}
          </>
        )}
      </div>
      <div className="p-3 hidden md:flex h-full items-center justify-center">
        <button 
          onClick={() => onChange("")}
          className="px-3 py-1.5 bg-[#F7F5F0] border border-natural-border rounded-lg text-[10px] text-natural-accent font-bold cursor-pointer hover:bg-white transition-all flex items-center gap-1"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function FinancialRow({ label, field, financials, isLoading, onUpdate }: { label: string, field: keyof FinancialIndicator, financials?: FinancialIndicator[], isLoading: boolean, onUpdate: (idx: number, val: string) => void }) {
  return (
    <tr>
      <td className="p-3 bg-[#FAF9F7]/50 font-semibold text-xs border-r border-natural-border text-natural-accent">{label}</td>
      {isLoading ? (
        [1, 2, 3].map(i => <td key={i} className="p-3 animate-pulse"><div className="h-4 w-20 bg-natural-sidebar rounded" /></td>)
      ) : (
        financials?.map((f, i) => (
          <td key={i} className="p-2 border-r border-natural-border/30">
            <input
              className="w-full px-2 py-1.5 bg-transparent border border-transparent focus:bg-[#F7F5F0] focus:border-natural-border rounded-lg outline-none font-mono text-sm transition-all"
              value={f[field] as string}
              onChange={(e) => onUpdate(i, e.target.value)}
            />
          </td>
        ))
      )}
      <td className="p-3">
        {isLoading ? (
          <div className="h-4 bg-natural-sidebar animate-pulse rounded w-16" />
        ) : (
           <div className="flex items-center gap-2 bg-[#F7F5F0] px-3 py-2 rounded-lg border border-natural-border/50">
             <input
               className="w-full bg-transparent border-none outline-none text-[10px] text-natural-accent font-medium"
               placeholder="옵션 분석"
               value={financials?.[0]?.notes || "데이터 기준▼"}
               onChange={(e) => onUpdate(0, e.target.value)}
             />
           </div>
        )}
      </td>
    </tr>
  );
}
