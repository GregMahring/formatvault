import { format } from 'sql-formatter';

export type SqlDialect =
  | 'sql'
  | 'postgresql'
  | 'mysql'
  | 'transactsql'
  | 'sqlite'
  | 'bigquery'
  | 'snowflake';

export type SqlKeywordCase = 'upper' | 'lower' | 'preserve';

export interface SqlFormatOptions {
  dialect: SqlDialect;
  tabWidth: 2 | 4;
  keywordCase: SqlKeywordCase;
  linesBetweenQueries: 1 | 2;
}

export interface SqlFormatResult {
  output: string;
  error: null;
}

export interface SqlFormatError {
  output: null;
  error: string;
}

export type SqlResult = SqlFormatResult | SqlFormatError;

export const DEFAULT_SQL_OPTIONS: SqlFormatOptions = {
  dialect: 'sql',
  tabWidth: 2,
  keywordCase: 'upper',
  linesBetweenQueries: 1,
};

/**
 * Format SQL using the given options. Returns normalized SQL or an error message.
 */
export function formatSql(
  input: string,
  options: SqlFormatOptions = DEFAULT_SQL_OPTIONS
): SqlResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { output: null, error: 'Input is empty.' };
  }

  try {
    const output = format(trimmed, {
      language: options.dialect,
      tabWidth: options.tabWidth,
      keywordCase: options.keywordCase,
      linesBetweenQueries: options.linesBetweenQueries,
    });
    return { output: output.trimEnd(), error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { output: null, error: msg };
  }
}

/**
 * Validate SQL only. Returns null on success or an error on failure.
 */
export function validateSql(input: string, dialect: SqlDialect = 'sql'): SqlFormatError | null {
  const result = formatSql(input, { ...DEFAULT_SQL_OPTIONS, dialect });
  return result.error !== null ? { output: null, error: result.error } : null;
}
