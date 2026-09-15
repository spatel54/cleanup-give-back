"use client";

/**
 * Volunteer profile's Communication section - every logged email send
 * (`email_log`) plus manual contact notes (`admin_audit_log`, action
 * 'logged contact note'), merged into one chronological list, with a form to
 * log a new manual note via `logManualContactNote`. "Send email" hands off to
 * the Emails tab's Compose flow with this volunteer prefilled as the recipient.
 */
import { useState, useTransition } from "react";
import Link from "next/link";
import { logManualContactNote } from "@/actions/communication";
import type { EmailLogEntry, ContactNoteEntry } from "@/lib/live-data";

const TEMPLATE_LABELS: Record<string, string> = {
  approved: "Session approved",
  declined: "Session declined",
  shipped: "Order tracking",
  order_placed: "Order placed",
  event_registration: "Event registration",
  hours_reminder: "Hours reminder",
  at_risk_nudge: "At-risk nudge (retired)",
  other: "Notification",
};

const STATUS_TONE: Record<string, string> = {
  sent: "bg-bg-app text-text-tertiary",
  delivered: "bg-[#f7fff1] text-[#007536]",
  failed: "bg-[#ffd9de] text-[#ba1a1a]",
  bounced: "bg-[#ffd9de] text-[#ba1a1a]",
  complained: "bg-[#ffd9de] text-[#ba1a1a]",
};

type CommunicationItem =
  | { kind: "email"; id: string; at: string; email: EmailLogEntry }
  | { kind: "note"; id: string; at: string; note: ContactNoteEntry };

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function VolunteerCommunicationLog({
  volunteerId,
  emails,
  notes,
}: {
  volunteerId: string;
  emails: EmailLogEntry[];
  notes: ContactNoteEntry[];
}) {
  const [noteText, setNoteText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const items: CommunicationItem[] = [
    ...emails.map((email) => ({ kind: "email" as const, id: `email-${email.id}`, at: email.sentAt, email })),
    ...notes.map((note) => ({ kind: "note" as const, id: `note-${note.id}`, at: note.performedAt, note })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!noteText.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await logManualContactNote(volunteerId, noteText);
        setNoteText("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to log note");
      }
    });
  }

  return (
    <div className="bg-bg-surface border border-border-outline rounded-md p-lg mb-lg">
      <div className="flex items-center justify-between gap-md mb-md">
        <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary">
          Contact this volunteer
        </p>
        <Link
          href={`/emails?to=${volunteerId}`}
          className="h-9 px-md inline-flex items-center rounded-sm border border-border-outline bg-bg-app font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated transition-colors"
        >
          Send email
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-sm mb-lg">
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Log a contact note - e.g. called the volunteer about missing photos"
          aria-label="Contact note"
          className="flex-1 h-11 px-md rounded-full border border-border-outline bg-bg-app font-body text-[13px] text-text-primary placeholder:text-text-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        />
        <button
          type="submit"
          disabled={isPending || !noteText.trim()}
          className="h-11 px-lg rounded-full bg-primary text-white font-data text-[12px] font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {isPending ? "Logging…" : "Log note"}
        </button>
      </form>
      {error && <p className="font-body text-[13px] text-[#ba1a1a] mb-md">{error}</p>}

      {items.length === 0 ? (
        <p className="font-body text-[13px] text-text-tertiary">No emails or contact notes logged yet.</p>
      ) : (
        <ul className="flex flex-col gap-sm">
          {items.map((item) => (
            <li key={item.id} className="border-b border-border-outline last:border-0 pb-sm last:pb-0">
              {item.kind === "email" ? (
                <div className="flex items-start justify-between gap-md">
                  <div className="min-w-0">
                    <p className="font-body text-[13px] font-medium text-text-primary truncate">
                      {item.email.subject}
                    </p>
                    <p className="font-data text-[11px] text-text-tertiary">
                      {TEMPLATE_LABELS[item.email.templateType] ?? item.email.templateType} · to {item.email.toEmail}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-xs shrink-0">
                    <span className={`font-data text-[10px] font-semibold px-sm py-xs rounded-sm uppercase ${STATUS_TONE[item.email.status] ?? "bg-bg-app text-text-tertiary"}`}>
                      {item.email.status}
                    </span>
                    <span className="font-data text-[11px] text-text-tertiary whitespace-nowrap">
                      {formatTime(item.email.sentAt)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-md">
                  <p className="font-body text-[13px] text-text-primary">{item.note.note}</p>
                  <span className="font-data text-[11px] text-text-tertiary whitespace-nowrap shrink-0">
                    {formatTime(item.note.performedAt)}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
