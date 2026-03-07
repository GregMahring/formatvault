import { Download, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useDownload } from '@/hooks/useDownload';

export interface PaneActionsProps {
  /** The text content of the pane (used for copy and download) */
  content: string;
  /** Filename for the download (e.g. "output.json") */
  downloadFilename: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Copy + Download buttons for an output pane header.
 * Shown as compact icon+text buttons, matching the pane label row style.
 */
export function PaneActions({
  content,
  downloadFilename,
  className,
  disabled = false,
}: PaneActionsProps) {
  const { copy, copied } = useCopyToClipboard();
  const { download } = useDownload();

  const handleCopy = () => {
    if (content) void copy(content);
  };

  const handleDownload = () => {
    if (content) download(content, downloadFilename);
  };

  const empty = !content.trim();

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      <button
        type="button"
        onClick={handleCopy}
        disabled={disabled || empty}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors hover:bg-gray-800 disabled:opacity-30"
        aria-label="Copy to clipboard"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-400" aria-hidden="true" />
        ) : (
          <Copy className="h-3 w-3 text-gray-400" aria-hidden="true" />
        )}
        <span className={cn('text-gray-400', copied && 'text-green-400')}>
          {copied ? 'Copied!' : 'Copy'}
        </span>
      </button>

      <button
        type="button"
        onClick={handleDownload}
        disabled={disabled || empty}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-300 disabled:opacity-30"
        aria-label={`Download as ${downloadFilename}`}
        title={`Download as ${downloadFilename}`}
      >
        <Download className="h-3 w-3" aria-hidden="true" />
        Download
      </button>
    </div>
  );
}
