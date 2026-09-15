"use client";

/**
 * Side-by-side session comparison - two columns (photos + walking path + notes)
 * for two sessions confirmed to be from the same volunteer, so Admin can visually
 * spot reused photos, repeated routes, or repeated notes. v1 automated hint is
 * limited to exact-duplicate note text - full photo/route similarity detection
 * is out of scope (see plan notes); the side-by-side view is the primary tool,
 * Admin spots the pattern the same way she would flipping between two tabs.
 */
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/ui/Icons";
import { SessionPhotoGrid } from "@/components/sessions/SessionPhotoGrid";
import { SessionWalkingPathMap } from "@/components/sessions/SessionWalkingPathMap";
import { getSessionStatusConfig, formatDate, formatDuration } from "@/lib/mock-data";
import type { CompareSession } from "@/lib/session-compare";
import type { SessionEvidence } from "@/lib/session-evidence";

function SessionColumn({ session, evidence }: { session: CompareSession; evidence: SessionEvidence | null }) {
  const cfg = getSessionStatusConfig(session.status);
  const route = evidence?.route;
  const hasRoute = (route?.length ?? 0) >= 2;

  return (
    <div className="flex-1 min-w-0 bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md">
      <div>
        <div className="flex items-center justify-between gap-md mb-xs">
          <h2 className="font-heading text-[18px] leading-[26px] text-text-primary">
            {session.activity ?? "Cleanup session"}
          </h2>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-sm border font-data text-[11px] font-semibold leading-[16px] whitespace-nowrap ${cfg.className}`}
          >
            {cfg.label}
          </span>
        </div>
        <p className="font-data text-[12px] text-text-tertiary">
          {session.startedAt ? formatDate(session.startedAt) : "-"} ·{" "}
          {formatDuration(session.durationSeconds, session.adjustedHours)} ·{" "}
          {session.distanceMiles != null ? `${session.distanceMiles.toFixed(1)} mi` : "- mi"}
        </p>
      </div>

      <div>
        <p className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs">Walking Path</p>
        {hasRoute && route ? (
          <SessionWalkingPathMap route={route} photoPins={evidence?.photoPins ?? []} />
        ) : (
          <p className="font-body text-[13px] text-text-tertiary">No GPS route recorded.</p>
        )}
      </div>

      <div>
        <p className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs">
          Photos {evidence?.photos.length ? `(${evidence.photos.length})` : ""}
        </p>
        {evidence?.photos.length ? (
          <SessionPhotoGrid photos={evidence.photos} />
        ) : (
          <p className="font-body text-[13px] text-text-tertiary">No photos captured.</p>
        )}
      </div>

      {(session.adminNotes || session.declineReason) && (
        <div>
          <p className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs">Notes</p>
          {session.adminNotes && <p className="font-body text-[13px] text-text-primary">{session.adminNotes}</p>}
          {session.declineReason && (
            <p className="font-body text-[13px] text-[#ba1a1a] mt-xs">Decline reason: {session.declineReason}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function SessionCompareView({
  sessionA,
  sessionB,
  evidenceA,
  evidenceB,
}: {
  sessionA: CompareSession;
  sessionB: CompareSession;
  evidenceA: SessionEvidence | null;
  evidenceB: SessionEvidence | null;
}) {
  const notesMatch =
    sessionA.adminNotes && sessionB.adminNotes && sessionA.adminNotes.trim() === sessionB.adminNotes.trim();

  return (
    <div className="max-w-6xl mx-auto p-xl">
      <Link
        href="/sessions"
        className="font-data text-[12px] text-primary hover:underline mb-lg inline-flex items-center gap-2"
      >
        <ChevronLeftIcon className="w-3.5 h-3.5" color="currentColor" />
        Sessions
      </Link>

      <header className="mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">
          Comparing sessions - {sessionA.volunteerName}
        </h1>
        <p className="mt-xs font-body text-[14px] text-text-tertiary">
          Side by side to spot reused photos, repeated routes, or repeated notes.
        </p>
      </header>

      {notesMatch && (
        <div className="mb-lg px-md py-sm rounded-sm border border-[#ba1a1a]/40 bg-[#ffd9de]/30">
          <p className="font-body text-[13px] text-[#ba1a1a]">
            Both sessions have identical admin notes text - worth a closer look.
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-lg items-start">
        <SessionColumn session={sessionA} evidence={evidenceA} />
        <SessionColumn session={sessionB} evidence={evidenceB} />
      </div>
    </div>
  );
}
