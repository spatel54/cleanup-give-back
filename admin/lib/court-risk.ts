import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { CourtOrder } from '@/types/database';
import { computedHours } from '@/lib/format';
import { getVolunteerName, type VolunteerDirectory } from '@/lib/volunteers';
import type { CourtRiskItem } from '@/components/dashboard/types';

/** Due within this many days (with hours remaining) counts as at-risk, not just overdue. */
const AT_RISK_WINDOW_DAYS = 14;

type SessionLike = {
  user_id: string;
  status: string;
  court_ordered: boolean;
  duration_seconds: number | null;
  adjusted_hours: number | null;
};

/**
 * Court-ordered completion per volunteer against `court_orders.required_hours`.
 * Only approved sessions flagged `court_ordered` count toward the requirement —
 * voluntary hours don't reduce a court obligation.
 */
export function buildCourtRisk(
  courtOrders: CourtOrder[],
  sessions: SessionLike[],
  directory: VolunteerDirectory,
  now: Date,
): CourtRiskItem[] {
  const completedHoursByUser = new Map<string, number>();
  for (const s of sessions) {
    if (s.status !== 'approved' || !s.court_ordered) continue;
    const hours = computedHours(s.duration_seconds, s.adjusted_hours);
    completedHoursByUser.set(s.user_id, (completedHoursByUser.get(s.user_id) ?? 0) + hours);
  }

  return courtOrders.map((order) => {
    const completedHours = completedHoursByUser.get(order.user_id) ?? 0;
    const remaining = Math.max(0, order.required_hours - completedHours);

    const daysUntilDue = order.due_date
      ? differenceInCalendarDays(parseISO(order.due_date), now)
      : null;
    const overdue = daysUntilDue != null && daysUntilDue < 0;
    const dueSoon = daysUntilDue != null && daysUntilDue <= AT_RISK_WINDOW_DAYS;

    let status: CourtRiskItem['status'];
    if (remaining <= 0) {
      status = 'completed';
    } else if (overdue || dueSoon) {
      status = 'at_risk';
    } else {
      status = 'in_progress';
    }

    return {
      id: order.user_id,
      name: getVolunteerName(directory, order.user_id),
      requiredHours: order.required_hours,
      completedHours,
      status,
      dueDate: order.due_date ?? '',
    };
  });
}
