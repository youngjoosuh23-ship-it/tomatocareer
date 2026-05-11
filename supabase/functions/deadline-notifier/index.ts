// Supabase Edge Function — runs daily via cron schedule
// Setup:
//  1. Get a Resend API key at https://resend.com
//  2. supabase secrets set RESEND_API_KEY=re_xxxx
//  3. Deploy: supabase functions deploy deadline-notifier
//  4. Schedule: supabase functions schedule deadline-notifier --cron "0 0 * * *"
//
// Required DB table (run in Supabase SQL Editor):
//   create table deadlines (
//     id uuid primary key default gen_random_uuid(),
//     application_id text not null,
//     deadline date not null,
//     email text not null,
//     notified boolean default false,
//     created_at timestamptz default now()
//   );

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

async function sendEmail(to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'CareerCopilot <noreply@yourdomain.com>', to, subject, html }),
  });
}

Deno.serve(async () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const { data: deadlines, error } = await supabase
    .from('deadlines')
    .select('*')
    .eq('deadline', tomorrowStr)
    .eq('notified', false);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  for (const d of deadlines ?? []) {
    await sendEmail(
      d.email,
      '⏰ 내일 지원 마감일 알림 — CareerCopilot',
      `<p>안녕하세요,</p>
       <p>내일 <strong>${tomorrowStr}</strong>이 지원 마감일입니다.</p>
       <p>지금 바로 확인하고 지원을 완료하세요!</p>
       <p>— CareerCopilot</p>`
    );
    await supabase.from('deadlines').update({ notified: true }).eq('id', d.id);
  }

  return new Response(JSON.stringify({ sent: (deadlines ?? []).length }));
});
