import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  className?: string;
  /** Accessible label — shown to screen readers */
  label?: string;
}

export function LoadingSpinner({ className, label = 'Loading…' }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('flex items-center justify-center', className)}
    >
      <div
        className="h-5 w-5 animate-spin rounded-full border-2 border-gray-700 border-t-accent-500"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
