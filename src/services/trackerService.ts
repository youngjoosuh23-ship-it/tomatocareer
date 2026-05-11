import { AnalysisResponse } from '../types';

export type ApplicationStatus =
  | 'analyzed'
  | 'applied'
  | 'screening'
  | 'interview1'
  | 'interview2'
  | 'final'
  | 'offer'
  | 'rejected';

export interface ApplicationRecord {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  createdAt: number;
  updatedAt: number;
  deadline?: string;
  notes: string;
  analysis: AnalysisResponse;
}

const KEY = 'career_copilot_tracker';

export function loadApplications(): ApplicationRecord[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveApplication(analysis: AnalysisResponse): ApplicationRecord {
  const apps = loadApplications();
  const existing = apps.find(a => a.company === analysis.company && a.role === analysis.role);
  if (existing) return existing;

  const record: ApplicationRecord = {
    id: Math.random().toString(36).slice(2, 11),
    company: analysis.company,
    role: analysis.role,
    status: 'analyzed',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    notes: '',
    analysis,
  };
  apps.unshift(record);
  localStorage.setItem(KEY, JSON.stringify(apps));
  return record;
}

export function updateApplication(id: string, patch: Partial<ApplicationRecord>): ApplicationRecord[] {
  const apps = loadApplications().map(a =>
    a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a
  );
  localStorage.setItem(KEY, JSON.stringify(apps));
  return apps;
}

export function deleteApplication(id: string): ApplicationRecord[] {
  const apps = loadApplications().filter(a => a.id !== id);
  localStorage.setItem(KEY, JSON.stringify(apps));
  return apps;
}
