import {
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  parseISO,
  startOfWeek,
  differenceInCalendarDays,
} from 'date-fns';
import type { DashboardPeriod, PeriodSelection } from '@/lib/dashboard-period';
import { periodTrendGranularity } from '@/lib/dashboard-period';
import { computedHours } from '@/lib/format';

export type TrendPoint = {
  key: string;
  label: string;
  submissions: number;
  approvedHours: number;
  approved: number;
  declined: number;
};

export type NamedBar = {
  name: string;
  value: number;
  color: string;
};

type SessionLike = {
  status: string;
  created_at: string;
  ended_at?: string | null;
  started_at?: string | null;
  duration_seconds: number | null;
  adjusted_hours: number | null;
};

function sessionHours(s: SessionLike): number {
  return computedHours(s.duration_seconds, s.adjusted_hours);
}

function bucketKey(d: Date, granularity: 'day' | 'week'): string {
  return granularity === 'day' ? format(d, 'yyyy-MM-dd') : format(startOfWeek(d), 'yyyy-MM-dd');
}

function bucketLabel(d: Date, granularity: 'day' | 'week'): string {
  return granularity === 'day' ? format(d, 'MMM d') : format(startOfWeek(d), 'MMM d');
}

/**
 * Build a time series of submissions + approved hours for the selected period.
 * Day buckets for short windows; week buckets for longer ones.
 */
export function buildTrendSeries(
  sessions: SessionLike[],
  period: DashboardPeriod | PeriodSelection,
  now: Date,
  interval: { start: Date; end: Date } | null,
): TrendPoint[] {
  const selection: PeriodSelection =
    typeof period === 'string' ? { period, from: null, to: null } : period;
  const granularity = periodTrendGranularity(selection, interval);

  let start: Date;
  let end: Date;
  if (interval) {
    start = interval.start;
    end = interval.end;
  } else if (sessions.length === 0) {
    start = startOfWeek(now);
    end = now;
  } else {
    const times = sessions
      .map((s) => parseISO(s.ended_at ?? s.started_at ?? s.created_at).getTime())
      .filter((t) => Number.isFinite(t));
    start = new Date(Math.min(...times));
    end = now;
  }

  const anchors =
    granularity === 'day'
      ? eachDayOfInterval({ start, end })
      : eachWeekOfInterval({ start, end }, { weekStartsOn: 0 }).map((w) => startOfWeek(w));

  const map = new Map<string, TrendPoint>();
  for (const d of anchors) {
    const key = bucketKey(d, granularity);
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: bucketLabel(d, granularity),
        submissions: 0,
        approvedHours: 0,
        approved: 0,
        declined: 0,
      });
    }
  }

  for (const s of sessions) {
    const when = parseISO(s.ended_at ?? s.started_at ?? s.created_at);
    if (!Number.isFinite(when.getTime())) continue;
    if (when < start || when > end) continue;
    const key = bucketKey(when, granularity);
    let point = map.get(key);
    if (!point) {
      point = {
        key,
        label: bucketLabel(when, granularity),
        submissions: 0,
        approvedHours: 0,
        approved: 0,
        declined: 0,
      };
      map.set(key, point);
    }
    point.submissions += 1;
    if (s.status === 'approved') {
      point.approved += 1;
      point.approvedHours += sessionHours(s);
    } else if (s.status === 'not_approved' || s.status === 'invalid') {
      point.declined += 1;
    }
  }

  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/** Days under-review items have been waiting — backlog health ("How long sessions wait" chart). */
export function buildQueueAgeBars(
  underReview: { created_at: string }[],
  now = new Date(),
): NamedBar[] {
  const buckets = [
    { name: '≤1 day', min: 0, max: 1, color: '#007536', value: 0 },
    { name: '2–3 days', min: 2, max: 3, color: '#5a8f3a', value: 0 },
    { name: '4–7 days', min: 4, max: 7, color: '#835400', value: 0 },
    { name: '8+ days', min: 8, max: Infinity, color: '#ba1a1a', value: 0 },
  ];

  for (const s of underReview) {
    const days = Math.max(0, differenceInCalendarDays(now, parseISO(s.created_at)));
    const bucket = buckets.find((b) => days >= b.min && days <= b.max);
    if (bucket) bucket.value += 1;
  }

  return buckets.map(({ name, value, color }) => ({ name, value, color }));
}

/** Period decision mix — approved / declined / still in review (scoped). */
export function buildDecisionBars(scoped: SessionLike[]): NamedBar[] {
  const approved = scoped.filter((s) => s.status === 'approved').length;
  const declined = scoped.filter(
    (s) => s.status === 'not_approved' || s.status === 'invalid',
  ).length;
  const review = scoped.filter((s) => s.status === 'under_review').length;
  return [
    { name: 'Approved', value: approved, color: '#007536' },
    { name: 'Declined', value: declined, color: '#ba1a1a' },
    { name: 'Still reviewing', value: review, color: '#fcab29' },
  ].filter((b) => b.value > 0);
}

/** Court volunteer completion toward required hours. */
export function buildCourtProgressBars(
  volunteers: {
    name: string;
    requiredHours: number;
    completedHours: number;
    status: string;
  }[],
): { name: string; completed: number; remaining: number; pct: number; status: string }[] {
  return volunteers.map((v) => {
    const completed = Math.min(v.completedHours, v.requiredHours);
    const remaining = Math.max(0, v.requiredHours - v.completedHours);
    const pct = v.requiredHours > 0 ? Math.min(100, (v.completedHours / v.requiredHours) * 100) : 0;
    return {
      name: v.name,
      completed,
      remaining,
      pct,
      status: v.status,
    };
  });
}
