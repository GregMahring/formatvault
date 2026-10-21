import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ValidationResult } from '@/features/json/jsonSchema';

export interface ValidationResultsProps {
  result: ValidationResult;
  className?: string;
}

export function ValidationResults({ result, className }: ValidationResultsProps) {
  if (result.valid) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border border-success-fg/30 bg-success-fg/10 px-4 py-3',
          className
        )}
        role="status"
      >
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success-fg" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-success-fg">Valid</p>
          <p className="text-xs text-success-fg">The JSON data conforms to the schema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)} role="alert">
      <div className="flex items-center gap-2 rounded-md border border-danger-fg/30 bg-danger-fg/10 px-4 py-2">
        <XCircle className="h-4 w-4 shrink-0 text-danger-fg" aria-hidden="true" />
        <p className="text-sm font-semibold text-danger-fg">
          Invalid — {String(result.errors.length)} error{result.errors.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ul className="max-h-48 overflow-auto rounded-md border border-edge bg-surface">
        {result.errors.map((err, i) => (
          <li
            key={`${err.path}-${err.keyword}-${String(i)}`}
            className="flex items-start gap-2 border-b border-gray-900 px-3 py-2 last:border-0"
          >
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-danger-fg" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <span className="font-mono text-xs text-danger-fg">{err.path || '/'}</span>
              <p className="text-xs text-fg-secondary">{err.message}</p>
            </div>
            <span className="shrink-0 rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] text-fg-secondary">
              {err.keyword}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
