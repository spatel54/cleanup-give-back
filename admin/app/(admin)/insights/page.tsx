import { Suspense } from 'react';
import { loadScopedDashboardData } from '@/lib/dashboard-data';
import { computeDashboardInsights } from '@/lib/dashboard-insights';
import { PeriodToggle } from '@/components/ui/PeriodToggle';
import { DonutChart } from '@/components/ui/DonutChart';
import { TrendAreaChart } from '@/components/ui/TrendAreaChart';
import { HorizontalBarChart } from '@/components/ui/HorizontalBarChart';
import { CourtProgressChart } from '@/components/ui/CourtProgressChart';
import { UsHeatmap } from '@/components/dashboard/UsHeatmap';

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const data = await loadScopedDashboardData(params);
  const insights = computeDashboardInsights({
    scoped: data.scoped,
    underReviewAll: data.underReviewAll,
    courtAtRisk: data.courtAtRisk,
    period: data.selection,
    now: data.now,
    interval: data.interval,
  });

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col gap-md mb-lg">
        <div>
          <h1 className="font-heading text-[32px] leading-[40px] text-text-primary">Insights</h1>
          <p className="mt-xs font-body text-[14px] text-text-tertiary">{data.periodLabelText}</p>
        </div>
        <Suspense fallback={<div className="h-11 w-full bg-bg-surface-elevated rounded-md animate-pulse" />}>
          <PeriodToggle selection={data.selection} />
        </Suspense>
      </header>

      <div className="flex flex-col gap-md">
        <TrendAreaChart
          title="Hours & submissions"
          subtitle={data.periodLabelText}
          data={insights.chartExtras.trend}
          index={0}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <HorizontalBarChart
            title="How long sessions wait"
            subtitle="Under review, by age"
            data={insights.chartExtras.queueAge}
            emptyLabel="No sessions waiting for review"
            index={1}
          />
          <HorizontalBarChart title="Decisions" data={insights.chartExtras.decisions} index={2} />
          <CourtProgressChart title="Court progress" data={insights.chartExtras.courtProgress} index={3} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {insights.donuts.map((d, i) => (
            <DonutChart key={d.title} title={d.title} data={d.data} total={d.total} index={i + 4} />
          ))}
        </div>
        <UsHeatmap
          activity={insights.geoActivity}
          periodLabel={data.periodLabelText}
          isMock={data.useMock}
        />
      </div>
    </div>
  );
}
