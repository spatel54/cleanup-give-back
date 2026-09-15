"use client";

/**
 * Faithful port of `admin/app/(admin)/sessions/page.tsx` + `SessionsClientShell.tsx`.
 * Period toggle matches Home / Orders / Payments (URL `period`/`from`/`to`).
 * Approve/decline (`under_review` rows) call the real `approveSession`/
 * `declineSession` server actions (`@/actions/sessions`) when live; in mock
 * mode they update local state only ("demo - not saved"), same as admin's
 * `SessionsClientShell` isMock branch - simplified to inline buttons + a
 * decline modal rather than admin's floating actions menu (no toast system
 * in web-app yet, so feedback is a small inline status line instead).
 *
 * `sessions` is fetched live from the shared Supabase `sessions` table by
 * `admin-web-app/src/app/sessions/page.tsx` (see `@/lib/live-data`). Empty
 * tables render an empty list - no fixture fallback. PeriodToggle scopes the
 * list via `filterByListPeriod` (`ended_at` → `started_at` → `created_at`;
 * Month = rolling last 30 days).
 */
import { Suspense, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CourtBadge } from "@/components/ui/CourtBadge";
import { ServiceTypeBadge } from "@/components/ui/ServiceTypeBadge";
import { shouldShowSessionServiceTypeBadge } from "@/components/ui/court-tag-styles";
import { PeriodToggle } from "@/components/ui/PeriodToggle";
import { PageStickyHeader } from "@/components/ui/PageStickyHeader";
import { useListPeriodLabel, usePeriodSelection } from "@/components/ui/PeriodToggleBar";
import { SessionPreviewDrawer } from "@/components/ui/SessionPreviewDrawer";
import { SampleDataBanner } from "@/components/ui/SampleDataBanner";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { downloadCsv, openPrintablePdf } from "@/lib/export-download";
import { approveSession, approveSessionsBulk, declineSession } from "@/actions/sessions";
import { resetCourtOrderHours } from "@/actions/courtOrders";
import { filterByListPeriod } from "@/lib/dashboard-period";
import {
  getSessionStatusConfig,
  formatDate,
  formatDuration,
  shortId,
  type MockSession,
  type SessionStatus,
} from "@/lib/mock-data";

// "active" (in-progress, not yet submitted) sessions are excluded at the query layer
// (see loadLiveSessions in @/lib/live-data) - no admin surface ever sees them, so no
// filter for that status here.
const STATUS_FILTERS: { value: "all" | SessionStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "not_approved", label: "Declined" },
];

export function SessionsPage({ sessions = [], isMock = false }: { sessions?: MockSession[]; isMock?: boolean }) {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto">
          <div className="h-11 w-full bg-bg-surface-elevated rounded-sm animate-pulse mb-lg" />
        </div>
      }
    >
      <SessionsPageInner sessions={sessions} isMock={isMock} />
    </Suspense>
  );
}

