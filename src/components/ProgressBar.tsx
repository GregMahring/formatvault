import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  /** 0–100 */
  percent: number;
  /** Label for screen readers */
  label?: string;
  className?: string;
}

/** Thin progress bar — shown during large-file parsing. */
export function ProgressBar({ percent, label = 'Processing…', className }: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-0.5 w-full overflow-hidden bg-gray-800', className)}
    >
      <div
        className="h-full bg-accent-500 transition-all duration-200 ease-out"
        style={{ width: `${String(percent)}%` }}
      />
    </div>
  );
}
