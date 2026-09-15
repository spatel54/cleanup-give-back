"use client";

/**
 * Faithful port of `admin/app/(admin)/feedback/page.tsx` + `FeedbackRow.tsx`.
 *
 * `feedback` is fetched live from the shared Supabase `volunteer_feedback`
 * table by `admin-web-app/src/app/feedback/page.tsx` (see `@/lib/live-data`),
 * falling back to `MOCK_FEEDBACK` when that table has no rows yet. PeriodToggle
 * scopes KPIs, distribution, list, and export via `filterByListPeriod` on
 * `submittedAt` (Month = rolling last 30 days).
 */
import { Suspense, useState } from "react";
import { EMOJI_MAP, MOCK_FEEDBACK, type FeedbackEntry } from "@/lib/mock-data";
import { PeriodToggle } from "@/components/ui/PeriodToggle";
import { PageStickyHeader } from "@/components/ui/PageStickyHeader";
import { useListPeriodLabel, usePeriodSelection } from "@/components/ui/PeriodToggleBar";
import { SampleDataBanner } from "@/components/ui/SampleDataBanner";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { downloadCsv, openPrintablePdf } from "@/lib/export-download";
import { filterByListPeriod } from "@/lib/dashboard-period";

const RATING_ORDER = ["excited", "happy", "neutral", "sad", "very_sad"] as const;
type RatingKey = (typeof RATING_ORDER)[number];
type RatingFilter = "all" | RatingKey;

const RATING_FILTERS: { value: RatingFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...RATING_ORDER.map((key) => ({
    value: key,
    label: `${EMOJI_MAP[key].emoji} ${EMOJI_MAP[key].label}`,
  })),
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function FeedbackRow({ feedback: fb }: { feedback: FeedbackEntry }) {
  const meta = EMOJI_MAP[fb.rating];
  return (
    <div
      className={`bg-bg-surface border rounded-md p-lg ${
        fb.flagged ? "border-[#ba1a1a]/40 bg-[#ffd9de]/20" : "border-border-outline"
      }`}
    >
      <div className="flex items-start justify-between gap-md">
        <div className="flex items-center gap-sm">
          <span className="text-xl" title={meta?.label}>
            {meta?.emoji}
          </span>
          <div>
            <p className="font-body text-[14px] font-semibold text-text-primary">{fb.volunteer}</p>
            <p className="font-data text-[12px] text-text-tertiary">
              {fb.activity} · {formatTime(fb.submittedAt)}
            </p>
          </div>
        </div>
        {fb.flagged ? (
          <span className="font-data text-[11px] font-semibold px-sm py-xs rounded-sm bg-[#ffd9de] text-[#ba1a1a]">
            Flagged
          </span>
        ) : null}
      </div>
      {fb.comment && (
        <p className="font-body text-[14px] text-text-primary mt-md pl-[calc(1.25rem+8px)] border-l-2 border-border-outline ml-[10px]">
          {fb.comment}
        </p>
      )}
    </div>
  );
}

export function FeedbackPage({
  feedback = MOCK_FEEDBACK,
  isMock = false,
}: {
  feedback?: FeedbackEntry[];
  isMock?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto">
          <div className="h-11 w-full bg-bg-surface-elevated rounded-sm animate-pulse mb-lg" />
        </div>
      }
    >
      <FeedbackPageInner feedback={feedback} isMock={isMock} />
    </Suspense>
  );
}

