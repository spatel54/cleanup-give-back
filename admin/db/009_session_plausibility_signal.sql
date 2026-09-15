-- Server-computed GPS/speed plausibility signal, stored at session finalize.
-- Client-submitted route/distance are trusted verbatim today (backend/sessions'
-- `/sessions/:id/finalize` handler only range-checks checkpoint lat/lng) — this
-- column stores a server-side computed signal (avg/max speed, sharp reversals,
-- tight-loop / idle-high-duration flags) so an admin has a trustworthy movement
-- signal to review, per docs/agents/session-abuse-checklist.md section 1.
--
-- Advisory only — never used to reject a finalize or gate a status transition.

alter table public.sessions
  add column if not exists plausibility_signal jsonb;

comment on column public.sessions.plausibility_signal is
  'Server-computed GPS/speed plausibility signal from finalize (see backend/sessions/src/lib/sessionPlausibility.ts). Advisory only, admin display.';
