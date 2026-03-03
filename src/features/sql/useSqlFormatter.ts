import { useState, useCallback } from 'react';
import {
  formatSql,
  DEFAULT_SQL_OPTIONS,
  type SqlFormatError,
  type SqlFormatOptions,
  type SqlDialect,
  type SqlKeywordCase,
} from './sqlFormatter';

function isSqlError(r: { output: string | null; error: string | null }): r is SqlFormatError {
  return r.error !== null;
}

export interface SqlFormatterState {
  input: string;
  output: string;
  error: SqlFormatError | null;
  dialect: SqlDialect;
  tabWidth: 2 | 4;
  keywordCase: SqlKeywordCase;
  linesBetweenQueries: 1 | 2;
}

export interface SqlFormatterActions {
  setInput: (v: string) => void;
  setDialect: (v: SqlDialect) => void;
  setTabWidth: (v: 2 | 4) => void;
  setKeywordCase: (v: SqlKeywordCase) => void;
  setLinesBetweenQueries: (v: 1 | 2) => void;
  process: () => void;
  clear: () => void;
}

export function useSqlFormatter(): SqlFormatterState & SqlFormatterActions {
  const [input, setInputRaw] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<SqlFormatError | null>(null);
  const [dialect, setDialect] = useState<SqlDialect>(DEFAULT_SQL_OPTIONS.dialect);
  const [tabWidth, setTabWidth] = useState<2 | 4>(DEFAULT_SQL_OPTIONS.tabWidth);
  const [keywordCase, setKeywordCase] = useState<SqlKeywordCase>(DEFAULT_SQL_OPTIONS.keywordCase);
  const [linesBetweenQueries, setLinesBetweenQueries] = useState<1 | 2>(
    DEFAULT_SQL_OPTIONS.linesBetweenQueries
  );

  const process = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const opts: SqlFormatOptions = { dialect, tabWidth, keywordCase, linesBetweenQueries };
    const result = formatSql(input, opts);
    if (isSqlError(result)) {
      setError(result);
      setOutput('');
    } else {
      setError(null);
      setOutput(result.output);
    }
  }, [input, dialect, tabWidth, keywordCase, linesBetweenQueries]);

  const setInput = useCallback((v: string) => {
    setInputRaw(v);
    setError(null);
  }, []);

  const clear = useCallback(() => {
    setInputRaw('');
    setOutput('');
    setError(null);
  }, []);

  return {
    input,
    output,
    error,
    dialect,
    tabWidth,
    keywordCase,
    linesBetweenQueries,
    setInput,
    setDialect,
    setTabWidth,
    setKeywordCase,
    setLinesBetweenQueries,
    process,
    clear,
  };
}