function FeedbackPageInner({ feedback, isMock }: { feedback: FeedbackEntry[]; isMock: boolean }) {
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const selection = usePeriodSelection();
  const rangeLabel = useListPeriodLabel();

  const periodScoped = filterByListPeriod(feedback, selection);

  const avg =
    periodScoped.length > 0
      ? periodScoped.reduce((sum, f) => sum + (EMOJI_MAP[f.rating]?.score ?? 0), 0) / periodScoped.length
      : 0;
  const distribution = RATING_ORDER.map((key) => {
    const val = EMOJI_MAP[key];
    const count = periodScoped.filter((f) => f.rating === key).length;
    return {
      ...val,
      key,
      count,
      pct: periodScoped.length > 0 ? Math.round((count / periodScoped.length) * 100) : 0,
    };
  });
  const maxCount = Math.max(0, ...distribution.map((d) => d.count));
  const flagged = periodScoped.filter((f) => f.flagged).length;

  const filtered =
    ratingFilter === "all" ? periodScoped : periodScoped.filter((f) => f.rating === ratingFilter);

  const emptyMessage =
    periodScoped.length === 0
      ? `No feedback in ${rangeLabel}.`
      : "No feedback matches this rating.";

  const exportColumns = [
    { key: "volunteer", label: "volunteer" },
    { key: "rating", label: "rating" },
    { key: "activity", label: "activity" },
    { key: "comment", label: "comment" },
    { key: "flagged", label: "flagged" },
    { key: "submittedAt", label: "submitted_at" },
  ];
  const exportRows = filtered.map((f) => ({
    volunteer: f.volunteer,
    rating: EMOJI_MAP[f.rating]?.label ?? f.rating,
    activity: f.activity,
    comment: f.comment ?? "",
    flagged: f.flagged ? "yes" : "no",
    submittedAt: f.submittedAt,
  }));

  return (
    <div>
      <PageStickyHeader>
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-md">
          <div className="flex items-start justify-between gap-md flex-wrap">
            <div>
              <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Feedback</h1>
              <p className="mt-xs font-body text-[14px] text-text-tertiary">
                Volunteer ratings and comments for {rangeLabel}.
              </p>
            </div>
            <ExportMenu
              onExportCsv={() => downloadCsv("feedback-export", exportColumns, exportRows)}
              onExportPdf={() => openPrintablePdf("Feedback export", exportColumns, exportRows)}
            />
          </div>
          <PeriodToggle selection={selection} />
        </div>
      </PageStickyHeader>
      <div className="max-w-5xl mx-auto">

      {isMock && <SampleDataBanner />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
        <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
          <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">Avg Rating</p>
          <p className="font-data text-[28px] font-semibold text-primary">
            {avg.toFixed(1)}
            <span className="text-[16px] text-text-tertiary font-normal">/5</span>
          </p>
        </div>
        <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
          <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">Total</p>
          <p className="font-data text-[28px] font-semibold text-text-primary">{periodScoped.length}</p>
        </div>
        <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
          <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">Flagged</p>
          <p className={`font-data text-[28px] font-semibold ${flagged > 0 ? "text-[#ba1a1a]" : "text-text-primary"}`}>
            {flagged}
          </p>
        </div>
        <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
          <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">With Comment</p>
          <p className="font-data text-[28px] font-semibold text-text-primary">
            {periodScoped.filter((f) => f.comment).length}
          </p>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md p-lg mb-xl">
        <p className="font-data text-[12px] tracking-[0.96px] uppercase text-text-tertiary mb-md">
          Rating Distribution
        </p>
        <div className="grid grid-cols-5 gap-md">
          {distribution.map((d) => {
            const barPct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
            const selected = ratingFilter === d.key;
            return (
              <button
                key={d.key}
                type="button"
                aria-pressed={selected}
                onClick={() => setRatingFilter(selected ? "all" : d.key)}
                className={`flex flex-col items-center gap-xs min-w-0 rounded-md p-xs -m-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                  selected ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-bg-app"
                }`}
                title={selected ? `Clear ${d.label} filter` : `Show ${d.label} only`}
              >
                <span className="text-xl sm:text-2xl" aria-hidden>
                  {d.emoji}
                </span>
                <div
                  className="w-full max-w-[40px] h-16 flex flex-col justify-end rounded-sm bg-bg-app overflow-hidden"
                  aria-hidden
                >
                  <div
                    className="w-full rounded-sm transition-[height]"
                    style={{
                      height: `${Math.max(d.count > 0 ? 8 : 0, barPct)}%`,
                      backgroundColor: d.color,
                      opacity: d.count > 0 ? 0.85 : 0.2,
                    }}
                  />
                </div>
                <span className="font-data text-[16px] sm:text-[18px] font-semibold text-text-primary">
                  {d.count}
                </span>
                <span className="font-data text-[10px] text-text-tertiary">{d.pct}%</span>
                <span className="font-data text-[9px] sm:text-[10px] text-text-tertiary text-center leading-tight">
                  {d.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-sm mb-lg lg:flex-row lg:flex-wrap lg:items-center">
        <div className="flex items-center gap-xs min-w-0 max-w-full overflow-x-auto pb-0.5" role="group" aria-label="Filter by rating">
          {RATING_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={ratingFilter === f.value}
              onClick={() => setRatingFilter(f.value)}
              className={`h-11 shrink-0 inline-flex items-center px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors ${
                ratingFilter === f.value
                  ? "bg-primary text-white border-primary"
                  : "bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="lg:ml-auto font-body text-[14px] text-text-tertiary self-start lg:self-center shrink-0">
          {filtered.length} response{filtered.length !== 1 ? "s" : ""}
          {ratingFilter !== "all" ? ` · ${EMOJI_MAP[ratingFilter].label}` : ""}
        </span>
      </div>

      <div className="flex flex-col gap-sm">
        {filtered.length === 0 ? (
          <p className="px-lg py-xl text-center font-body text-base text-text-tertiary border border-border-outline rounded-md bg-bg-surface">
            {emptyMessage}
          </p>
        ) : (
          filtered.map((fb) => <FeedbackRow key={fb.id} feedback={fb} />)
        )}
      </div>
      </div>
    </div>
  );
}
