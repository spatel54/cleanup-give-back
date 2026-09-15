"use client";

/**
 * Faithful port of the real admin "Bento Today" Dashboard
 * (`admin/components/dashboard/DashboardWorkbench.tsx` + supporting UI:
 * `MiniDonut`, `FeedbackEmojiStrip`, `HorizontalBarChart`, `TrendAreaChart`,
 * `UsHeatmap`, `PaymentsPreviewCard`, `OrdersPreviewCard`).
 *
 * `sessions`/`orders`/`monthly`/`feedbackAvg` are fetched live from Supabase
 * by `admin-web-app/src/app/dashboard/page.tsx` (see `@/lib/live-data`), falling
 * back to the same mock fixtures admin uses when those tables are empty.
 * "Start"/"Review" open the same `SessionPreviewDrawer` used on `/sessions` for
 * approve/decline - one session at a time by design, no bulk-approve shortcut.
 * The queue search box is still non-functional (not wired up).
 */
import { Suspense, useState, type ReactNode, type HTMLAttributes } from "react";
import Link from "next/link";
import { CourtBadge } from "@/components/ui/CourtBadge";
import { Button } from "@/components/ui/Button";
import { MiniDonut, type MiniDonutSlice } from "@/components/ui/MiniDonut";
import { FeedbackEmojiStrip, type FeedbackEmojiCount } from "@/components/ui/FeedbackEmojiStrip";
import { QueueAgeCard } from "@/components/ui/QueueAgeCard";
import { TrendAreaChart } from "@/components/ui/TrendAreaChart";
import { PaymentsPreviewCard } from "@/components/ui/PaymentsPreviewCard";
import { OrdersPreviewCard } from "@/components/ui/OrdersPreviewCard";
import { UsHeatmap } from "@/components/dashboard/UsHeatmap";
import { PeriodToggle } from "@/components/ui/PeriodToggle";
import { PageStickyHeader } from "@/components/ui/PageStickyHeader";
import { usePeriodLabel, usePeriodSelection } from "@/components/ui/PeriodToggleBar";
import { SampleDataBanner } from "@/components/ui/SampleDataBanner";
import {
  MOCK_FEEDBACK,
  MOCK_FEEDBACK_AVG,
  MOCK_ORDERS,
  EMOJI_MAP,
  computedHours,
  buildTrendSeries,
  buildMockMonthlyRevenue,
  buildGeoActivity,
  formatDate,
  getSessionStatusConfig,
  type MockSession,
  type OrderRow,
  type MonthlyRevenuePoint,
  type FeedbackEntry,
} from "@/lib/mock-data";
import {
  filterByInterval,
  formatSignedDelta,
  inInterval,
  periodInterval,
  previousPeriodInterval,
  priorPeriodCaption,
} from "@/lib/dashboard-period";
import { SessionPreviewDrawer } from "@/components/ui/SessionPreviewDrawer";

const REVIEW_QUEUE_PREVIEW_LIMIT = 20;
const SESSIONS_REVIEW_HREF = "/sessions?period=all";

