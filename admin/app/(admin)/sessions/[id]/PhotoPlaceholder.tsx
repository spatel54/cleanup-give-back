import { CameraIcon } from '@/components/ui/Icons';

const LABELS = ['Selfie', 'Progress', 'Selfie', 'Progress'];

/** Placeholder tiles shown wherever real checkpoint photos aren't available yet. */
export function PhotoPlaceholder({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="aspect-square rounded-sm border border-dashed border-border-outline bg-bg-surface-elevated flex flex-col items-center justify-center gap-xs"
        >
          <CameraIcon className="w-[26px] h-[26px] text-text-tertiary" aria-hidden />
          <span className="font-data text-[10px] uppercase tracking-[0.5px] text-text-tertiary">
            {LABELS[i % LABELS.length]}
          </span>
        </div>
      ))}
    </div>
  );
}
