"use client";

/**
 * Port of the real admin Insights page (`admin/app/(admin)/insights/page.tsx`).
 * Layout: Hours & submissions trend → queue age / decisions →
 * three donuts → US heatmap. `sessions` comes from the `insights`/`analytics`
 * routes via `loadLiveSessions`, with page-level empty→`resolveInsightsFixtures`
 * (relative-dated sessions + SampleDataBanner). Sessions/Users loaders stay empty-real.
 */

import { Suspense } from "react";
import {
  buildQueueAgeBars,
  buildTrendSeries,
  buildDecisionBars,
  buildGeoActivity,
  formatDuration,
  type MockSession,
} from "@/lib/mock-data";
import { PeriodToggle } from "@/components/ui/PeriodToggle";
import { PageStickyHeader } from "@/components/ui/PageStickyHeader";
import { usePeriodLabel, usePeriodSelection } from "@/components/ui/PeriodToggleBar";
import { filterByPeriod } from "@/lib/dashboard-period";
import { TrendAreaChart } from "@/components/ui/TrendAreaChart";
import { HorizontalBarChart } from "@/components/ui/HorizontalBarChart";
import { DonutChart } from "@/components/ui/DonutChart";
import { UsHeatmap } from "@/components/dashboard/UsHeatmap";
import { SampleDataBanner } from "@/components/ui/SampleDataBanner";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { downloadCsv, openPrintablePdf } from "@/lib/export-download";

const ACTIVITY_COLORS = ["#007536", "#5a8f3a", "#835400", "#3d8f5c", "#6e7a6c"];

export function AnalyticsPage({
  sessions = [],
  realSessions,
  isMock = false,
}: {
  sessions?: MockSession[];
  /** Never-mocked live sessions - feeds the US activity map so it never shows fixture data,
   *  even when `sessions` falls back to demo fixtures for the rest of the page. Defaults to
   *  `sessions` for callers that haven't wired a real-only source yet. */
  realSessions?: MockSession[];
  isMock?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto">
          <div className="h-11 w-full bg-bg-surface-elevated rounded-sm animate-pulse mb-lg" />
        </div>
      }
    >
      <AnalyticsPageInner sessions={sessions} realSessions={realSessions ?? sessions} isMock={isMock} />
    </Suspense>
  );
}

function AnalyticsPageInner({
  sessions,
  realSessions,
  isMock,
}: {
  sessions: MockSession[];
  realSessions: MockSession[];
  isMock: boolean;
}) {
  const now = new Date();
  const selection = usePeriodSelection();
  const periodLabelText = usePeriodLabel(now);

  // Filter sessions by the selected period
  const filteredSessions = filterByPeriod(sessions, selection, now);
  // Map-only: real sessions, never the mock/fixture fallback used for the other charts.
  const mapSessions = filterByPeriod(realSessions, selection, now);

  const underReview = filteredSessions.filter((s) => s.status === "under_review");
  const approved = filteredSessions.filter((s) => s.status === "approved");
  const declined = filteredSessions.filter((s) => s.status === "not_approved");
  const totalSessions = filteredSessions.length;

  const statusSlices = [
    { name: "Approved", value: approved.length, color: "#007536" },
    { name: "Under Review", value: underReview.length, color: "#fcab29" },
    { name: "Declined", value: declined.length, color: "#ba1a1a" },
  ].filter((s) => s.value > 0);

  const activityMap: Record<string, number> = {};
  for (const s of filteredSessions) {
    const key = s.activity?.trim() || "Other";
    activityMap[key] = (activityMap[key] ?? 0) + 1;
  }
  const sortedActivities = Object.entries(activityMap).sort((a, b) => b[1] - a[1]);
  const topActivities = sortedActivities.slice(0, 4);
  const otherCount = sortedActivities.slice(4).reduce((sum, [, v]) => sum + v, 0);
  const activitySlices = [
    ...topActivities.map(([name, value], i) => ({
      name,
      value,
      color: ACTIVITY_COLORS[i] ?? "#6e7a6c",
    })),
    ...(otherCount > 0 ? [{ name: "Other", value: otherCount, color: "#6e7a6c" }] : []),
  ];

  const courtOrdered = approved.filter((s) => s.court_ordered).length;
  const voluntary = approved.length - courtOrdered;
  const courtSlices = [
    { name: "Voluntary", value: voluntary, color: "#007536" },
    { name: "Court-ordered", value: courtOrdered, color: "#835400" },
  ].filter((s) => s.value > 0);

  const exportColumns = [
    { key: "id", label: "id" },
    { key: "volunteer", label: "volunteer" },
    { key: "activity", label: "activity" },
    { key: "status", label: "status" },
    { key: "duration", label: "duration" },
    { key: "court_ordered", label: "court_ordered" },
    { key: "created_at", label: "created_at" },
  ];
  const exportRows = filteredSessions.map((s) => ({
    id: s.id,
    volunteer: s.volunteer_name,
    activity: s.activity ?? "",
    status: s.status,
    duration: formatDuration(s.duration_seconds, s.adjusted_hours),
    court_ordered: s.court_ordered ? "yes" : "no",
    created_at: s.created_at,
  }));

  return (
    <div>
      <PageStickyHeader>
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-md">
          <div className="flex items-start justify-between gap-md flex-wrap">
            <div>
              <h1 className="font-heading text-[28px] sm:text-[32px] leading-[36px] sm:leading-[40px] text-text-primary">
                Insights
              </h1>
              <p className="mt-xs font-body text-[14px] text-text-tertiary">{periodLabelText}</p>
            </div>
            <ExportMenu
              onExportCsv={() => downloadCsv("insights-export", exportColumns, exportRows)}
              onExportPdf={() =>
                openPrintablePdf(`Insights export · ${periodLabelText}`, exportColumns, exportRows)
              }
            />
          </div>
          <PeriodToggle selection={selection} />
        </div>
      </PageStickyHeader>
      <div className="max-w-6xl mx-auto">

      {isMock && <SampleDataBanner />}

      <div className="flex flex-col gap-md">
        <TrendAreaChart
          title="Hours & submissions"
          subtitle={periodLabelText}
          data={buildTrendSeries(filteredSessions)}
          index={0}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <HorizontalBarChart
            title="How long sessions wait"
            subtitle="Under review, by age"
            data={buildQueueAgeBars(underReview, now)}
            emptyLabel="No sessions waiting for review"
            index={1}
          />
          <HorizontalBarChart
            title="Decisions"
            data={buildDecisionBars(filteredSessions)}
            index={2}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
          <DonutChart title="Session Status" data={statusSlices} total={totalSessions} index={4} />
          <DonutChart title="Activity Types" data={activitySlices} total={totalSessions} index={5} />
          <DonutChart
            title="Approved - Session Type"
            data={courtSlices}
            total={courtOrdered + voluntary}
            index={6}
          />
        </div>
        <UsHeatmap activity={buildGeoActivity(mapSessions)} periodLabel={periodLabelText} />
      </div>
      </div>
    </div>
  );
}