function sessionRecencyMs(session: MockSession): number {
  // Same order as `/sessions` (loadLiveSessions `created_at` desc).
  const ms = new Date(session.created_at).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function formatDurationShort(seconds: number | null, adjusted: number | null): string {
  if (adjusted != null) return `${adjusted.toFixed(1)}h`;
  if (!seconds) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function Bento({
  children,
  className = "",
  as: Tag = "div",
  ...rest
}: { children: ReactNode; className?: string; as?: "div" | "section" | "article" } & HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={`rounded-md border border-border-outline bg-bg-surface overflow-hidden ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

function MetricTile({
  label,
  value,
  hint,
  href,
  accent,
  donut,
  emojiStrip,
  delta,
  priorCaption,
}: {
  label: string;
  value: string | number;
  hint?: string | null;
  href: string;
  accent?: boolean;
  donut?: MiniDonutSlice[];
  emojiStrip?: FeedbackEmojiCount[];
  /** Signed change vs prior window, e.g. "+3". Null when no comparable prior. */
  delta?: string | null;
  /** e.g. "vs yesterday" - null when there is no prior window. */
  priorCaption?: string | null;
}) {
  const deltaTone =
    delta == null
      ? "text-text-tertiary"
      : delta.startsWith("+")
        ? "text-primary"
        : delta.startsWith("-")
          ? "text-[#ba1a1a]"
          : "text-text-tertiary";
  const caption = priorCaption ?? "No prior";

  return (
    <Bento as="article" className="h-full min-h-0">
      <Link
        href={href}
        className="flex h-full flex-col justify-between gap-sm p-md no-underline text-inherit hover:bg-bg-app/60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        aria-label={`${label}: ${value}${delta != null ? `, ${delta} ${caption}` : ""}`}
      >
        <p className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary">{label}</p>
        <div className="min-w-0">
          <div className="flex items-end justify-between gap-sm min-w-0">
            <p
              className={`font-data text-[22px] sm:text-[28px] leading-[28px] sm:leading-[34px] font-semibold shrink-0 ${accent ? "text-[#835400]" : "text-text-primary"}`}
            >
              {value}
            </p>
            {donut ? (
              <MiniDonut slices={donut} size={40} thickness={5} className="mb-0.5 shrink-0 sm:w-12 sm:h-12" />
            ) : emojiStrip ? (
              <FeedbackEmojiStrip counts={emojiStrip} className="mb-0.5 min-w-0 max-w-[5.5rem] sm:max-w-[7.5rem]" />
            ) : null}
          </div>
          {hint ? <p className="mt-xs font-body text-[12px] text-text-tertiary line-clamp-2">{hint}</p> : null}
        </div>
        <div className="flex items-baseline justify-between gap-sm">
          <p className={`font-data text-[13px] font-semibold tabular-nums ${deltaTone}`}>{delta ?? "-"}</p>
          <p className="font-data text-[11px] text-text-tertiary shrink-0">{caption}</p>
        </div>
      </Link>
    </Bento>
  );
}

export function DashboardPage({
  sessions = [],
  orders = MOCK_ORDERS,
  monthly: monthlyProp,
  feedback = MOCK_FEEDBACK,
  feedbackAvg = MOCK_FEEDBACK_AVG,
  isMock = false,
}: {
  sessions?: MockSession[];
  orders?: OrderRow[];
  monthly?: MonthlyRevenuePoint[];
  feedback?: FeedbackEntry[];
  feedbackAvg?: number;
  isMock?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto">
          <div className="h-11 w-full max-w-xl bg-bg-surface-elevated rounded-sm animate-pulse mb-lg" />
        </div>
      }
    >
      <DashboardPageInner
        sessions={sessions}
        orders={orders}
        monthly={monthlyProp ?? buildMockMonthlyRevenue()}
        feedback={feedback}
        feedbackAvg={feedbackAvg}
        isMock={isMock}
      />
    </Suspense>
  );
}

function avgFeedbackScore(rows: FeedbackEntry[]): number | null {
  if (rows.length === 0) return null;
  const sum = rows.reduce((acc, f) => acc + (EMOJI_MAP[f.rating]?.score ?? 0), 0);
  return sum / rows.length;
}

function DashboardPageInner({
  sessions,
  orders,
  monthly,
  feedback,
  feedbackAvg,
  isMock,
}: {
  sessions: MockSession[];
  orders: OrderRow[];
  monthly: MonthlyRevenuePoint[];
  feedback: FeedbackEntry[];
  feedbackAvg: number;
  isMock: boolean;
}) {
  const now = new Date();
  const selection = usePeriodSelection();
  const periodLabelText = usePeriodLabel(now);
  const interval = periodInterval(selection, now);
  const prevInterval = previousPeriodInterval(selection, now);
  const [courtOnlyFilter, setCourtOnlyFilter] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const queue = sessions.filter((s) => s.status === "under_review");
  const listSource = courtOnlyFilter ? sessions.filter((s) => s.court_ordered) : sessions;
  const scoped = filterByInterval(sessions, interval);
  const prevScoped = filterByInterval(sessions, prevInterval);
  const approved = scoped.filter((s) => s.status === "approved");
  const prevApproved = prevScoped.filter((s) => s.status === "approved");
  const totalApprovedHours = approved.reduce((sum, s) => sum + computedHours(s.duration_seconds, s.adjusted_hours), 0);
  const prevApprovedHours = prevApproved.reduce(
    (sum, s) => sum + computedHours(s.duration_seconds, s.adjusted_hours),
    0,
  );
  /** Prior open-queue proxy: still-waiting sessions that arrived in the prior window. */
  const priorOpenQueue = prevInterval
    ? queue.filter((s) => inInterval(s.created_at, prevInterval)).length
    : null;

  const feedbackInPeriod = filterByInterval(feedback, interval);
  const feedbackPrior = filterByInterval(feedback, prevInterval);
  const periodFeedbackAvg = avgFeedbackScore(feedbackInPeriod);
  const priorFeedbackAvg = avgFeedbackScore(feedbackPrior);
  const displayFeedbackAvg = periodFeedbackAvg ?? (feedback.length > 0 ? feedbackAvg : 0);

  const waitingDelta = prevInterval != null ? formatSignedDelta(queue.length, priorOpenQueue ?? 0) : null;
  const approvedDelta = prevInterval != null ? formatSignedDelta(approved.length, prevApproved.length) : null;
  const hoursDelta = prevInterval != null ? formatSignedDelta(totalApprovedHours, prevApprovedHours, 1) : null;
  const feedbackDelta =
    prevInterval != null && periodFeedbackAvg != null && priorFeedbackAvg != null
      ? formatSignedDelta(periodFeedbackAvg, priorFeedbackAvg, 1)
      : null;
  const priorCaption = priorPeriodCaption(selection);

  const visibleQueue = [...listSource]
    .sort((a, b) => sessionRecencyMs(b) - sessionRecencyMs(a))
    .slice(0, REVIEW_QUEUE_PREVIEW_LIMIT);
  const pendingToStart = [...queue].sort((a, b) => sessionRecencyMs(b) - sessionRecencyMs(a))[0] ?? null;
  const isFiltered = courtOnlyFilter;

  const waitingDonut: MiniDonutSlice[] = [{ value: Math.max(queue.length, 1), color: "#fcab29" }];
  const approvedDonut: MiniDonutSlice[] = [{ value: Math.max(approved.length, 1), color: "#007536" }];
  const hoursDonut: MiniDonutSlice[] = [{ value: Math.max(Math.round(totalApprovedHours), 1), color: "#5a8f3a" }];
  const feedbackEmojis: FeedbackEmojiCount[] = (["excited", "happy", "neutral", "sad", "very_sad"] as const).map(
    (key) => ({
      key,
      emoji: EMOJI_MAP[key].emoji,
      label: EMOJI_MAP[key].label,
      count: feedbackInPeriod.filter((f) => f.rating === key).length,
    }),
  );

  const hoursTrend = buildTrendSeries(scoped.length > 0 ? scoped : sessions);

  const paymentsThisMonthCents = monthly[monthly.length - 1]
    ? monthly[monthly.length - 1].donationsCents + monthly[monthly.length - 1].shopCents
    : 0;
  const openOrders = orders.filter((o) => o.status === "pending" || o.status === "paid" || o.status === "shipped");
  const ordersRevenueCents = orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.totalCents, 0);

  // Always real here (Dashboard/Sessions never fall back to fixtures) - the US map never
  // reflects demo data. Must respect the selected period - falling back to unscoped
  // `sessions` when the period has zero activity would silently show all-time counts
  // under a "Today" (or any other) period label.
  const mapSessions = scoped;
  const geoActivity = buildGeoActivity(mapSessions);

  return (
    <div>
      <PageStickyHeader>
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-md">
          <h1 className="font-heading text-[26px] sm:text-[32px] leading-[34px] sm:leading-[40px] text-text-primary">
            Welcome back!
          </h1>
          <PeriodToggle selection={selection} />
        </div>
      </PageStickyHeader>
      <div className="max-w-6xl mx-auto">

      {isMock && <SampleDataBanner />}

      {/* Bento grid - sibling columns share height so bottoms align */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md items-stretch">
        {/* Hero - Review */}
        <Bento as="section" aria-labelledby="bento-review-heading" className="flex h-full flex-col">
          <div className="px-lg pt-lg pb-md flex items-start justify-between gap-md">
            <div>
              <p className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary mb-xs">Needs you</p>
              <h2 id="bento-review-heading" className="font-heading text-[24px] leading-[30px] text-text-primary">
                {queue.length === 0
                  ? "All clear"
                  : isFiltered
                    ? `${listSource.filter((s) => s.status === "under_review").length} of ${queue.length}`
                    : `${queue.length} to review`}
              </h2>
            </div>
            {pendingToStart && (
              <Button
                type="button"
                className="min-h-11 shrink-0"
                onClick={() => setPreviewId(pendingToStart.id)}
              >
                Start
              </Button>
            )}
          </div>

          {sessions.length > 0 && (
            <div className="px-lg pb-md flex flex-wrap gap-sm">
              <div className="h-11 flex items-center px-md rounded-full border border-border-outline bg-bg-surface font-data text-[13px] text-text-tertiary w-full sm:w-56">
                Search the queue…
              </div>
              <button
                type="button"
                aria-pressed={courtOnlyFilter}
                onClick={() => setCourtOnlyFilter((v) => !v)}
                className={`h-11 shrink-0 inline-flex items-center px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                  courtOnlyFilter
                    ? "bg-primary text-white border-primary"
                    : "bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary"
                }`}
              >
                Court-ordered only
              </button>
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="px-lg pb-lg flex-1 flex items-center">
              <p className="font-body text-[14px] text-text-tertiary max-w-xs">
                Nothing waiting. New submissions will show up here.
              </p>
            </div>
          ) : listSource.length === 0 ? (
            <div className="px-lg pb-lg flex-1 flex items-center">
              <p className="font-body text-[14px] text-text-tertiary max-w-xs">
                No court-ordered sessions. Clear the filter to see all sessions.
              </p>
            </div>
          ) : (
            <>
              <ul
                role="list"
                className="flex-1 divide-y divide-border-outline border-t border-border-outline max-h-[420px] overflow-y-auto"
              >
                {visibleQueue.map((item) => {
                  const cfg = getSessionStatusConfig(item.status);
                  const canModerate = item.status === "under_review";
                  return (
                    <li key={item.id} className="px-lg py-md flex flex-col sm:flex-row sm:items-center gap-sm sm:gap-md">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-xs flex-wrap">
                          <Link
                            href={`/volunteers/${item.user_id}`}
                            className="font-body text-[14px] font-semibold text-text-primary truncate hover:text-primary hover:underline inline-block max-w-full"
                          >
                            {item.volunteer_name}
                          </Link>
                          {item.court_ordered && <CourtBadge className="shrink-0" />}
                          <span
                            className={`shrink-0 inline-flex items-center px-sm py-xs rounded-sm border font-data text-[10px] font-semibold uppercase tracking-[0.6px] ${cfg.className}`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <p className="font-body text-[12px] text-text-tertiary truncate">
                          {item.activity ?? "Cleanup"} · {formatDurationShort(item.duration_seconds, item.adjusted_hours)} ·{" "}
                          {formatDate(item.started_at)}
                        </p>
                      </div>
                      <div className="flex gap-xs shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          className="min-h-11"
                          aria-label={canModerate ? `Review ${item.volunteer_name}` : `View ${item.volunteer_name}`}
                          onClick={() => setPreviewId(item.id)}
                        >
                          {canModerate ? "Review" : "View"}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="px-lg py-md border-t border-border-outline">
                <Link
                  href={SESSIONS_REVIEW_HREF}
                  className="inline-flex w-full items-center justify-center min-h-11 px-lg rounded-sm border border-border-outline bg-bg-surface font-data text-base font-semibold text-text-primary no-underline hover:bg-bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  View more
                </Link>
              </div>
            </>
          )}
        </Bento>

        {/* Metric tiles - fill Review column height, equal cells */}
        <div className="grid grid-cols-2 grid-rows-2 gap-md h-full min-h-0">
          <MetricTile
            label="Waiting"
            value={queue.length}
            hint={queue.length > 0 ? "Open queue" : "Caught up"}
            href="/sessions?period=all"
            accent={queue.length > 0}
            donut={waitingDonut}
            delta={waitingDelta}
            priorCaption={priorCaption}
          />
          <MetricTile
            label="Approved"
            value={approved.length}
            hint={periodLabelText}
            href="/sessions?period=all"
            donut={approvedDonut}
            delta={approvedDelta}
            priorCaption={priorCaption}
          />
          <MetricTile
            label="Hours"
            value={totalApprovedHours.toFixed(1)}
            hint={prevInterval ? periodLabelText : "No prior period"}
            href="/sessions?period=all"
            donut={hoursDonut}
            delta={hoursDelta}
            priorCaption={priorCaption}
          />
          <MetricTile
            label="Feedback"
            value={displayFeedbackAvg > 0 ? displayFeedbackAvg.toFixed(1) : "-"}
            hint="Average rating"
            href="/feedback"
            emojiStrip={feedbackEmojis}
            delta={feedbackDelta}
            priorCaption={priorCaption}
          />
        </div>
      </div>

      {/* Backlog age + hours trend - how stale is the queue, then period activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md mt-md">
        <QueueAgeCard
          title="How long sessions wait"
          subtitle="Under review, by age - tap a row to see who is waiting"
          queue={queue}
          now={now}
          emptyLabel="No sessions waiting for review"
          index={0}
          onReview={setPreviewId}
        />
        <TrendAreaChart title="Hours & submissions" subtitle={periodLabelText} data={hoursTrend} index={1} />
      </div>

      <div className="grid grid-cols-1 gap-md mt-md">
        <UsHeatmap activity={geoActivity} periodLabel={periodLabelText} />
      </div>

      {/* Commerce preview - payments + orders at a glance, deeper detail on their own tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mt-md">
        <PaymentsPreviewCard totalCents={paymentsThisMonthCents} monthLabel="July 2026" monthly={monthly} />
        <OrdersPreviewCard
          openCount={openOrders.length}
          revenueCents={ordersRevenueCents}
          preview={orders.slice(0, 4)}
        />
      </div>

      <SessionPreviewDrawer
        session={sessions.find((s) => s.id === previewId) ?? null}
        open={previewId != null}
        isMock={isMock}
        onClose={() => setPreviewId(null)}
      />
      </div>
    </div>
  );
}