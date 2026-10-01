const encoder = new TextEncoder();

/** Size of `text` as UTF-8 bytes, i.e. what it weighs on the wire or on disk. */
export function utf8ByteLength(text: string): number {
  return encoder.encode(text).length;
}

/**
 * Gzipped size of `text` using the native CompressionStream API.
 * Returns null where CompressionStream is unavailable (older Safari) so callers
 * can omit the figure rather than show a wrong one.
 */
export async function gzipByteLength(text: string): Promise<number | null> {
  if (typeof CompressionStream === 'undefined') return null;
  const body = new Response(text).body;
  if (!body) return null;
  const compressed = await new Response(
    body.pipeThrough(new CompressionStream('gzip'))
  ).arrayBuffer();
  return compressed.byteLength;
}

/** Human-readable size: "512 B", "12.3 KB", "4.06 MB" (1 KB = 1024 B). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}
