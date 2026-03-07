import { Construction } from 'lucide-react';
import { SplitPane } from '@/components/SplitPane';
import { cn } from '@/lib/utils';

export interface ToolPlaceholderProps {
  title: string;
  description: string;
  inputLabel?: string;
  outputLabel?: string;
  className?: string;
}

/**
 * Phase 1 scaffold for all formatter/converter pages.
 * Renders the real SplitPane layout with placeholder pane content.
 * Swapped out for real editors in Phase 2.
 */
export function ToolPlaceholder({
  title,
  description,
  inputLabel = 'Input',
  outputLabel = 'Output',
  className,
}: ToolPlaceholderProps) {
  const placeholderPane = (label: string) => (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center gap-2 text-fg-muted',
        className
      )}
    >
      <Construction className="h-8 w-8" aria-hidden="true" />
      <p className="text-sm">{label} editor — coming in Phase 2</p>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Tool header bar */}
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-edge bg-surface-raised px-4">
        <h1 className="text-sm font-semibold text-gray-200">{title}</h1>
        <span className="text-xs text-fg-tertiary">{description}</span>
      </div>

      {/* Split pane — occupies remaining height */}
      <div className="min-h-0 flex-1">
        <SplitPane
          left={placeholderPane(inputLabel)}
          right={placeholderPane(outputLabel)}
          leftLabel={inputLabel}
          rightLabel={outputLabel}
        />
      </div>
    </div>
  );
}