function SessionsPageInner({ sessions, isMock }: { sessions: MockSession[]; isMock: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("open");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | SessionStatus>("all");
  const [courtOnly, setCourtOnly] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [syncedOpenId, setSyncedOpenId] = useState<string | null>(null);
  const [localSessions, setLocalSessions] = useState(sessions);
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [feedback, setFeedback] = useState<{ id: string; message: string; kind: "success" | "error" } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isBulkPending, startBulkTransition] = useTransition();
  const selection = usePeriodSelection();
  const rangeLabel = useListPeriodLabel();

  function toggleCompareMode() {
    setCompareMode((prev) => !prev);
    setCompareIds([]);
  }

  function toggleCompareSelected(session: MockSession) {
    setCompareIds((prev) => {
      if (prev.includes(session.id)) return prev.filter((id) => id !== session.id);
      if (prev.length >= 2) return [prev[1], session.id];
      return [...prev, session.id];
    });
  }

  const compareSessionsPicked = compareIds
    .map((id) => localSessions.find((s) => s.id === id))
    .filter((s): s is MockSession => s != null);
  const compareSameVolunteer =
    compareSessionsPicked.length === 2 && compareSessionsPicked[0].user_id === compareSessionsPicked[1].user_id;

  function handleCompareGo() {
    if (compareIds.length !== 2 || !compareSameVolunteer) return;
    router.push(`/sessions/compare?a=${compareIds[0]}&b=${compareIds[1]}`);
  }

  useEffect(() => {
    setLocalSessions(sessions);
  }, [sessions]);

  // Bare /sessions (no period/from/to) redirects on the server; this catches
  // client-side PeriodToggle clears that strip query params without a reload.
  useEffect(() => {
    const hasPeriod = searchParams.has("period") || searchParams.has("from") || searchParams.has("to");
    if (hasPeriod) {
      return;
    }
    const qs = new URLSearchParams({ period: "all" });
    const open = searchParams.get("open");
    if (open) {
      qs.set("open", open);
    }
    router.replace(`/sessions?${qs.toString()}`);
  }, [router, searchParams]);

  // Deep link from Attention/Audit Log (`/sessions?open=<id>`) - there's no
  // `/sessions/[id]` route, so those pages link here and this opens the
  // preview drawer once the matching session is in `localSessions`. Adjusted
  // during render (not an effect) per this file's existing set-state-in-effect
  // convention - see docs/progress.md.
  if (openId && openId !== syncedOpenId && localSessions.some((s) => s.id === openId)) {
    setSyncedOpenId(openId);
    setPreviewId(openId);
  }

  useEffect(() => {
    setSelectedIds(new Set());
  }, [selection.period, selection.from, selection.to]);

  function updateLocalStatus(id: string, next: SessionStatus) {
    setLocalSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: next } : s)));
  }

  function handleApprove(session: MockSession) {
    startTransition(async () => {
      if (isMock) {
        updateLocalStatus(session.id, "approved");
        setFeedback({ id: session.id, message: "Approved (demo - not saved)", kind: "success" });
        return;
      }
      try {
        await approveSession(session.id);
        updateLocalStatus(session.id, "approved");
        setFeedback({ id: session.id, message: "Approved", kind: "success" });
      } catch (err) {
        setFeedback({ id: session.id, message: err instanceof Error ? err.message : "Approve failed", kind: "error" });
      }
    });
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCompareFromSelection() {
    const ids = Array.from(selectedIds);
    if (ids.length !== 2) {
      setFeedback({
        id: "bulk-compare",
        message: "Select exactly two sessions from the same volunteer to compare",
        kind: "error",
      });
      return;
    }
    const picked = ids
      .map((id) => localSessions.find((s) => s.id === id))
      .filter((s): s is MockSession => s != null);
    if (picked.length !== 2 || picked[0].user_id !== picked[1].user_id) {
      setFeedback({
        id: "bulk-compare",
        message: "Both sessions must be from the same volunteer",
        kind: "error",
      });
      return;
    }
    router.push(`/sessions/compare?a=${ids[0]}&b=${ids[1]}`);
  }

  function handleResetHours(session: MockSession) {
    if (!session.court_ordered) {
      setFeedback({
        id: session.id,
        message: "Reset hours is only for court-ordered volunteers",
        kind: "error",
      });
      return;
    }
    startTransition(async () => {
      if (isMock) {
        setFeedback({ id: session.id, message: "Hours reset (demo - not saved)", kind: "success" });
        return;
      }
      try {
        await resetCourtOrderHours(session.user_id);
        setFeedback({ id: session.id, message: "Hours reset to zero", kind: "success" });
      } catch (err) {
        setFeedback({
          id: session.id,
          message: err instanceof Error ? err.message : "Hours reset failed",
          kind: "error",
        });
      }
    });
  }

  function handleBulkApprove() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds).filter((id) => {
      const session = localSessions.find((s) => s.id === id);
      return session?.status === "under_review";
    });
    if (ids.length === 0) {
      setFeedback({
        id: "bulk",
        message: "No under-review sessions selected to approve",
        kind: "error",
      });
      return;
    }
    startBulkTransition(async () => {
      if (isMock) {
        ids.forEach((id) => updateLocalStatus(id, "approved"));
        setFeedback({
          id: "bulk",
          message: `Approved ${ids.length} session${ids.length !== 1 ? "s" : ""} (demo - not saved)`,
          kind: "success",
        });
        setSelectedIds(new Set());
        return;
      }
      try {
        const results = await approveSessionsBulk(ids);
        const succeeded = results.filter((r) => r.success).length;
        const failed = results.length - succeeded;
        results.forEach((result) => {
          if (result.success) {
            updateLocalStatus(result.sessionId, "approved");
          }
        });
        setFeedback({
          id: "bulk",
          message:
            failed > 0
              ? `Approved ${succeeded}, ${failed} failed`
              : `Approved ${succeeded} session${succeeded !== 1 ? "s" : ""}`,
          kind: failed > 0 ? "error" : "success",
        });
        setSelectedIds(new Set());
      } catch (err) {
        setFeedback({
          id: "bulk",
          message: err instanceof Error ? err.message : "Bulk approve failed",
          kind: "error",
        });
      }
    });
  }

  function closeDecline() {
    setDeclineId(null);
    setDeclineReason("");
  }

  function handleDecline() {
    if (!declineId) return;
    const id = declineId;
    startTransition(async () => {
      if (isMock) {
        updateLocalStatus(id, "not_approved");
        setFeedback({ id, message: "Declined (demo - not saved)", kind: "success" });
        closeDecline();
        return;
      }
      try {
        await declineSession(id, declineReason || undefined);
        updateLocalStatus(id, "not_approved");
        setFeedback({ id, message: "Declined", kind: "success" });
        closeDecline();
      } catch (err) {
        setFeedback({ id, message: err instanceof Error ? err.message : "Decline failed", kind: "error" });
      }
    });
  }

  const needle = q.trim().toLowerCase();
  const periodScoped = filterByListPeriod(localSessions, selection);
  const filtered = periodScoped.filter((session) => {
    if (status !== "all" && session.status !== status) return false;
    if (courtOnly && !session.court_ordered) return false;
    if (!needle) return true;
    return (
      session.volunteer_name.toLowerCase().includes(needle) ||
      (session.activity ?? "").toLowerCase().includes(needle) ||
      session.id.toLowerCase().includes(needle)
    );
  });

  const periodEmpty = localSessions.length > 0 && periodScoped.length === 0;
  const filterEmpty = periodScoped.length > 0 && filtered.length === 0;

  const emptyMessage = filterEmpty
    ? "No sessions match these filters."
    : periodEmpty
      ? `No sessions in ${rangeLabel}.`
      : `No sessions in ${rangeLabel}.`;

  function showAllSessions() {
    const qs = new URLSearchParams(searchParams.toString());
    qs.set("period", "all");
    qs.delete("from");
    qs.delete("to");
    router.push(`/sessions?${qs.toString()}`);
  }

  const emptyStateContent =
    filtered.length === 0 ? (
      <div className="flex flex-col items-center gap-md">
        <p className="font-body text-base text-text-tertiary">{emptyMessage}</p>
        {periodEmpty ? (
          <>
            <p className="font-body text-[14px] text-text-tertiary">
              {localSessions.length} session{localSessions.length !== 1 ? "s" : ""} outside this period.
            </p>
            <button
              type="button"
              onClick={showAllSessions}
              className="h-10 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-primary-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              Show all sessions
            </button>
          </>
        ) : null}
      </div>
    ) : null;

  const previewSession: MockSession | null =
    (previewId ? localSessions.find((s) => s.id === previewId) : null) ?? null;

  const exportColumns = [
    { key: "id", label: "id" },
    { key: "volunteer", label: "volunteer" },
    { key: "activity", label: "activity" },
    { key: "status", label: "status" },
    { key: "duration", label: "duration" },
    { key: "court_ordered", label: "court_ordered" },
    { key: "created_at", label: "created_at" },
  ];
  const exportRows = filtered.map((s) => ({
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
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-md">
          <div className="flex items-start justify-between gap-md flex-wrap">
            <div>
              <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Sessions</h1>
              <p className="mt-xs font-body text-[14px] text-text-tertiary">
                Session review and management for {rangeLabel}.
              </p>
            </div>
            <ExportMenu
              onExportCsv={() => downloadCsv("sessions-export", exportColumns, exportRows)}
              onExportPdf={() => openPrintablePdf("Sessions export", exportColumns, exportRows)}
            />
          </div>
          <PeriodToggle selection={selection} />
          <div className="flex flex-col gap-sm lg:flex-row lg:flex-wrap lg:items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by volunteer, activity, or ID…"
              className="w-full lg:w-64 lg:max-w-full h-11 px-md rounded-sm border border-border-outline bg-bg-surface font-body text-[14px] placeholder:text-text-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary lg:shrink-0"
            />

            <div className="flex items-center gap-xs min-w-0 max-w-full overflow-x-auto pb-0.5" role="group" aria-label="Filter by status">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={status === f.value}
                  onClick={() => setStatus(f.value)}
                  className={`h-11 shrink-0 inline-flex items-center px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors ${
                    status === f.value
                      ? "bg-primary text-white border-primary"
                      : "bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-sm min-h-11 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={courtOnly}
                onChange={(e) => setCourtOnly(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="font-data text-[12px] font-semibold text-text-tertiary">Court-ordered only</span>
            </label>

            <button
              type="button"
              aria-pressed={compareMode}
              onClick={toggleCompareMode}
              className={`h-11 shrink-0 inline-flex items-center px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors ${
                compareMode
                  ? "bg-primary text-white border-primary"
                  : "bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary"
              }`}
            >
              {compareMode ? "Exit compare" : "Compare sessions"}
            </button>

            <span className="lg:ml-auto font-body text-[14px] text-text-tertiary self-start lg:self-center shrink-0">
              {filtered.length} session{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </PageStickyHeader>
      <div className="max-w-7xl mx-auto">

      {isMock && <SampleDataBanner />}

      {compareMode && (
        <div className="flex items-center gap-md mb-md px-md py-sm rounded-sm border border-primary/30 bg-[#f7fff1] flex-wrap">
          <span className="font-body text-[13px] text-text-primary">
            {compareIds.length === 0
              ? "Select two sessions from the same volunteer to compare."
              : `${compareIds.length} session${compareIds.length !== 1 ? "s" : ""} selected`}
          </span>
          {compareIds.length === 2 && !compareSameVolunteer && (
            <span className="font-body text-[12px] text-[#ba1a1a]">Both sessions must be from the same volunteer.</span>
          )}
          <button
            type="button"
            onClick={handleCompareGo}
            disabled={compareIds.length !== 2 || !compareSameVolunteer}
            className="h-9 px-md rounded-sm bg-primary text-white font-data text-[12px] font-semibold hover:bg-primary-hover transition-colors disabled:opacity-40"
          >
            Compare selected
          </button>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-md mb-md px-md py-sm rounded-sm border border-primary/30 bg-[#f7fff1] flex-wrap">
          <span className="font-body text-[13px] text-text-primary">
            {selectedIds.size} session{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <button
            type="button"
            onClick={handleBulkApprove}
            disabled={isBulkPending}
            className="h-9 px-md rounded-sm bg-primary text-white font-data text-[12px] font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
          >
            {isBulkPending ? "Approving…" : `Approve selected (${selectedIds.size})`}
          </button>
          {selectedIds.size > 1 && (
            <button
              type="button"
              onClick={handleCompareFromSelection}
              className="h-9 px-md rounded-sm border border-border-outline bg-bg-app font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated transition-colors"
            >
              Compare sessions
            </button>
          )}
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="font-data text-[12px] font-semibold text-text-tertiary hover:text-text-primary transition-colors"
          >
            Clear
          </button>
          {(feedback?.id === "bulk" || feedback?.id === "bulk-compare") && (
            <span className={`font-body text-[12px] ${feedback.kind === "error" ? "text-[#ba1a1a]" : "text-primary"}`}>
              {feedback.message}
            </span>
          )}
        </div>
      )}

      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-outline bg-bg-surface-elevated">
                <th className="px-lg py-sm w-11" aria-hidden="true" />
                {["Date", "Volunteer", "Activity", "Duration", "Status", "Court", "Actions"].map((h) => (
                  <th
                    key={h}
                    className={`px-lg py-sm font-data text-[12px] font-medium tracking-[0.96px] text-text-tertiary uppercase whitespace-nowrap ${
                      h === "Court" ? "text-center" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-outline">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-lg py-xl text-center">
                    {emptyStateContent}
                  </td>
                </tr>
              )}
              {filtered.map((session) => {
                const cfg = getSessionStatusConfig(session.status);
                const canModerate = session.status === "under_review";
                return (
                  <tr
                    key={session.id}
                    onClick={() => setPreviewId(session.id)}
                    className="hover:bg-bg-surface-elevated transition-colors cursor-pointer"
                  >
                    <td className="px-lg py-md" onClick={(e) => e.stopPropagation()}>
                      {compareMode ? (
                        <input
                          type="checkbox"
                          checked={compareIds.includes(session.id)}
                          onChange={() => toggleCompareSelected(session)}
                          aria-label={`Select session ${shortId(session.id)} for comparison`}
                          className="w-4 h-4 accent-primary"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(session.id)}
                          onChange={() => toggleSelected(session.id)}
                          aria-label={`Select session ${shortId(session.id)}`}
                          className="w-4 h-4 accent-primary"
                        />
                      )}
                    </td>
                    <td className="px-lg py-md font-body text-[14px] text-text-tertiary whitespace-nowrap">
                      {formatDate(session.started_at)}
                    </td>
                    <td className="px-lg py-md" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-sm flex-wrap">
                        <Link
                          href={`/volunteers/${session.user_id}`}
                          className="font-body text-[14px] font-medium text-text-primary hover:text-primary hover:underline whitespace-nowrap"
                        >
                          {session.volunteer_name}
                        </Link>
                        {shouldShowSessionServiceTypeBadge(
                          session.volunteer_service_type,
                          session.court_ordered,
                        ) && (
                          <ServiceTypeBadge serviceType={session.volunteer_service_type} />
                        )}
                      </div>
                    </td>
                    <td className="px-lg py-md">
                      <span className="font-body text-base text-text-primary">{session.activity ?? "-"}</span>
                      <p className="font-data text-[11px] text-text-tertiary">{shortId(session.id)}</p>
                    </td>
                    <td className="px-lg py-md font-body text-[14px] text-text-primary whitespace-nowrap">
                      {formatDuration(session.duration_seconds, session.adjusted_hours)}
                    </td>
                    <td className="px-lg py-md">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-sm border font-data text-[12px] font-semibold leading-[16px] whitespace-nowrap ${cfg.className}`}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-lg py-md text-center">{session.court_ordered && <CourtBadge />}</td>
                    <td className="px-lg py-md" onClick={(e) => e.stopPropagation()}>
                      {(canModerate || session.court_ordered) ? (
                        <div className="flex flex-col gap-xs">
                          <div className="flex items-center gap-sm flex-wrap">
                            {canModerate && (
                              <>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => handleApprove(session)}
                                  className="h-8 px-sm rounded-sm border border-primary/30 bg-status-approved-bg text-primary font-data text-[11px] font-semibold hover:bg-status-approved-bg/80 transition-colors disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => setDeclineId(session.id)}
                                  className="h-8 px-sm rounded-sm border border-[#ba1a1a]/40 text-[#ba1a1a] font-data text-[11px] font-semibold hover:bg-[#ffd9de] transition-colors disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {session.court_ordered && (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleResetHours(session)}
                                className="h-8 px-sm rounded-sm border border-border-outline bg-bg-app text-text-primary font-data text-[11px] font-semibold hover:bg-bg-surface-elevated transition-colors disabled:opacity-50"
                              >
                                Reset hours
                              </button>
                            )}
                          </div>
                          {feedback?.id === session.id && (
                            <p
                              className={`font-body text-[12px] ${feedback.kind === "error" ? "text-[#ba1a1a]" : "text-primary"}`}
                            >
                              {feedback.message}
                            </p>
                          )}
                        </div>
                      ) : (
                        feedback?.id === session.id && (
                          <p
                            className={`font-body text-[12px] ${feedback.kind === "error" ? "text-[#ba1a1a]" : "text-primary"}`}
                          >
                            {feedback.message}
                          </p>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-border-outline">
          {filtered.length === 0 && (
            <div className="px-lg py-xl text-center">{emptyStateContent}</div>
          )}
          {filtered.map((session) => {
            const cfg = getSessionStatusConfig(session.status);
            const canModerate = session.status === "under_review";
            return (
              <div key={session.id} className="px-lg py-md hover:bg-bg-surface-elevated transition-colors">
                <div className="flex items-start justify-between gap-md mb-sm">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setPreviewId(session.id)}
                      className="block w-full text-left"
                    >
                      <p className="font-body text-base font-medium text-text-primary">
                        {session.activity ?? "Cleanup session"}
                      </p>
                    </button>
                    <p className="font-body text-[14px] text-text-tertiary flex items-center gap-xs flex-wrap">
                      <Link
                        href={`/volunteers/${session.user_id}`}
                        className="text-text-tertiary hover:text-primary hover:underline"
                      >
                        {session.volunteer_name}
                      </Link>
                      {shouldShowSessionServiceTypeBadge(
                        session.volunteer_service_type,
                        session.court_ordered,
                      ) && (
                        <ServiceTypeBadge serviceType={session.volunteer_service_type} />
                      )}
                      {" · "}
                      {formatDate(session.started_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewId(session.id)}
                    className="shrink-0"
                    aria-label={`Open session ${shortId(session.id)}`}
                  >
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-sm border font-data text-[12px] font-semibold leading-[16px] whitespace-nowrap ${cfg.className}`}
                    >
                      {cfg.label}
                    </span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewId(session.id)}
                  className="flex items-center gap-lg text-[14px] text-text-tertiary font-body w-full text-left"
                >
                  <span>{formatDuration(session.duration_seconds, session.adjusted_hours)}</span>
                  {session.court_ordered && <CourtBadge />}
                </button>
                {compareMode && (
                  <label className="flex items-center gap-xs mt-sm">
                    <input
                      type="checkbox"
                      checked={compareIds.includes(session.id)}
                      onChange={() => toggleCompareSelected(session)}
                      aria-label={`Select session ${shortId(session.id)} for comparison`}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="font-data text-[12px] text-text-tertiary">Select to compare</span>
                  </label>
                )}
                {!compareMode && (
                  <div className="flex items-center gap-sm mt-sm flex-wrap">
                    <label className="flex items-center gap-xs shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(session.id)}
                        onChange={() => toggleSelected(session.id)}
                        aria-label={`Select session ${shortId(session.id)}`}
                        className="w-4 h-4 accent-primary"
                      />
                    </label>
                    {canModerate && (
                      <>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleApprove(session)}
                          className="h-8 px-sm rounded-sm border border-primary/30 bg-status-approved-bg text-primary font-data text-[11px] font-semibold hover:bg-status-approved-bg/80 transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setDeclineId(session.id)}
                          className="h-8 px-sm rounded-sm border border-[#ba1a1a]/40 text-[#ba1a1a] font-data text-[11px] font-semibold hover:bg-[#ffd9de] transition-colors disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {session.court_ordered && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleResetHours(session)}
                        className="h-8 px-sm rounded-sm border border-border-outline bg-bg-app text-text-primary font-data text-[11px] font-semibold hover:bg-bg-surface-elevated transition-colors disabled:opacity-50"
                      >
                        Reset hours
                      </button>
                    )}
                  </div>
                )}
                {feedback?.id === session.id && (
                  <p className={`mt-xs font-body text-[12px] ${feedback.kind === "error" ? "text-[#ba1a1a]" : "text-primary"}`}>
                    {feedback.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SessionPreviewDrawer
        session={previewSession}
        open={previewId != null}
        isMock={isMock}
        onClose={() => setPreviewId(null)}
      />

      {declineId && (
        <div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-lg"
          role="dialog"
          aria-modal="true"
          aria-labelledby="decline-session-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[var(--color-overlay-scrim)]"
            aria-label="Cancel decline"
            onClick={closeDecline}
          />
          <div className="relative w-full max-w-md rounded-md bg-bg-surface border border-border-outline p-lg">
            <h3 id="decline-session-title" className="font-heading text-[20px] text-text-primary mb-sm">
              Decline session
            </h3>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Reason (optional)"
              rows={3}
              autoFocus
              className="w-full rounded-sm border border-border-outline bg-bg-app px-md py-sm font-body text-[14px] mb-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary resize-none"
            />
            <div className="flex gap-sm justify-end">
              <button
                type="button"
                onClick={closeDecline}
                className="h-9 px-md font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated rounded-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDecline}
                disabled={isPending}
                className="h-9 px-md font-data text-[12px] font-semibold bg-status-declined-bg border border-status-declined-border text-status-declined-text rounded-sm hover:bg-status-declined-hover transition-colors disabled:opacity-50"
              >
                {isPending ? "Declining…" : "Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
