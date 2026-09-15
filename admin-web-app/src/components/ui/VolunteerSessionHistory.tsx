"use client";

/**
 * Volunteer profile's Session History table - clicking a row opens the same
 * `SessionPreviewDrawer` used on `/sessions`, instead of linking to a
 * `/sessions/[id]` route that doesn't exist (that dead link 404'd for every
 * court-ordered volunteer reached from the At-Risk Court Dashboard).
 */
import { useState } from "react";
import { StatusChip } from "@/components/ui/StatusChip";
import { SessionPreviewDrawer } from "@/components/ui/SessionPreviewDrawer";
import { formatDate, formatDuration, type MockSession } from "@/lib/mock-data";
import { ILLINOIS_FIPS } from "@/lib/us-heatmap";

type SessionRow = {
  id: string;
  activity: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  adjusted_hours: number | null;
  distance_miles: number | null;
  status: string;
  court_ordered: boolean;
};

function formatMiles(miles: number | null): string {
  if (miles == null) return "-";
  return `${miles.toFixed(1)} mi`;
}

/** Session rows here are a lean profile-page projection - this fills in the rest of
 * `MockSession` with the volunteer's own identity and safe fallbacks. Geo fields are
 * placeholders (unused by the drawer, only relevant to the heatmap elsewhere). */
function toMockSession(row: SessionRow, volunteerId: string, volunteerName: string): MockSession {
  const startedAt = row.started_at ?? new Date().toISOString();
  return {
    id: row.id,
    user_id: volunteerId,
    volunteer_name: volunteerName,
    activity: row.activity,
    status: row.status as MockSession["status"],
    duration_seconds: row.duration_seconds,
    adjusted_hours: row.adjusted_hours,
    court_ordered: row.court_ordered,
    distance_miles: row.distance_miles,
    started_at: startedAt,
    ended_at: row.ended_at ?? startedAt,
    created_at: startedAt,
    state_fips: ILLINOIS_FIPS,
    state_fips_placeholder: true,
  };
}

export function VolunteerSessionHistory({
  volunteerId,
  volunteerName,
  sessions,
}: {
  volunteerId: string;
  volunteerName: string;
  sessions: SessionRow[];
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const selected = previewId ? (sessions.find((s) => s.id === previewId) ?? null) : null;

  return (
    <>
      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto_auto] gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline">
          {["Activity", "Date", "Duration", "Distance", "Status"].map((col) => (
            <span key={col} className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary">
              {col}
            </span>
          ))}
        </div>
        {sessions.length === 0 ? (
          <div className="p-lg text-center">
            <p className="font-body text-[14px] text-text-tertiary">No sessions yet.</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border-outline">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => setPreviewId(session.id)}
                  className="w-full text-left lg:grid lg:grid-cols-[1fr_auto_auto_auto_auto] gap-md items-center px-lg py-md hover:bg-bg-surface-elevated transition-colors"
                >
                  <div className="lg:contents flex flex-col gap-xs">
                    <span className="font-body text-[14px] font-medium text-text-primary hover:text-primary hover:underline">
                      {session.activity ?? "Cleanup session"}
                    </span>
                    <div className="flex flex-wrap items-center gap-md lg:contents">
                      <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap">
                        {formatDate(session.started_at)}
                      </span>
                      <span className="font-data text-[13px] font-medium text-text-primary whitespace-nowrap">
                        {formatDuration(session.duration_seconds, session.adjusted_hours)}
                      </span>
                      <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap">
                        {formatMiles(session.distance_miles)}
                      </span>
                      <StatusChip status={session.status as Parameters<typeof StatusChip>[0]["status"]} />
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SessionPreviewDrawer
        session={selected ? toMockSession(selected, volunteerId, volunteerName) : null}
        open={previewId != null}
        onClose={() => setPreviewId(null)}
      />
    </>
  );
}
