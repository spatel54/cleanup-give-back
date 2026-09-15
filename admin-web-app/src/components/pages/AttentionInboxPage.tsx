"use client";

/**
 * "Needs attention" - one queue combining every existing review surface
 * (session review, flagged feedback, order issues, failed emails, red-flagged
 * sessions, data-quality alerts). Reactive/live like the Dashboard bento, not a
 * stateful queue - no "acknowledge" persistence yet.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import type { AttentionItem, AttentionItemKind } from "@/lib/attention-inbox";

const KIND_LABELS: Record<AttentionItemKind, string> = {
  session_review: "Session review",
  flagged_feedback: "Flagged feedback",
  order_issue: "Order issue",
  failed_email: "Failed email",
  suspicious_session: "Suspicious session",
  data_quality: "Data quality",
};

const KIND_TONE: Record<AttentionItemKind, string> = {
  session_review: "bg-bg-app text-text-tertiary",
  flagged_feedback: "bg-status-declined-bg text-status-declined-text",
  order_issue: "bg-status-pending-bg text-status-pending-text",
  failed_email: "bg-status-declined-bg text-status-declined-text",
  suspicious_session: "bg-status-declined-bg text-status-declined-text",
  data_quality: "bg-bg-app text-text-tertiary",
};

const KIND_ORDER: AttentionItemKind[] = [
  "session_review",
  "suspicious_session",
  "flagged_feedback",
  "failed_email",
  "order_issue",
  "data_quality",
];

function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function AttentionInboxPage({ items }: { items: AttentionItem[] }) {
  const [kindFilter, setKindFilter] = useState<AttentionItemKind | "all">("all");

  const counts = useMemo(() => {
    const map = new Map<AttentionItemKind, number>();
    for (const item of items) {
      map.set(item.kind, (map.get(item.kind) ?? 0) + 1);
    }
    return map;
  }, [items]);

  const filtered = kindFilter === "all" ? items : items.filter((i) => i.kind === kindFilter);

  return (
    <div className="max-w-5xl mx-auto p-xl">
      <header className="mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Needs attention</h1>
        <p className="mt-xs font-body text-[14px] text-text-tertiary">
          {items.length} item{items.length !== 1 ? "s" : ""} across sessions, feedback, orders, email, and volunteer risk.
        </p>
      </header>

      <div className="flex items-center gap-xs mb-lg flex-wrap" role="group" aria-label="Filter by type">
        <button
          type="button"
          aria-pressed={kindFilter === "all"}
          onClick={() => setKindFilter("all")}
          className={`h-9 inline-flex items-center px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors ${
            kindFilter === "all"
              ? "bg-primary text-white border-primary"
              : "bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary"
          }`}
        >
          All ({items.length})
        </button>
        {KIND_ORDER.filter((kind) => (counts.get(kind) ?? 0) > 0).map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={kindFilter === kind}
            onClick={() => setKindFilter(kindFilter === kind ? "all" : kind)}
            className={`h-9 inline-flex items-center px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors ${
              kindFilter === kind
                ? "bg-primary text-white border-primary"
                : "bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary"
            }`}
          >
            {KIND_LABELS[kind]} ({counts.get(kind)})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-sm">
        {filtered.length === 0 ? (
          <p className="px-lg py-xl text-center font-body text-base text-text-tertiary border border-border-outline rounded-md bg-bg-surface">
            Nothing here - all clear.
          </p>
        ) : (
          filtered.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block bg-bg-surface border border-border-outline rounded-md p-lg hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between gap-md">
                <div className="min-w-0">
                  <div className="flex items-center gap-sm mb-xs">
                    <span className={`font-data text-[10px] font-semibold px-sm py-xs rounded-sm uppercase tracking-[0.6px] ${KIND_TONE[item.kind]}`}>
                      {KIND_LABELS[item.kind]}
                    </span>
                    {formatTime(item.occurredAt) && (
                      <span className="font-data text-[11px] text-text-tertiary">{formatTime(item.occurredAt)}</span>
                    )}
                  </div>
                  <p className="font-body text-[14px] font-semibold text-text-primary truncate">{item.label}</p>
                  {item.detail && (
                    <p className="font-body text-[13px] text-text-tertiary mt-xs line-clamp-2">{item.detail}</p>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
