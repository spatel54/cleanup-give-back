"use client";

/**
 * Session detail drawer for web-app's Sessions page.
 * Mirrors the admin session detail page (`admin/app/(admin)/sessions/[id]/page.tsx`)
 * in a slide-over - Session Info, Admin Actions, Walking Path, Photos -
 * with an expand control that grows the panel to full screen.
 *
 * Hours Adjustment / Admin Notes / Letterhead (ported from admin's
 * `SessionActions.tsx`) call the real `adjustHours`/`saveAdminNotes` server
 * actions and the `/api/service-letter` routes when `isMock` is false; in
 * mock mode they update local-only state, matching the existing
 * approve/decline "demo - not saved" pattern in this file.
 *
 * Live Walking Path + Photos hydrate via `loadSessionEvidence` when the
 * session has a GPS `route` and/or signed `session-photos` checkpoints.
 */
import { useEffect, useId, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CourtBadge } from "@/components/ui/CourtBadge";
import { ServiceTypeBadge } from "@/components/ui/ServiceTypeBadge";
import { shouldShowSessionServiceTypeBadge } from "@/components/ui/court-tag-styles";
import { RedFlagBadge } from "@/components/ui/RedFlagBadge";
import { CameraIcon, CloseIcon, CollapseIcon, ExpandIcon } from "@/components/ui/Icons";
import { SessionPhotoGrid } from "@/components/sessions/SessionPhotoGrid";
import {
  SessionWalkingPathMap,
  WalkingPathLegend,
} from "@/components/sessions/SessionWalkingPathMap";
import {
  adjustHours,
  approveSession,
  declineSession,
  loadSessionEvidence,
  loadSessionVolunteerPattern,
  saveAdminNotes,
  type SessionEvidence,
  type VolunteerActivityPattern,
} from "@/actions/sessions";
import { resetCourtOrderHours } from "@/actions/courtOrders";
import { computeRedFlags } from "@/lib/session-red-flags";
import { ADMIN_NOTE_SNIPPETS, DECLINE_REASON_TEMPLATES } from "@/lib/decisionTemplates";
import {
  formatDateTime,
  formatDuration,
  formatMiles,
  shortId,
  getSessionStatusConfig,
  type MockSession,
  type SessionStatus,
} from "@/lib/mock-data";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const DRAWER_SPRING = { type: "spring" as const, stiffness: 320, damping: 34, mass: 0.85 };
const PHOTO_LABELS = ["Selfie", "Progress", "Selfie", "Progress"];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-data text-[12px] text-text-tertiary tracking-[0.96px] uppercase mb-xs">
        {label}
      </dt>
      <dd className="font-body text-base text-text-primary">{value}</dd>
    </div>
  );
}

