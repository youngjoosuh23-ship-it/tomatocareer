import { AnalysisResponse, ComparisonResult, UserBackground } from '../types';

export interface CareerHistoryItem {
  id: string;
  timestamp: number;
  analyses: AnalysisResponse[];
  comparison?: ComparisonResult;
  background?: UserBackground;
}

const KEY = 'career_copilot_history';

export function saveToHistory(analyses: AnalysisResponse[], comparison?: ComparisonResult, background?: UserBackground) {
  const history = loadHistory();
  const item: CareerHistoryItem = {
    id: Math.random().toString(36).slice(2, 11),
    timestamp: Date.now(),
    analyses,
    comparison,
    background,
  };
  history.unshift(item);
  if (history.length > 30) history.pop();
  localStorage.setItem(KEY, JSON.stringify(history));
  return item.id;
}

export function loadHistory(): CareerHistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function deleteHistoryItem(id: string) {
  const updated = loadHistory().filter(h => h.id !== id);
  localStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}
