import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { AnalysisResponse, ComparisonResult, UserBackground } from '../types';
import { ApplicationRecord } from './trackerService';
import { CareerHistoryItem } from './careerHistoryService';

// -------------------------------------------------------------------
// SETUP: Create a Supabase project at https://supabase.com and paste
// your project URL and anon key into .env.local:
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGci...
//
// Then run this SQL in the Supabase SQL Editor:
//
//   create table analyses (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid references auth.users not null,
//     created_at timestamptz default now(),
//     data jsonb not null
//   );
//   create table applications (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid references auth.users not null,
//     created_at timestamptz default now(),
//     updated_at timestamptz default now(),
//     data jsonb not null
//   );
//   alter table analyses enable row level security;
//   alter table applications enable row level security;
//   create policy "own rows" on analyses for all using (auth.uid() = user_id);
//   create policy "own rows" on applications for all using (auth.uid() = user_id);
// -------------------------------------------------------------------

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

let _client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (!_client) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

// Auth
export async function signInWithGoogle() {
  return getSupabase().auth.signInWithOAuth({ provider: 'google' });
}

export async function signOut() {
  return getSupabase().auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await getSupabase().auth.getUser();
  return data.user;
}

export function onAuthChange(cb: (user: User | null) => void) {
  return getSupabase().auth.onAuthStateChange((_e, session) => cb(session?.user ?? null));
}

// Analyses — save to cloud and sync to localStorage
export async function syncAnalysisToCloud(item: CareerHistoryItem) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('analyses').upsert({ id: item.id, user_id: user.id, data: item });
}

export async function loadAnalysesFromCloud(): Promise<CareerHistoryItem[]> {
  const { data, error } = await getSupabase()
    .from('analyses')
    .select('data')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.data as CareerHistoryItem);
}

// Applications — save to cloud
export async function syncApplicationToCloud(app: ApplicationRecord) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('applications').upsert({ id: app.id, user_id: user.id, updated_at: new Date().toISOString(), data: app });
}

export async function loadApplicationsFromCloud(): Promise<ApplicationRecord[]> {
  const { data, error } = await getSupabase()
    .from('applications')
    .select('data')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => r.data as ApplicationRecord);
}

// Benchmarking — anonymous fit score submission
export async function submitBenchmarkData(params: {
  company: string;
  role: string;
  fit_score: number;
  hiring_probability: number;
  decision: string;
  background_summary: string; // anonymized
}) {
  if (!isSupabaseConfigured) return;
  await getSupabase().from('benchmark').insert(params);
}

export async function fetchBenchmarkStats(company: string, role: string) {
  if (!isSupabaseConfigured) return null;
  const { data } = await getSupabase()
    .from('benchmark')
    .select('fit_score, hiring_probability')
    .ilike('company', `%${company}%`)
    .ilike('role', `%${role}%`);
  if (!data || data.length < 5) return null;
  const avgFit = Math.round(data.reduce((s: number, r: any) => s + r.fit_score, 0) / data.length);
  const avgHire = Math.round(data.reduce((s: number, r: any) => s + r.hiring_probability, 0) / data.length);
  return { count: data.length, avgFit, avgHire };
}

// Deadline notification data (used by edge function)
export async function saveDeadline(applicationId: string, deadline: string, email: string) {
  if (!isSupabaseConfigured) return;
  await getSupabase().from('deadlines').upsert({
    application_id: applicationId,
    deadline,
    email,
    notified: false,
  });
}

// User feedback — stored locally + synced to Supabase for personalization
// SQL:
//   create table user_feedback (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid references auth.users,
//     created_at timestamptz default now(),
//     company text not null,
//     role text not null,
//     fit_score int,
//     hiring_probability int,
//     ai_decision text,
//     user_decision text not null
//   );
//   alter table user_feedback enable row level security;
//   create policy "own rows" on user_feedback for all using (auth.uid() = user_id);

export interface UserFeedback {
  company: string;
  role: string;
  fit_score: number;
  hiring_probability: number;
  ai_decision: string;
  user_decision: 'apply' | 'skip' | 'not_interested';
  created_at: string;
}

export async function submitFeedback(feedback: Omit<UserFeedback, 'created_at'>) {
  const record: UserFeedback = { ...feedback, created_at: new Date().toISOString() };

  // Always save to localStorage (works without login)
  try {
    const existing: UserFeedback[] = JSON.parse(localStorage.getItem('career_feedback') ?? '[]');
    existing.unshift(record);
    localStorage.setItem('career_feedback', JSON.stringify(existing.slice(0, 500)));
  } catch {
    // storage full — ignore
  }

  // Sync to Supabase if logged in
  if (!isSupabaseConfigured) return;
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('user_feedback').insert({ ...record, user_id: user.id });
  } catch {
    // silent fail — localStorage is the source of truth
  }
}

export function loadLocalFeedback(): UserFeedback[] {
  try {
    return JSON.parse(localStorage.getItem('career_feedback') ?? '[]');
  } catch {
    return [];
  }
}