function StatusChip({ status }: { status: SessionStatus }) {
  const cfg = getSessionStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm border font-data text-[12px] font-semibold leading-[16px] whitespace-nowrap ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

function WalkingPathPlaceholder({
  distanceMiles,
  pointCount,
  loading,
}: {
  distanceMiles: number | null;
  pointCount: number | null;
  loading?: boolean;
}) {
  const hasRoute = pointCount != null && pointCount > 0;
  return (
    <div className="relative aspect-[16/9] rounded-sm border border-dashed border-border-outline bg-bg-surface-elevated overflow-hidden">
      <svg
        viewBox="0 0 320 160"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full opacity-50"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M24 130 C 70 40, 120 150, 165 70 S 250 20, 296 60"
          stroke="#009540"
          strokeWidth="3"
          strokeDasharray="7 7"
          strokeLinecap="round"
        />
        <circle cx="24" cy="130" r="5" fill="#009540" />
        <circle cx="296" cy="60" r="5" fill="#ba1a1a" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center px-lg">
        <div className="text-center bg-bg-surface/90 rounded-sm px-md py-sm">
          <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary">
            {loading ? "Loading map…" : "Walking path"}
          </p>
          <p className="font-body text-[13px] text-text-tertiary mt-xs">
            {loading
              ? "Fetching GPS route…"
              : hasRoute
                ? `GPS route logged (${pointCount} point${pointCount !== 1 ? "s" : ""})`
                : distanceMiles != null && distanceMiles > 0
                  ? "Distance logged - no GPS polyline stored for this session"
                  : "No GPS route recorded for this session"}
          </p>
        </div>
      </div>
    </div>
  );
}

function WalkingPathSection({
  distanceMiles,
  evidence,
  loading,
}: {
  distanceMiles: number | null;
  evidence: SessionEvidence | null;
  loading: boolean;
}) {
  const route = evidence?.route;
  const photoPins = evidence?.photoPins ?? [];
  const photoCount = evidence?.photos.length ?? 0;
  const hasLiveRoute = (route?.length ?? 0) >= 2;

  return (
    <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
      <div className="flex items-center justify-between mb-md gap-md">
        <h2 className="font-heading text-[20px] leading-[28px] text-text-primary">Walking Path</h2>
        {distanceMiles != null && (
          <span className="font-data text-[13px] font-medium text-text-primary tabular-nums">
            {distanceMiles.toFixed(2)} mi logged
          </span>
        )}
      </div>
      {hasLiveRoute && route ? (
        <SessionWalkingPathMap route={route} photoPins={photoPins} />
      ) : (
        <WalkingPathPlaceholder
          distanceMiles={distanceMiles}
          pointCount={route && route.length > 0 ? route.length : evidence ? 0 : null}
          loading={loading}
        />
      )}
      {hasLiveRoute && route && (
        <WalkingPathLegend pointCount={route.length} photoCount={photoCount} />
      )}
    </section>
  );
}

function PhotosPlaceholder() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm">
      {PHOTO_LABELS.map((label, i) => (
        <div
          key={`${label}-${i}`}
          className="aspect-square rounded-sm border border-dashed border-border-outline bg-bg-surface-elevated flex flex-col items-center justify-center gap-xs"
        >
          <CameraIcon className="w-[26px] h-[26px] text-text-tertiary" aria-hidden />
          <span className="font-data text-[10px] uppercase tracking-[0.5px] text-text-tertiary">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function PhotosSection({
  evidence,
  loading,
  isMock,
}: {
  evidence: SessionEvidence | null;
  loading: boolean;
  isMock: boolean;
}) {
  const photos = evidence?.photos ?? [];
  const checkpointCount = evidence?.checkpointCount ?? 0;
  const titleSuffix =
    photos.length > 0
      ? ` (${photos.length})`
      : checkpointCount > 0
        ? ` (${checkpointCount} checkpoint${checkpointCount !== 1 ? "s" : ""})`
        : "";

  return (
    <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
      <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">
        Photos{titleSuffix}
      </h2>
      {loading ? (
        <p className="font-body text-[13px] text-text-tertiary">Loading photos…</p>
      ) : photos.length > 0 ? (
        <SessionPhotoGrid photos={photos} />
      ) : evidence?.photoSignFailed ? (
        <p className="font-body text-[13px] text-text-tertiary">
          {checkpointCount} checkpoint{checkpointCount !== 1 ? "s" : ""} logged, but photo signing
          failed - check <span className="font-data">SUPABASE_SERVICE_ROLE_KEY</span> and the{" "}
          <span className="font-data">session-photos</span> bucket policy.
        </p>
      ) : isMock || !evidence ? (
        <>
          <PhotosPlaceholder />
          <p className="font-body text-[13px] text-text-tertiary mt-md">
            {isMock
              ? "Demo placeholders - live sessions show checkpoint photos when available."
              : "No photos captured for this session yet."}
          </p>
        </>
      ) : (
        <p className="font-body text-[13px] text-text-tertiary">
          No photos captured for this session yet.
        </p>
      )}
    </section>
  );
}

/** Decline-reason template picker + editable text, shown inline once "Decline" is pressed.
 * Selecting a template fills the textarea (still freely editable) - declineSession always
 * receives whatever text is in the box, so a freeform reason stays fully supported. */
function DeclineReasonPicker({
  isPending,
  onConfirm,
  onCancel,
}: {
  isPending: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}) {
  const [reasonText, setReasonText] = useState("");
  return (
    <div className="rounded-sm border border-[#ba1a1a] bg-[#ffd9de] px-md py-sm flex flex-col gap-sm">
      <label className="font-data text-[11px] tracking-[0.88px] uppercase text-[#ba1a1a]">
        Decline reason
      </label>
      <select
        onChange={(e) => {
          const template = DECLINE_REASON_TEMPLATES.find((t) => t.id === e.target.value);
          if (template) setReasonText(template.text);
          e.target.value = "";
        }}
        defaultValue=""
        className="h-9 px-sm rounded-sm border border-[#ba1a1a] bg-white font-body text-[13px] text-text-primary focus:outline-none"
      >
        <option value="" disabled>
          Choose a template…
        </option>
        {DECLINE_REASON_TEMPLATES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
      <textarea
        value={reasonText}
        onChange={(e) => setReasonText(e.target.value)}
        rows={3}
        placeholder="Reason shown in the audit log (optional)"
        className="w-full rounded-sm border border-[#ba1a1a] bg-white p-sm font-body text-[13px] text-text-primary focus:outline-none resize-none"
      />
      <div className="flex gap-sm">
        <button
          type="button"
          onClick={() => onConfirm(reasonText.trim() || undefined)}
          disabled={isPending}
          className="h-9 px-md rounded-sm bg-[#ba1a1a] text-white font-data text-[12px] font-semibold disabled:opacity-40"
        >
          Confirm decline
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="h-9 px-md rounded-sm border border-[#ba1a1a] bg-white text-[#ba1a1a] font-data text-[12px] font-semibold disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AdminActionsSection({
  status,
  canApprove,
  canDecline,
  canResetHours,
  isMock,
  isPending,
  feedback,
  feedbackKind,
  showDeclinePicker,
  onApprove,
  onStartDecline,
  onConfirmDecline,
  onCancelDecline,
  onResetHours,
}: {
  status: SessionStatus;
  canApprove: boolean;
  canDecline: boolean;
  canResetHours: boolean;
  isMock: boolean;
  isPending: boolean;
  feedback: string | null;
  feedbackKind: "success" | "error" | null;
  showDeclinePicker: boolean;
  onApprove: () => void;
  onStartDecline: () => void;
  onConfirmDecline: (reason?: string) => void;
  onCancelDecline: () => void;
  onResetHours: () => void;
}) {
  return (
    <section className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-lg">
      <h2 className="font-heading text-[20px] leading-[28px] text-text-primary">Admin Actions</h2>
      <div className="flex items-center justify-between gap-md rounded-sm border border-border-outline bg-bg-surface-elevated px-md py-sm">
        <span className="font-data text-[12px] text-text-tertiary uppercase tracking-[0.5px]">
          Status
        </span>
        <StatusChip status={status} />
      </div>
      <div className="flex flex-col gap-sm">
        {canApprove && (
          <button
            type="button"
            onClick={onApprove}
            disabled={isPending}
            className="w-full h-11 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            Approve
          </button>
        )}
        {canDecline && !showDeclinePicker && (
          <button
            type="button"
            onClick={onStartDecline}
            disabled={isPending}
            className="w-full h-11 px-lg rounded-sm border border-status-declined-border bg-status-declined-bg text-status-declined-text font-data text-[13px] font-semibold hover:bg-status-declined-hover transition-colors disabled:opacity-50"
          >
            Decline
          </button>
        )}
        {canResetHours && (
          <button
            type="button"
            onClick={onResetHours}
            disabled={isPending}
            className="w-full h-11 px-lg rounded-sm border border-border-outline bg-bg-app text-text-primary font-data text-[13px] font-semibold hover:bg-bg-surface-elevated transition-colors disabled:opacity-50"
          >
            Reset hours
          </button>
        )}
      </div>
      {showDeclinePicker && (
        <DeclineReasonPicker
          isPending={isPending}
          onConfirm={onConfirmDecline}
          onCancel={onCancelDecline}
        />
      )}
      {feedback ? (
        <p
          className={`font-body text-[12px] ${
            feedbackKind === "error" ? "text-[#ba1a1a]" : "text-primary"
          }`}
        >
          {feedback}
        </p>
      ) : (
        <p className="font-body text-[12px] text-text-tertiary">
          {isMock
            ? "Demo only - status changes stay in this preview and are not saved."
            : canResetHours
              ? "Approve or decline writes to the live sessions table. Reset hours zeroes completed court-order hours for this volunteer."
              : "Approve or decline writes to the live sessions table and notifies the volunteer."}
        </p>
      )}
    </section>
  );
}

function HoursAndNotesSection({
  session,
  isMock,
  adjustedHours,
  onAdjustedHours,
  adminNotes,
  onAdminNotes,
}: {
  session: MockSession;
  isMock: boolean;
  adjustedHours: number | null;
  onAdjustedHours: (hours: number) => void;
  adminNotes: string;
  onAdminNotes: (notes: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [hoursInput, setHoursInput] = useState(String(adjustedHours ?? ""));
  const [notesInput, setNotesInput] = useState(adminNotes);
  const [hoursMessage, setHoursMessage] = useState<string | null>(null);
  const [notesMessage, setNotesMessage] = useState<string | null>(null);

  function handleSaveHours() {
    const hours = parseFloat(hoursInput);
    if (Number.isNaN(hours) || hours < 0) {
      setHoursMessage("Enter a valid number of hours (e.g. 1.5)");
      return;
    }
    startTransition(async () => {
      if (isMock) {
        onAdjustedHours(hours);
        setHoursMessage("Saved (demo - not saved)");
        return;
      }
      try {
        await adjustHours(session.id, hours);
        onAdjustedHours(hours);
        setHoursMessage("Saved");
      } catch (err) {
        setHoursMessage(err instanceof Error ? err.message : "Failed to save hours");
      }
    });
  }

  function handleSaveNotes() {
    startTransition(async () => {
      if (isMock) {
        onAdminNotes(notesInput);
        setNotesMessage("Saved (demo - not saved)");
        return;
      }
      try {
        await saveAdminNotes(session.id, notesInput);
        onAdminNotes(notesInput);
        setNotesMessage("Saved");
      } catch (err) {
        setNotesMessage(err instanceof Error ? err.message : "Failed to save notes");
      }
    });
  }

  return (
    <section className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-lg">
      <h2 className="font-heading text-[20px] leading-[28px] text-text-primary">Hours &amp; Notes</h2>

      <div className="flex flex-col gap-sm">
        <p className="font-data text-[12px] text-text-tertiary tracking-[0.96px] uppercase">
          Adjust Hours
        </p>
        <div className="flex gap-sm">
          <input
            type="number"
            min="0"
            step="0.25"
            value={hoursInput}
            onChange={(e) => setHoursInput(e.target.value)}
            placeholder="e.g. 1.5"
            className="flex-1 h-9 px-sm rounded-sm border border-border-outline font-body text-base text-text-primary focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => handleSaveHours()}
            disabled={isPending}
            className="h-9 px-md rounded-sm border border-border-outline bg-bg-surface font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated transition-colors disabled:opacity-50"
          >
            Save
          </button>
        </div>
        {hoursMessage && <p className="font-body text-[12px] text-primary">{hoursMessage}</p>}
      </div>

      <div className="flex flex-col gap-sm border-t border-border-outline pt-lg">
        <div className="flex items-center justify-between gap-sm">
          <p className="font-data text-[12px] text-text-tertiary tracking-[0.96px] uppercase">
            Admin Notes
          </p>
          <select
            onChange={(e) => {
              const snippet = ADMIN_NOTE_SNIPPETS.find((s) => s.id === e.target.value);
              if (snippet) {
                setNotesInput((prev) => (prev ? `${prev}\n${snippet.text}` : snippet.text));
              }
              e.target.value = "";
            }}
            defaultValue=""
            className="h-8 px-xs rounded-sm border border-border-outline bg-bg-surface font-body text-[12px] text-text-tertiary focus:outline-none focus:border-primary"
            aria-label="Insert note snippet"
          >
            <option value="" disabled>
              Insert snippet…
            </option>
            {ADMIN_NOTE_SNIPPETS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={notesInput}
          onChange={(e) => setNotesInput(e.target.value)}
          rows={4}
          placeholder="Internal notes (not visible to volunteer)"
          className="w-full rounded-sm border border-border-outline p-sm font-body text-[14px] text-text-primary focus:outline-none focus:border-primary resize-none"
        />
        <button
          type="button"
          onClick={handleSaveNotes}
          disabled={isPending}
          className="self-end h-9 px-md rounded-sm border border-border-outline bg-bg-surface font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated transition-colors disabled:opacity-50"
        >
          Save Notes
        </button>
        {notesMessage && <p className="font-body text-[12px] text-primary">{notesMessage}</p>}
      </div>
    </section>
  );
}

function LetterheadSection({ session, isMock }: { session: MockSession; isMock: boolean }) {
  const canGenerate = session.status === "approved";

  return (
    <section className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-sm">
      <h2 className="font-heading text-[20px] leading-[28px] text-text-primary">Letterhead</h2>
      {session.letterhead_generated_at && (
        <p className="font-body text-[13px] text-text-tertiary">
          Last generated: {new Date(session.letterhead_generated_at).toLocaleDateString()}
        </p>
      )}
      {isMock ? (
        <p className="font-body text-[13px] text-text-tertiary">
          Demo only - letterhead PDFs generate once this session is backed by the live sessions table.
        </p>
      ) : (
        <div className="flex flex-col gap-sm">
          <a
            href={`/api/service-letter/${session.id}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!canGenerate}
            className={`interactive inline-flex items-center justify-center h-9 px-md rounded-sm border border-border-outline bg-bg-surface font-data text-[12px] font-semibold text-text-primary transition-colors ${
              canGenerate ? "hover:bg-bg-surface-elevated" : "opacity-50 pointer-events-none"
            }`}
          >
            Generate Letterhead PDF
          </a>
          {session.court_ordered && (
            <a
              href={`/api/service-letter/${session.id}?courtPacket=true`}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!canGenerate}
              className={`interactive inline-flex items-center justify-center h-9 px-md rounded-sm border border-border-outline bg-bg-surface font-data text-[12px] font-semibold text-text-primary transition-colors ${
                canGenerate ? "hover:bg-bg-surface-elevated" : "opacity-50 pointer-events-none"
              }`}
            >
              Export Court Packet
            </a>
          )}
        </div>
      )}
      {!canGenerate && !isMock && (
        <p className="font-body text-[12px] text-text-tertiary">
          Available once this session is approved.
        </p>
      )}
    </section>
  );
}

function SessionDrawerPanel({
  session,
  isMock,
  onClose,
}: {
  session: MockSession;
  isMock: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const prefersReduced = useReducedMotion() ?? false;
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<SessionStatus>(session.status);
  const [adjustedHours, setAdjustedHours] = useState<number | null>(session.adjusted_hours);
  const [adminNotes, setAdminNotes] = useState(session.admin_notes ?? "");
  const [evidence, setEvidence] = useState<SessionEvidence | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(!isMock);
  const [volunteerPattern, setVolunteerPattern] = useState<VolunteerActivityPattern | null>(null);
  const [actionPending, startActionTransition] = useTransition();
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [actionFeedbackKind, setActionFeedbackKind] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (expanded) {
          setExpanded(false);
          return;
        }
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, expanded]);

  useEffect(() => {
    if (isMock) {
      setEvidence(null);
      setEvidenceLoading(false);
      return;
    }

    let cancelled = false;
    setEvidenceLoading(true);
    setEvidence(null);

    loadSessionEvidence(session.id)
      .then((result) => {
        if (!cancelled) setEvidence(result);
      })
      .catch((err) => {
        console.warn("[SessionPreviewDrawer] evidence load failed:", err);
        if (!cancelled) setEvidence(null);
      })
      .finally(() => {
        if (!cancelled) setEvidenceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session.id, isMock]);

  useEffect(() => {
    if (isMock) {
      setVolunteerPattern(null);
      return;
    }
    let cancelled = false;
    loadSessionVolunteerPattern(session.user_id)
      .then((result) => {
        if (!cancelled) setVolunteerPattern(result);
      })
      .catch((err) => {
        console.warn("[SessionPreviewDrawer] volunteer pattern load failed:", err);
        if (!cancelled) setVolunteerPattern(null);
      });
    return () => {
      cancelled = true;
    };
  }, [session.user_id, isMock]);

  const redFlags = computeRedFlags({
    durationSeconds: session.duration_seconds,
    checkpointCount: evidence?.checkpointCount ?? 0,
    photoPins: evidence?.photoPins ?? [],
    plausibilitySignal: evidence?.plausibilitySignal ?? null,
    volunteerPattern,
  });

  const canModerate = status === "under_review";
  const canApprove = canModerate;
  const canDecline = canModerate;
  const canResetHours = session.court_ordered;
  const [showDeclinePicker, setShowDeclinePicker] = useState(false);

  function handleApprove() {
    startActionTransition(async () => {
      if (isMock) {
        setStatus("approved");
        setActionFeedback("Approved (demo - not saved)");
        setActionFeedbackKind("success");
        return;
      }
      try {
        await approveSession(session.id);
        setStatus("approved");
        setActionFeedback("Approved");
        setActionFeedbackKind("success");
      } catch (err) {
        setActionFeedback(err instanceof Error ? err.message : "Approve failed");
        setActionFeedbackKind("error");
      }
    });
  }

  function handleDecline(reason?: string) {
    startActionTransition(async () => {
      if (isMock) {
        setStatus("not_approved");
        setActionFeedback("Declined (demo - not saved)");
        setActionFeedbackKind("success");
        setShowDeclinePicker(false);
        return;
      }
      try {
        await declineSession(session.id, reason);
        setStatus("not_approved");
        setActionFeedback("Declined");
        setActionFeedbackKind("success");
        setShowDeclinePicker(false);
      } catch (err) {
        setActionFeedback(err instanceof Error ? err.message : "Decline failed");
        setActionFeedbackKind("error");
      }
    });
  }

  function handleResetHours() {
    startActionTransition(async () => {
      if (isMock) {
        setActionFeedback("Hours reset (demo - not saved)");
        setActionFeedbackKind("success");
        return;
      }
      try {
        await resetCourtOrderHours(session.user_id);
        setActionFeedback("Hours reset to zero");
        setActionFeedbackKind("success");
      } catch (err) {
        setActionFeedback(err instanceof Error ? err.message : "Hours reset failed");
        setActionFeedbackKind("error");
      }
    });
  }

  const panelTransition = prefersReduced ? { duration: 0 } : DRAWER_SPRING;
  const scrimTransition = prefersReduced ? { duration: 0 } : { duration: 0.4, ease: EASE_OUT };
  const contentTransition = prefersReduced
    ? { duration: 0 }
    : { duration: 0.4, delay: 0.06, ease: EASE_OUT };

  const pathSection = (
    <WalkingPathSection
      distanceMiles={session.distance_miles}
      evidence={evidence}
      loading={evidenceLoading}
    />
  );
  const photosSection = (
    <PhotosSection evidence={evidence} loading={evidenceLoading} isMock={isMock} />
  );

  return (
    <motion.div
      className="fixed inset-0 z-[60] pointer-events-none"
      initial={false}
      exit={{ opacity: 1, transition: { duration: prefersReduced ? 0 : 0.5 } }}
    >
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={scrimTransition}
        className="pointer-events-auto absolute inset-0 bg-black/40"
        aria-label="Close session preview"
        onClick={onClose}
      />
      <motion.aside
        layout
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={prefersReduced ? false : { x: "100%" }}
        animate={{ x: 0 }}
        exit={prefersReduced ? undefined : { x: expanded ? 0 : "100%" }}
        transition={panelTransition}
        className={`pointer-events-auto absolute inset-y-0 right-0 h-full bg-bg-app border-l border-border-outline shadow-bar-top flex flex-col will-change-transform ${
          expanded ? "w-full max-w-none left-0" : "w-full max-w-md md:max-w-lg"
        }`}
      >
        <motion.div
          className="flex flex-col h-full min-h-0"
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={contentTransition}
        >
        <header className="px-lg py-md border-b border-border-outline bg-bg-surface flex items-start justify-between gap-md shrink-0">
          <div className="min-w-0 flex-1">
            <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-xs">
              Session {shortId(session.id)}
            </p>
            <p
              id={titleId}
              className={`font-heading text-text-primary ${
                expanded ? "text-[28px] leading-[36px]" : "text-[20px] leading-[28px]"
              }`}
            >
              {session.activity ?? "Cleanup Session"}
            </p>
            <p className="font-body text-[14px] text-primary mt-xs">{session.volunteer_name}</p>
            <div className="mt-sm flex items-center gap-sm flex-wrap">
              {session.court_ordered && <CourtBadge />}
              {shouldShowSessionServiceTypeBadge(
                session.volunteer_service_type,
                session.court_ordered,
              ) && (
                <ServiceTypeBadge serviceType={session.volunteer_service_type} />
              )}
              <StatusChip status={status} />
              <RedFlagBadge flags={redFlags} />
            </div>
          </div>
          <div className="flex items-center gap-xs shrink-0">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-sm text-text-tertiary hover:bg-bg-surface-elevated hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              aria-label={expanded ? "Collapse to drawer" : "Expand to full screen"}
              aria-pressed={expanded}
            >
              {expanded ? <CollapseIcon className="w-4 h-4" /> : <ExpandIcon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-sm text-text-tertiary hover:bg-bg-surface-elevated hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Close"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-lg py-lg">
          <div className={`mx-auto flex flex-col gap-lg ${expanded ? "max-w-6xl" : "max-w-none"}`}>
            <div
              className={`grid gap-lg ${expanded ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1"}`}
            >
              <div className={`flex flex-col gap-lg ${expanded ? "lg:col-span-3" : ""}`}>
                <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
                  <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">
                    Session Info
                  </h2>
                  <dl className="grid grid-cols-2 gap-x-lg gap-y-md">
                    <InfoRow label="Volunteer" value={session.volunteer_name} />
                    <InfoRow label="Service Type" value={session.volunteer_service_type ?? "-"} />
                    <InfoRow label="Activity" value={session.activity ?? "-"} />
                    <InfoRow label="Court Ordered" value={session.court_ordered ? "Yes" : "No"} />
                    <InfoRow label="Started" value={formatDateTime(session.started_at)} />
                    <InfoRow label="Ended" value={formatDateTime(session.ended_at)} />
                    <InfoRow
                      label="Duration"
                      value={formatDuration(session.duration_seconds, adjustedHours)}
                    />
                    <InfoRow label="Distance" value={formatMiles(session.distance_miles)} />
                  </dl>
                </section>

                {expanded && pathSection}
                {expanded && photosSection}
              </div>

              <div className={`flex flex-col gap-lg ${expanded ? "lg:col-span-2" : ""}`}>
                <AdminActionsSection
                  status={status}
                  canApprove={canApprove}
                  canDecline={canDecline}
                  canResetHours={canResetHours}
                  isMock={isMock}
                  isPending={actionPending}
                  feedback={actionFeedback}
                  feedbackKind={actionFeedbackKind}
                  showDeclinePicker={showDeclinePicker}
                  onApprove={() => handleApprove()}
                  onStartDecline={() => setShowDeclinePicker(true)}
                  onConfirmDecline={(reason) => handleDecline(reason)}
                  onCancelDecline={() => setShowDeclinePicker(false)}
                  onResetHours={() => handleResetHours()}
                />
                <HoursAndNotesSection
                  session={session}
                  isMock={isMock}
                  adjustedHours={adjustedHours}
                  onAdjustedHours={setAdjustedHours}
                  adminNotes={adminNotes}
                  onAdminNotes={setAdminNotes}
                />
                <LetterheadSection session={{ ...session, status }} isMock={isMock} />
              </div>
            </div>

            {!expanded && (
              <>
                {pathSection}
                {photosSection}
              </>
            )}
          </div>
        </div>
        </motion.div>
      </motion.aside>
    </motion.div>
  );
}

export function SessionPreviewDrawer({
  session,
  open,
  isMock = false,
  onClose,
}: {
  session: MockSession | null;
  open: boolean;
  isMock?: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && session && (
        <SessionDrawerPanel key={session.id} session={session} isMock={isMock} onClose={onClose} />
      )}
    </AnimatePresence>
  );
}
