import { Globe, Shield } from 'lucide-react';

type Lang = 'ko' | 'en' | 'zh';

export function SettingsView({ language = 'ko' }: { language?: Lang }) {
  const L = (ko: string, en: string, zh: string) => language === 'ko' ? ko : language === 'zh' ? zh : en;

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-natural-text">{L("설정", "Settings", "設定")}</h2>
        <p className="text-natural-muted mt-1">{L("기업 분석 앱의 동작 환경을 설정합니다.", "Configure the corporate analysis app settings.", "設定企業分析應用程式的運行環境。")}</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-natural-border shadow-sm space-y-6">
        <div className="flex items-start gap-3 p-4 bg-natural-bg rounded-xl border border-natural-border">
          <Shield size={18} className="text-natural-accent mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-natural-text">{L("서버 사이드 AI 처리", "Server-side AI Processing", "伺服器端 AI 處理")}</p>
            <p className="text-xs text-natural-muted mt-1">
              {L(
                "기업 분석은 서버에서 안전하게 처리됩니다. API 키를 직접 입력할 필요가 없습니다.",
                "Corporate analysis is securely processed on the server. No need to enter an API key.",
                "企業分析在伺服器上安全處理。無需直接輸入 API 金鑰。"
              )}
            </p>
          </div>
        </div>

        <div className="space-y-3 border-t border-natural-border pt-6">
          <label className="flex items-center gap-2 font-bold text-sm text-natural-accent">
            <Globe size={16} /> {L("언어 설정", "Language", "語言設定")}
          </label>
          <p className="text-xs text-natural-muted">
            {L(
              "언어는 상단 헤더의 System / Content 스위처에서 변경하세요.",
              "Change language using the System / Content switcher in the top header.",
              "請使用頂部標頭的 System / Content 切換器更改語言。"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
