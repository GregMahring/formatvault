import { useEffect, useCallback } from 'react';
import { usePreloadedInput } from './usePreloadedInput';
import { usePiiMasking } from './usePiiMasking';
import { useKeyboardShortcuts, type Shortcut } from './useKeyboardShortcuts';
import { useRegisterCommands } from './useRegisterCommands';
import type { Command } from '@/stores/commandStore';
import type { UseFileParserState, UseFileParserActions } from './useFileParser';
import type { ParseFormat } from '@/workers/fileParser.worker';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormatterFmt {
  input: string;
  output: string;
  setInput: (v: string) => void;
  process: () => void;
}

export interface UseFormatterPageOptions {
  fmt: FormatterFmt;
  fileParser: UseFileParserState & UseFileParserActions;
  /**
   * Format passed to fileParser.parseFile. Use 'text' for formatters that
   * want raw file content (SQL, XML, TOML).
   */
  fileType: ParseFormat | 'text';
  shortcuts: Shortcut[];
  commands: Command[];
  showShortcuts: boolean;
  /**
   * Concatenated string of formatter-specific options (e.g. `${indent}|${style}`).
   * When this string changes, the 400ms debounce fires fmt.process().
   * Omit or pass '' when only fmt.input should trigger re-processing.
   */
  optionsDepsKey?: string;
  /**
   * When true, the debounce effect is skipped for that render cycle.
   * Used by JSON formatter to suppress auto-processing in query mode.
   */
  skipAutoProcess?: boolean;
  /**
   * When true, clears fmt.input if fileParser.result contains an error.
   * JSON uses this to surface file errors through the formatter error state.
   */
  clearInputOnFileError?: boolean;
}

export interface UseFormatterPageResult {
  pii: ReturnType<typeof usePiiMasking>;
  handleFileUpload: (file: File) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFormatterPage({
  fmt,
  fileParser,
  fileType,
  shortcuts,
  commands,
  showShortcuts,
  optionsDepsKey = '',
  skipAutoProcess = false,
  clearInputOnFileError = false,
}: UseFormatterPageOptions): UseFormatterPageResult {
  usePreloadedInput(fmt.setInput);

  // Auto-process on input or option changes with 400ms debounce.
  // skipAutoProcess is read inside the effect body (not in deps) intentionally —
  // matching the pattern in individual formatter routes.
  useEffect(() => {
    if (!fmt.input.trim()) return;
    if (skipAutoProcess) return;
    const timer = setTimeout(() => {
      fmt.process();
    }, 400);
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fmt.input, optionsDepsKey]);

  // Seed input from file parser result
  useEffect(() => {
    if (fileParser.result?.output) {
      fmt.setInput(fileParser.result.output);
    } else if (clearInputOnFileError && fileParser.result?.error) {
      fmt.setInput('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileParser.result]);

  const handleFileUpload = useCallback(
    (file: File) => {
      fileParser.parseFile(file, fileType as ParseFormat);
    },
    [fileParser, fileType]
  );

  useKeyboardShortcuts(shortcuts, !showShortcuts);
  useRegisterCommands(commands);

  const pii = usePiiMasking(fmt.output);

  return { pii, handleFileUpload };
}
