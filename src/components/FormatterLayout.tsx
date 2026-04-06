import type { ReactNode } from 'react';
import { SplitPane } from '@/components/SplitPane';
import { CodeEditor, type EditorLanguage } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { FileUploadZone } from '@/components/FileUploadZone';
import { PaneActions } from '@/components/PaneActions';
import { PiiMaskToggle } from '@/components/PiiMaskToggle';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ProgressBar } from '@/components/ProgressBar';
import { usePiiMasking } from '@/hooks/usePiiMasking';
import { type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { Keyboard } from 'lucide-react';

export interface FormatterLayoutProps {
  // ── Identity ───────────────────────────────────────────────────────────
  title: string;
  language: EditorLanguage;

  // ── Input pane ─────────────────────────────────────────────────────────
  input: string;
  onInputChange: (v: string) => void;
  /** FileUploadZone accept string (e.g. ".json,application/json") */
  inputAccept: string;
  onFileUpload: (file: File) => void;
  inputPlaceholder?: string;

  // ── Output pane ────────────────────────────────────────────────────────
  pii: ReturnType<typeof usePiiMasking>;
  downloadFilename: string;
  /** Override output language when it differs from the input language */
  outputLanguage?: EditorLanguage;
  outputPlaceholder?: string;

  // ── Toolbar actions ────────────────────────────────────────────────────
  onFormat: () => void;
  onClear: () => void;
  /** Format button label — default "Format" */
  formatLabel?: string;
  /** Disables Format and Clear buttons */
  hasInput: boolean;

  // ── Status bars ────────────────────────────────────────────────────────
  /** Simple error message string. Routes extract it from structured error objects. */
  error?: string | null;
  errorLine?: number | null;
  errorColumn?: number | null;
  warning?: string | null;

  // ── File parsing progress ──────────────────────────────────────────────
  fileParser: { isParsing: boolean; showProgress: boolean; progress: number };

  // ── Keyboard shortcuts modal ───────────────────────────────────────────
  shortcuts: Shortcut[];
  showShortcuts: boolean;
  onOpenShortcuts: () => void;
  onCloseShortcuts: () => void;

  // ── Slots ──────────────────────────────────────────────────────────────
  /**
   * Formatter-specific toolbar controls placed after the title separator and
   * before the `flex-1` spacer (e.g. indent selects, mode tabs, checkboxes).
   */
  toolbarOptionsSlot?: ReactNode;
  /**
   * Formatter-specific toolbar items placed after the spacer and before the
   * action buttons (e.g. validation badge, Diff/Tree/Markdown toggles).
   */
  toolbarBadgesSlot?: ReactNode;
  /**
   * Extra notice/status bars rendered between the standard error bar and the
   * main pane area (e.g. JSON's curly-quote notice, JSONPath bar, file error).
   */
  noticeSlot?: ReactNode;
  /**
   * When provided, replaces the entire `h-[calc(100vh-260px)]` main area.
   * Use this for the DiffPanel which spans the full width without SplitPane.
   */
  fullPaneSlot?: ReactNode;
  /**
   * When provided, replaces only the right pane inside SplitPane.
   * Use this for TreeView and MarkdownPreview overrides.
   */
  rightPaneSlot?: ReactNode;
  /**
   * SplitPane `rightLabel` used when `rightPaneSlot` is active.
   * Defaults to "Formatted output" when no slot is provided.
   */
  rightPaneLabel?: string;
  /**
   * Extra actions rendered after the FileUploadZone in the input pane header.
   * Use this for formatter-specific controls tied to the input pane (e.g. JSONPath toggle).
   */
  inputActionsSlot?: ReactNode;

  // ── SEO content ────────────────────────────────────────────────────────
  children?: ReactNode;
}

/**
 * Shared layout for all 6 formatter pages.
 *
 * Handles the toolbar chrome, progress bar, error/warning bars, split-pane
 * structure with input editor and output editor, and the keyboard shortcuts
 * modal. Route-specific controls are injected via the slot props.
 */
export function FormatterLayout({
  title,
  language,
  input,
  onInputChange,
  inputAccept,
  onFileUpload,
  inputPlaceholder,
  pii,
  downloadFilename,
  outputLanguage,
  outputPlaceholder,
  onFormat,
  onClear,
  formatLabel = 'Format',
  hasInput,
  error,
  errorLine,
  errorColumn,
  warning,
  fileParser,
  shortcuts,
  showShortcuts,
  onOpenShortcuts,
  onCloseShortcuts,
  toolbarOptionsSlot,
  toolbarBadgesSlot,
  noticeSlot,
  fullPaneSlot,
  rightPaneSlot,
  rightPaneLabel,
  inputActionsSlot,
  children,
}: FormatterLayoutProps) {
  const hasError = !!error;
  const outLanguage = outputLanguage ?? language;
  const rightLabel = rightPaneSlot ? (rightPaneLabel ?? 'Formatted output') : 'Formatted output';

  return (
    <>
      <div className="flex flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
          <h1 className="text-sm font-semibold text-label-indigo">{title}</h1>

          {toolbarOptionsSlot && (
            <>
              <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />
              {toolbarOptionsSlot}
            </>
          )}

          <div className="flex-1" />

          {toolbarBadgesSlot}

          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs"
            onClick={onFormat}
            disabled={!hasInput}
          >
            {formatLabel}
            <kbd className="ml-1 rounded bg-surface-elevated px-1 text-[10px] text-fg-secondary">
              ⌘↵
            </kbd>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-3 text-xs text-fg-secondary"
            onClick={onClear}
            disabled={!hasInput}
          >
            Clear
          </Button>

          <button
            type="button"
            className="rounded p-1 text-fg-secondary hover:bg-surface-elevated hover:text-fg"
            onClick={onOpenShortcuts}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* File parsing progress bar */}
        {fileParser.showProgress && fileParser.isParsing && (
          <ProgressBar percent={fileParser.progress} label="Parsing file…" />
        )}

        {/* Standard error bar */}
        {hasError && (
          <div
            role="alert"
            className="flex items-start gap-2 border-b border-red-900/60 bg-red-950/40 px-4 py-2 text-xs text-red-400"
          >
            <span className="shrink-0 font-mono font-semibold">Error</span>
            <span className="flex-1">{error}</span>
            {errorLine != null && (
              <span className="ml-auto shrink-0 text-red-500/70">
                Line {String(errorLine)}
                {errorColumn != null ? `:${String(errorColumn)}` : ''}
              </span>
            )}
          </div>
        )}

        {/* Standard warning bar */}
        {warning && !hasError && (
          <div
            role="status"
            className="flex items-start gap-2 border-b border-yellow-900/60 bg-yellow-950/30 px-4 py-2 text-xs text-yellow-400"
          >
            <span className="shrink-0 font-mono font-semibold">Warning</span>
            <span className="flex-1">{warning}</span>
          </div>
        )}

        {/* Extra formatter-specific notices (e.g. JSON curly-quote notice, JSONPath bar) */}
        {noticeSlot}

        {/* Main area */}
        <div className="h-[calc(100vh-260px)] min-h-[480px]">
          {fullPaneSlot ?? (
            <SplitPane
              leftLabel={`${language.toUpperCase()} input editor`}
              rightLabel={rightLabel}
              className="h-full"
            >
              {/* Left: input */}
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex items-center justify-between border-b border-edge px-3 py-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
                    Input
                  </span>
                  <div className="flex items-center gap-1">
                    <FileUploadZone
                      accept={inputAccept}
                      onFile={onFileUpload}
                      disabled={fileParser.isParsing}
                    />
                    {inputActionsSlot}
                  </div>
                </div>
                <CodeEditor
                  value={input}
                  onChange={onInputChange}
                  language={language}
                  label={`${language.toUpperCase()} input`}
                  placeholder={inputPlaceholder ?? `Paste or type ${language.toUpperCase()} here…`}
                  className="flex-1 rounded-none border-0"
                  height="100%"
                />
              </div>

              {/* Right: slot override or default output pane */}
              {rightPaneSlot ?? (
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex items-center justify-between border-b border-edge px-3 py-1">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
                      Output
                    </span>
                    <div className="flex items-center gap-1">
                      <PiiMaskToggle pii={pii} />
                      <PaneActions
                        content={pii.displayContent}
                        downloadFilename={downloadFilename}
                      />
                    </div>
                  </div>
                  <CodeEditor
                    value={pii.displayContent}
                    language={outLanguage}
                    label="Formatted output"
                    readOnly
                    placeholder={outputPlaceholder ?? 'Formatted output will appear here…'}
                    className="flex-1 rounded-none border-0"
                    height="100%"
                  />
                </div>
              )}
            </SplitPane>
          )}
        </div>

        <KeyboardShortcutsModal
          shortcuts={shortcuts}
          isOpen={showShortcuts}
          onClose={onCloseShortcuts}
        />
      </div>
      {children}
    </>
  );
}
