import type { NamedBar, TrendPoint } from '@/lib/dashboard-charts';
import type { FeedbackEmojiCount } from '@/components/ui/FeedbackEmojiStrip';
import type { GeoActivityBundle, NeighborhoodStats } from '@/lib/us-heatmap';

export type { GeoActivityBundle, NeighborhoodStats };

export type ReviewableSession = {
  id: string;
  user_id: string;
  volunteer_name: string;
  activity: string | null;
  court_ordered: boolean;
  created_at: string;
  ageLabel: string;
  status: string;
  duration_seconds: number | null;
  adjusted_hours: number | null;
  distance_miles: number | null;
  started_at: string | null;
};

export type DashboardKpi = {
  label: string;
  value: string | number;
  subtext?: string;
  accent?: boolean;
  href?: string;
  delta?: string | null;
  sparkline?: number[];
};

/** Compact composition for Today metric-tile MiniDonuts. */
export type MetricDonut = {
  slices: { value: number; color: string; label: string }[];
};

export type { FeedbackEmojiCount };

export type MetricVisuals = {
  waiting: MetricDonut;
  approved: MetricDonut;
  hours: MetricDonut;
  feedback: FeedbackEmojiCount[];
};

export type DonutPayload = {
  title: string;
  data: { name: string; value: number; color: string }[];
  total: number;
};

export type ChartExtras = {
  trend: TrendPoint[];
  queueAge: NamedBar[];
  decisions: NamedBar[];
  courtProgress: {
    name: string;
    completed: number;
    remaining: number;
    pct: number;
    status: string;
  }[];
};

export type CourtRiskItem = {
  id: string;
  name: string;
  requiredHours: number;
  completedHours: number;
  status: 'in_progress' | 'at_risk' | 'completed';
  dueDate: string;
};
