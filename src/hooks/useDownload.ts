import { useCallback } from 'react';

export interface UseDownloadResult {
  download: (content: string, filename: string, mimeType?: string) => void;
}

const MIME_TYPES: Record<string, string> = {
  json: 'application/json',
  csv: 'text/csv',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  txt: 'text/plain',
  md: 'text/markdown',
};

function getMimeType(filename: string, fallback = 'text/plain'): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return MIME_TYPES[ext] ?? fallback;
}

/**
 * Triggers a file download from a string in the browser.
 * Uses a temporary <a> element with an object URL — no server round-trip.
 */
export function useDownload(): UseDownloadResult {
  const download = useCallback((content: string, filename: string, mimeType?: string) => {
    const type = mimeType ?? getMimeType(filename);
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke after a short delay to allow the download to start
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }, []);

  return { download };
}
