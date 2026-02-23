import { useState, useCallback } from 'react';
import {
  formatJson,
  minifyJson,
  validateJson,
  type FormatOptions,
  type FormatError,
  type JsonFormatResult,
} from './jsonFormatter';
import { queryJson, formatQueryResults } from './jsonPath';
import { useSettingsStore } from '@/stores/settingsStore';

function isFormatError(r: JsonFormatResult): r is FormatError {
  return r.error !== null;
}

export type JsonMode = 'format' | 'minify' | 'validate';

export interface JsonFormatterState {
  input: string;
  output: string;
  error: FormatError | null;
  /** null = valid, FormatError = invalid */
  validationResult: FormatError | null;
  mode: JsonMode;
  relaxed: boolean;
  sortKeys: boolean;
  jsonPath: string;
  isQueryMode: boolean;
}

export interface JsonFormatterActions {
  setInput: (v: string) => void;
  setMode: (m: JsonMode) => void;
  setRelaxed: (v: boolean) => void;
  setSortKeys: (v: boolean) => void;
  setJsonPath: (v: string) => void;
  setQueryMode: (v: boolean) => void;
  process: () => void;
  runQuery: () => void;
  clear: () => void;
}

export function useJsonFormatter(): JsonFormatterState & JsonFormatterActions {
  const { indentSize } = useSettingsStore();

  const [input, setInputRaw] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<FormatError | null>(null);
  const [validationResult, setValidationResult] = useState<FormatError | null>(null);
  const [mode, setMode] = useState<JsonMode>('format');
  const [relaxed, setRelaxed] = useState(false);
  const [sortKeys, setSortKeys] = useState(false);
  const [jsonPath, setJsonPath] = useState('$');
  const [isQueryMode, setQueryMode] = useState(false);

  const process = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      setValidationResult(null);
      return;
    }

    const opts: FormatOptions = {
      indent: indentSize as 2 | 4 | 8,
      sortKeys,
      relaxed,
    };

    if (mode === 'format') {
      const result = formatJson(input, opts);
      if (isFormatError(result)) {
        setError(result);
        setOutput('');
      } else {
        setError(null);
        setOutput(result.output);
      }
      // Always update validation state
      setValidationResult(validateJson(input, relaxed));
    } else if (mode === 'minify') {
      const result = minifyJson(input, relaxed);
      if (isFormatError(result)) {
        setError(result);
        setOutput('');
      } else {
        setError(null);
        setOutput(result.output);
      }
      setValidationResult(validateJson(input, relaxed));
    } else {
      // validate-only mode
      const validErr = validateJson(input, relaxed);
      setValidationResult(validErr);
      setError(null);
      setOutput(validErr === null ? '✓ Valid JSON' : '');
    }
  }, [input, mode, indentSize, sortKeys, relaxed]);

  const runQuery = useCallback(() => {
    if (!input.trim() || !jsonPath.trim()) return;
    const result = queryJson(input, jsonPath);
    if (result.error !== null) {
      setError({ output: null, error: result.error });
      setOutput('');
    } else {
      setError(null);
      setOutput(formatQueryResults(result.results));
    }
  }, [input, jsonPath]);

  const setInput = useCallback((v: string) => {
    setInputRaw(v);
    // Clear errors on new input
    setError(null);
  }, []);

  const clear = useCallback(() => {
    setInputRaw('');
    setOutput('');
    setError(null);
    setValidationResult(null);
  }, []);

  return {
    input,
    output,
    error,
    validationResult,
    mode,
    relaxed,
    sortKeys,
    jsonPath,
    isQueryMode,
    setInput,
    setMode,
    setRelaxed,
    setSortKeys,
    setJsonPath,
    setQueryMode,
    process,
    runQuery,
    clear,
  };
}
