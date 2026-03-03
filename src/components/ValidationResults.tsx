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
          'flex items-center gap-2 rounded-md border border-green-900/60 bg-green-950/30 px-4 py-3',
          className
        )}
        role="status"
      >
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-green-400">Valid</p>
          <p className="text-xs text-green-600">The JSON data conforms to the schema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)} role="alert">
      <div className="flex items-center gap-2 rounded-md border border-red-900/60 bg-red-950/30 px-4 py-2">
        <XCircle className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
        <p className="text-sm font-semibold text-red-400">
          Invalid — {String(result.errors.length)} error{result.errors.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ul className="max-h-48 overflow-auto rounded-md border border-gray-800 bg-gray-950">
        {result.errors.map((err, i) => (
          <li
            key={`${err.path}-${err.keyword}-${String(i)}`}
            className="flex items-start gap-2 border-b border-gray-900 px-3 py-2 last:border-0"
          >
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <span className="font-mono text-xs text-red-400">{err.path || '/'}</span>
              <p className="text-xs text-gray-400">{err.message}</p>
            </div>
            <span className="shrink-0 rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500">
              {err.keyword}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
