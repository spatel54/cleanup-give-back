/**
 * Compact emoji distribution for the Feedback metric tile.
 * Bar heights scale with count; empty state shows muted placeholders.
 * Ported verbatim from `admin/components/ui/FeedbackEmojiStrip.tsx`.
 */
import { cn } from "@/lib/utils";

export type FeedbackEmojiCount = {
  key: string;
  emoji: string;
  label: string;
  count: number;
};

export const FEEDBACK_EMOJI_ORDER: FeedbackEmojiCount[] = [
  { key: "excited", emoji: "🤩", label: "Excited", count: 0 },
  { key: "happy", emoji: "😊", label: "Happy", count: 0 },
  { key: "neutral", emoji: "😐", label: "Neutral", count: 0 },
  { key: "sad", emoji: "😔", label: "Sad", count: 0 },
  { key: "very_sad", emoji: "😢", label: "Very Sad", count: 0 },
];

type Props = {
  counts: FeedbackEmojiCount[];
  className?: string;
};

export function FeedbackEmojiStrip({ counts, className = "" }: Props) {
  const max = Math.max(0, ...counts.map((c) => c.count));
  const total = counts.reduce((sum, c) => sum + c.count, 0);

  return (
    <div
      className={cn("flex items-end justify-between gap-0.5 w-full max-w-[7.5rem]", className)}
      role="img"
      aria-label={
        total > 0
          ? counts
              .filter((c) => c.count > 0)
              .map((c) => `${c.label} ${c.count}`)
              .join(", ")
          : "No feedback yet"
      }
    >
      {counts.map((c) => {
        const pct = max > 0 ? c.count / max : 0;
        const barH = total === 0 ? 4 : Math.max(4, Math.round(pct * 22));
        return (
          <div key={c.key} className="flex flex-col items-center gap-0.5 min-w-0 flex-1">
            <span
              className={`text-[13px] leading-none select-none ${
                c.count === 0 ? "opacity-35 grayscale" : ""
              }`}
              aria-hidden
            >
              {c.emoji}
            </span>
            <span
              className="w-full max-w-[12px] rounded-sm bg-primary/80"
              style={{
                height: barH,
                opacity: c.count === 0 ? 0.15 : 0.35 + pct * 0.65,
                backgroundColor: c.count === 0 ? "#c4c0b8" : undefined,
              }}
              aria-hidden
            />
          </div>
        );
      })}
    </div>
  );
}
