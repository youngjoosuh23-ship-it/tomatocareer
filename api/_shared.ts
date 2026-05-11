import { GoogleGenAI } from "@google/genai";

export function createAI() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
}

export function getClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (!forwarded) return req.socket?.remoteAddress || 'unknown';
  const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return ips.split(',')[0].trim();
}

export async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable =
      error.status === 429 ||
      error.status === 503 ||
      error.message?.includes('429') ||
      error.message?.includes('503') ||
      error.message?.includes('RESOURCE_EXHAUSTED') ||
      error.message?.includes('Quota exceeded') ||
      error.message?.includes('UNAVAILABLE') ||
      error.message?.includes('high demand');
    if (retries > 0 && isRetryable) {
      const jitter = Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      return withRetry(fn, retries - 1, Math.min(delay * 1.5, 15000));
    }
    throw error;
  }
}

// ── Rate limiting ──────────────────────────────────────────────────────────
// Note: In-memory maps reset per serverless instance.
// For strict enforcement across instances, migrate to Vercel KV (Redis).

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_LIMIT = 5;

const minuteMap = new Map<string, { count: number; resetTime: number }>();
const dailyMap  = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string, dailyLimit: number): 'ok' | 'minute' | 'daily' {
  if (process.env.NODE_ENV === 'development') return 'ok';
  const now = Date.now();

  // Per-minute check
  const min = minuteMap.get(ip);
  if (!min || now > min.resetTime) {
    minuteMap.set(ip, { count: 1, resetTime: now + MINUTE_MS });
  } else if (min.count >= MINUTE_LIMIT) {
    return 'minute';
  } else {
    min.count++;
  }

  // Daily check
  const day = dailyMap.get(ip);
  if (!day || now > day.resetTime) {
    dailyMap.set(ip, { count: 1, resetTime: now + DAY_MS });
  } else if (day.count >= dailyLimit) {
    return 'daily';
  } else {
    day.count++;
  }

  return 'ok';
}
