import { describe, it, expect } from 'vitest';
import { formatSql, validateSql, DEFAULT_SQL_OPTIONS, type SqlFormatOptions } from './sqlFormatter';

describe('formatSql', () => {
  it('formats a simple SELECT', () => {
    const result = formatSql('select id,name from users where active=1');
    expect(result.error).toBeNull();
    expect(result.output).toContain('SELECT');
    expect(result.output).toContain('FROM');
    expect(result.output).toContain('WHERE');
  });

  it('returns error on empty input', () => {
    const result = formatSql('   ');
    expect(result.output).toBeNull();
    expect(result.error).toBe('Input is empty.');
  });

  it('uppercases keywords with keywordCase=upper', () => {
    const result = formatSql('select 1', { ...DEFAULT_SQL_OPTIONS, keywordCase: 'upper' });
    expect(result.output).toContain('SELECT');
  });

  it('lowercases keywords with keywordCase=lower', () => {
    const result = formatSql('SELECT 1', { ...DEFAULT_SQL_OPTIONS, keywordCase: 'lower' });
    expect(result.output).toContain('select');
  });

  it('preserves keyword case with keywordCase=preserve', () => {
    const result = formatSql('Select 1', { ...DEFAULT_SQL_OPTIONS, keywordCase: 'preserve' });
    expect(result.output).toContain('Select');
  });

  it('respects tabWidth=4', () => {
    const opts: SqlFormatOptions = { ...DEFAULT_SQL_OPTIONS, tabWidth: 4 };
    const result = formatSql('SELECT id, name FROM users', opts);
    expect(result.error).toBeNull();
    // 4-space indent means at least 4 spaces in formatted output
    expect(result.output).toMatch(/ {4}/);
  });

  it('formats INSERT statement', () => {
    const result = formatSql("INSERT INTO users (name, age) VALUES ('Alice', 30)");
    expect(result.error).toBeNull();
    expect(result.output).toContain('INSERT');
    expect(result.output).toContain('VALUES');
  });

  it('formats multi-statement SQL', () => {
    const sql = 'SELECT 1; SELECT 2;';
    const result = formatSql(sql);
    expect(result.error).toBeNull();
    expect(result.output).toContain('SELECT');
  });

  it('formats PostgreSQL dialect without error', () => {
    const result = formatSql('SELECT * FROM users LIMIT 10', {
      ...DEFAULT_SQL_OPTIONS,
      dialect: 'postgresql',
    });
    expect(result.error).toBeNull();
  });

  it('formats MySQL dialect without error', () => {
    const result = formatSql('SELECT * FROM users LIMIT 10', {
      ...DEFAULT_SQL_OPTIONS,
      dialect: 'mysql',
    });
    expect(result.error).toBeNull();
  });

  it('formats T-SQL dialect without error', () => {
    const result = formatSql('SELECT TOP 10 * FROM users', {
      ...DEFAULT_SQL_OPTIONS,
      dialect: 'transactsql',
    });
    expect(result.error).toBeNull();
  });

  it('formats SQLite dialect without error', () => {
    const result = formatSql('SELECT * FROM users', {
      ...DEFAULT_SQL_OPTIONS,
      dialect: 'sqlite',
    });
    expect(result.error).toBeNull();
  });

  it('formats BigQuery dialect without error', () => {
    const result = formatSql('SELECT * FROM `project.dataset.table`', {
      ...DEFAULT_SQL_OPTIONS,
      dialect: 'bigquery',
    });
    expect(result.error).toBeNull();
  });

  it('formats Snowflake dialect without error', () => {
    const result = formatSql('SELECT * FROM USERS', {
      ...DEFAULT_SQL_OPTIONS,
      dialect: 'snowflake',
    });
    expect(result.error).toBeNull();
  });

  it('adds blank line between queries with linesBetweenQueries=2', () => {
    const sql = 'SELECT 1; SELECT 2;';
    const result = formatSql(sql, { ...DEFAULT_SQL_OPTIONS, linesBetweenQueries: 2 });
    expect(result.error).toBeNull();
    expect(result.output).toContain('\n\n');
  });
});

describe('validateSql', () => {
  it('returns null for valid SQL', () => {
    expect(validateSql('SELECT 1')).toBeNull();
  });

  it('returns null for empty-ish valid SQL', () => {
    // sql-formatter is lenient — most inputs produce output rather than errors
    const result = validateSql('SELECT id FROM users WHERE id = 1');
    expect(result).toBeNull();
  });

  it('returns error for empty input', () => {
    const err = validateSql('');
    expect(err).not.toBeNull();
    expect(err?.error).toBe('Input is empty.');
  });
});
