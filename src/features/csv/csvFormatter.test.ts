import { describe, it, expect } from 'vitest';
import { formatCsv, validateCsv, parseCsvToObjects } from './csvFormatter';

const OPTS = { delimiter: ',' as const, hasHeader: true };

describe('formatCsv', () => {
  it('parses and re-serializes valid CSV', () => {
    const result = formatCsv('name,age\nAlice,30\nBob,25', OPTS);
    expect(result.error).toBeNull();
    expect(result.output).toContain('name,age');
    expect(result.rowCount).toBe(3); // header + 2 data rows
  });

  it('returns error on empty input', () => {
    const result = formatCsv('  ', OPTS);
    expect(result.output).toBeNull();
    expect(result.error).toBe('Input is empty.');
  });

  it('detects tab delimiter in auto mode', () => {
    const result = formatCsv('a\tb\nc\td', { delimiter: 'auto', hasHeader: true });
    expect(result.error).toBeNull();
    expect(result.detectedDelimiter).toBe('\t');
  });

  it('adds warning comment for inconsistent row lengths', () => {
    const result = formatCsv('a,b,c\n1,2\n3,4,5', OPTS);
    expect(result.output).toContain('Warning');
  });

  it('reports correct column count', () => {
    const result = formatCsv('x,y,z\n1,2,3', OPTS);
    expect(result.columnCount).toBe(3);
  });
});

describe('validateCsv', () => {
  it('returns null for valid CSV', () => {
    expect(validateCsv('a,b\n1,2')).toBeNull();
  });

  it('returns error for empty input', () => {
    expect(validateCsv('')).toBe('Input is empty.');
  });
});

describe('parseCsvToObjects', () => {
  it('parses CSV with header into objects', () => {
    const { data, error, fields } = parseCsvToObjects('name,age\nAlice,30\nBob,25');
    expect(error).toBeNull();
    expect(fields).toEqual(['name', 'age']);
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({ name: 'Alice', age: '30' });
  });

  it('returns error for empty input', () => {
    const { error } = parseCsvToObjects('');
    expect(error).toBeTruthy();
  });
});
