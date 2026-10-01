import { formatBytes, type MinifyStats } from '@/lib/byteSize';

export interface MinifyStatsBarProps {
  stats: MinifyStats;
}

/** "−60%" for savings; "+3%" when output grew (e.g. input was already minified). */
function sizeChange(from: number, to: number): string {
  if (from === 0) return '0%';
  const pct = Math.round((1 - to / from) * 100);
  return pct >= 0 ? `−${String(pct)}%` : `+${String(-pct)}%`;
}

function Change({ from, to }: { from: number; to: number }) {
  return (
    <span className={to <= from ? 'text-emerald-400' : 'text-yellow-400'}>
      {sizeChange(from, to)}
    </span>
  );
}

/** Original → minified → gzipped sizes, shown under a minifier's toolbar. */
export function MinifyStatsBar({ stats }: MinifyStatsBarProps) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-edge bg-surface-raised px-4 py-1.5 text-xs text-fg-secondary"
    >
      <span>
        Original <strong className="font-medium text-fg">{formatBytes(stats.originalBytes)}</strong>
      </span>
      <span>
        Minified <strong className="font-medium text-fg">{formatBytes(stats.minifiedBytes)}</strong>{' '}
        <Change from={stats.originalBytes} to={stats.minifiedBytes} />
      </span>
      {/* gzip's fixed ~20-byte overhead makes tiny inputs grow; servers don't
          compress responses that small, so the figure would only mislead. */}
      {stats.gzipBytes !== null && stats.gzipBytes < stats.minifiedBytes && (
        <span>
          Gzipped <strong className="font-medium text-fg">{formatBytes(stats.gzipBytes)}</strong>{' '}
          <Change from={stats.originalBytes} to={stats.gzipBytes} />
        </span>
      )}
    </div>
  );
}
