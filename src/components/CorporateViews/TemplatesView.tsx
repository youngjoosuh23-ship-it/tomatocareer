import { FileSpreadsheet, PlusCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

type Lang = 'ko' | 'en' | 'zh';

function downloadExcelTemplate(language: Lang) {
  const L = (ko: string, en: string, zh: string) => language === 'ko' ? ko : language === 'zh' ? zh : en;

  const wb = XLSX.utils.book_new();

  const companySheet = [
    [L("회사 개요", "Company Overview", "公司概覽"), ""],
    [L("항목", "Item", "項目"), L("내용", "Value", "內容")],
    [L("회사명", "Company Name", "公司名稱"), ""],
    [L("상장 거래소", "Stock Exchange", "上市交易所"), ""],
    [L("종목코드", "Ticker Symbol", "股票代碼"), ""],
    [L("업종", "Industry", "行業"), ""],
    [L("설립연도", "Founded Year", "成立年份"), ""],
    [L("임직원 수", "Employees", "員工人數"), ""],
    [L("본사 위치", "HQ Location", "總部位置"), ""],
    [L("주요 사업", "Main Business", "主要業務"), ""],
  ];

  const financialSheet = [
    [L("재무 데이터", "Financial Data", "財務數據"), ""],
    [L("항목", "Item", "項目"), "2022", "2023", "2024"],
    [L("매출액 (억원)", "Revenue (100M KRW)", "營收（億韓元）"), "", "", ""],
    [L("영업이익 (억원)", "Operating Income (100M KRW)", "營業利益（億韓元）"), "", "", ""],
    [L("순이익 (억원)", "Net Income (100M KRW)", "淨利潤（億韓元）"), "", "", ""],
    [L("영업이익률 (%)", "Operating Margin (%)", "營業利益率（%）"), "", "", ""],
    [L("부채비율 (%)", "Debt Ratio (%)", "負債比率（%）"), "", "", ""],
    [L("시가총액 (억원)", "Market Cap (100M KRW)", "市值（億韓元）"), "", "", ""],
  ];

  const ratingSheet = [
    [L("평가 지표", "Evaluation Metrics", "評估指標"), ""],
    [L("항목", "Item", "項目"), L("점수 (1-10)", "Score (1-10)", "分數（1-10）"), L("메모", "Notes", "備註")],
    [L("재무 건전성", "Financial Health", "財務健康"), "", ""],
    [L("성장 잠재력", "Growth Potential", "成長潛力"), "", ""],
    [L("경영진 역량", "Management Quality", "管理層能力"), "", ""],
    [L("기업 문화", "Corporate Culture", "企業文化"), "", ""],
    [L("복지/처우", "Benefits/Compensation", "福利/薪酬"), "", ""],
    [L("워라밸", "Work-Life Balance", "工作生活平衡"), "", ""],
    [L("기술력/R&D", "Technology/R&D", "技術/研發"), "", ""],
    [L("시장 지위", "Market Position", "市場地位"), "", ""],
  ];

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(companySheet), L("회사 개요", "Overview", "公司概覽"));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(financialSheet), L("재무 데이터", "Financials", "財務數據"));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ratingSheet), L("평가 지표", "Evaluation", "評估指標"));

  XLSX.writeFile(wb, `corporate-analysis-template.xlsx`);
}

export function TemplatesView({ onManualStart, language = 'ko' }: { onManualStart: () => void; language?: Lang }) {
  const L = (ko: string, en: string, zh: string) => language === 'ko' ? ko : language === 'zh' ? zh : en;

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-natural-text">{L("데이터 템플릿 관리", "Template Management", "數據模板管理")}</h2>
        <p className="text-natural-muted mt-1">{L("기업 분석을 위한 양식을 직접 작성하거나 엑셀 템플릿을 다운로드하세요.", "Start a new analysis form or download an Excel template to fill in offline.", "直接填寫企業分析表單，或下載 Excel 模板離線填寫。")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={onManualStart}
          className="bg-white p-6 rounded-2xl border-2 border-dashed border-natural-border hover:border-natural-accent cursor-pointer transition-all flex flex-col items-center justify-center gap-4 text-center group h-48"
        >
          <div className="w-12 h-12 bg-natural-bg rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <PlusCircle size={24} className="text-natural-accent" />
          </div>
          <div>
            <h3 className="font-bold text-natural-text">{L("앱에서 바로 작성하기", "Start with blank form", "在應用程式中直接填寫")}</h3>
            <p className="text-xs text-natural-muted mt-1">{L("앱 내에서 모든 지표를 직접 입력합니다.", "Manually enter all indicators directly in the app.", "在應用程式中手動輸入所有指標。")}</p>
          </div>
        </div>

        <div className="bg-[#FAF9F7] p-6 rounded-2xl border border-natural-border flex flex-col justify-center gap-4 h-48">
          <div>
            <h3 className="font-bold text-natural-text">{L("엑셀 템플릿 다운로드", "Download Excel Template", "下載 Excel 模板")}</h3>
            <p className="text-xs text-natural-muted mt-1">{L("엑셀에서 오프라인으로 작성 후 앱에 붙여넣을 수 있습니다.", "Fill it out in Excel, then paste values back into the app.", "在 Excel 中離線填寫後，可將數據貼回應用程式。")}</p>
          </div>
          <button
            onClick={() => downloadExcelTemplate(language)}
            className="w-full py-2 bg-white border border-natural-border rounded-lg text-sm font-semibold hover:bg-natural-bg flex items-center justify-center gap-2 text-natural-accent transition-colors"
          >
            <FileSpreadsheet size={16} /> {L("Excel 템플릿 다운로드 (.xlsx)", "Download Excel Template (.xlsx)", "下載 Excel 模板（.xlsx）")}
          </button>
        </div>
      </div>
    </div>
  );
}
