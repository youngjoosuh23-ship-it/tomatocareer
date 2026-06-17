import { ApplicationStatus } from '../services/trackerService';

export type CadenceStatus =
  | { type: 'waiting' }
  | { type: 'followup1' }
  | { type: 'followup2' }
  | { type: 'no_response' }
  | { type: 'inactive' };

const INACTIVE_STATUSES: ApplicationStatus[] = ['interview1', 'interview2', 'final', 'offer', 'rejected'];

export function getCadenceStatus(createdAt: number, status: ApplicationStatus): CadenceStatus {
  if (INACTIVE_STATUSES.includes(status)) return { type: 'inactive' };

  const days = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));

  if (days >= 21) return { type: 'no_response' };
  if (days >= 14) return { type: 'followup2' };
  if (days >= 7)  return { type: 'followup1' };
  return { type: 'waiting' };
}

export const CADENCE_LABEL: Record<string, { ko: string; en: string; zh: string; color: string }> = {
  waiting:     { ko: '대기 중',         en: 'Waiting',          zh: '等待中',    color: 'bg-slate-100 text-slate-500'   },
  followup1:   { ko: '🔔 1차 팔로업',    en: '🔔 Follow up',     zh: '🔔 追蹤',   color: 'bg-amber-100 text-amber-700'   },
  followup2:   { ko: '🔔 마지막 팔로업', en: '🔔 Last follow up', zh: '🔔 最後追蹤', color: 'bg-orange-100 text-orange-700' },
  no_response: { ko: '⚠️ 응답 없음',    en: '⚠️ No response',   zh: '⚠️ 無回應',  color: 'bg-rose-100 text-rose-600'     },
};
