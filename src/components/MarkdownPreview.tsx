/**
 * In-page Markdown preview panel (ADR-0008: all HTML from marked MUST be sanitized via DOMPurify).
 * Renders as a right-side panel replacing the output pane.
 */
import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useDownload } from '@/hooks/useDownload';
import { Copy, CheckCheck, Download } from 'lucide-react';

export interface MarkdownPreviewProps {
  /** Raw markdown source */
  source: string;
  className?: string;
}

/** Render markdown to sanitized HTML. Never throws — returns empty string on error. */
function renderMarkdown(source: string): string {
  if (!source.trim()) return '';
  try {
    // marked.parse with async:false returns string synchronously
    const raw = marked.parse(source, { async: false });
    // DOMPurify removes any XSS vectors from user-controlled content (ADR-0008)
    return DOMPurify.sanitize(raw, {
      USE_PROFILES: { html: true },
      // Allow common attributes for code blocks, links, images
      ADD_TAGS: ['details', 'summary'],
      ADD_ATTR: ['target', 'rel'],
    });
  } catch {
    return '';
  }
}

export function MarkdownPreview({ source, className }: MarkdownPreviewProps) {
  const { copy, copied } = useCopyToClipboard();
  const { download } = useDownload();

  const html = useMemo(() => renderMarkdown(source), [source]);

  return (
    <div className={`flex h-full flex-col ${className ?? ''}`}>
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
          Markdown Preview
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              void copy(source);
            }}
            disabled={!source.trim()}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-800 hover:text-gray-400 disabled:opacity-40"
            title="Copy markdown source"
          >
            {copied ? (
              <CheckCheck className="h-3 w-3 text-green-400" aria-hidden="true" />
            ) : (
              <Copy className="h-3 w-3" aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy MD'}
          </button>
          <button
            type="button"
            onClick={() => {
              download(source, 'preview.md');
            }}
            disabled={!source.trim()}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-800 hover:text-gray-400 disabled:opacity-40"
            title="Download as .md file"
          >
            <Download className="h-3 w-3" aria-hidden="true" />
            .md
          </button>
        </div>
      </div>

      {/* Rendered preview */}
      <div className="flex-1 overflow-y-auto bg-gray-900">
        {html ? (
          <div
            className="prose prose-invert prose-sm max-w-none px-5 py-4
              prose-headings:text-gray-100
              prose-p:text-gray-300
              prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-code:rounded prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5
              prose-code:text-cyan-300 prose-code:text-xs prose-code:font-mono
              prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700
              prose-blockquote:border-gray-700 prose-blockquote:text-gray-400
              prose-hr:border-gray-800
              prose-strong:text-gray-100
              prose-table:text-xs
              prose-th:text-gray-400 prose-th:border-gray-700
              prose-td:border-gray-800"
            // DOMPurify already sanitized — safe to set as innerHTML (ADR-0008)
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-700">
            {source.trim() ? 'Nothing to preview' : 'No markdown content to preview'}
          </div>
        )}
      </div>
    </div>
  );
}
