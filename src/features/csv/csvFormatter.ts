import Papa from 'papaparse';

export type Delimiter = ',' | '\t' | '|' | ';' | 'auto';

export interface CsvFormatOptions {
  delimiter: Delimiter;
  hasHeader: boolean;
}

export interface CsvFormatResult {
  output: string;
  error: null;
  detectedDelimiter?: string;
  rowCount: number;
  columnCount: number;
}

export interface CsvFormatError {
  output: null;
  error: string;
  rowCount?: number;
}

export type CsvResult = CsvFormatResult | CsvFormatError;

/**
 * Parse and re-serialize CSV to normalize it.
 * Uses PapaParse for robust delimiter detection and parsing.
 */
export function formatCsv(input: string, options: CsvFormatOptions): CsvResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { output: null, error: 'Input is empty.' };
  }

  const delimiter = options.delimiter === 'auto' ? '' : options.delimiter;

  const parseResult = Papa.parse<string[]>(trimmed, {
    delimiter,
    header: false,
    skipEmptyLines: true,
    // Let PapaParse detect delimiter when empty string
    ...(delimiter === '' ? {} : { delimiter }),
  });

  if (parseResult.errors.length > 0) {
    const firstError = parseResult.errors[0];
    return {
      output: null,
      error: `Parse error on row ${String(firstError?.row ?? '?')}: ${firstError?.message ?? 'Unknown error'}`,
      rowCount: parseResult.data.length,
    };
  }

  const data = parseResult.data;
  if (data.length === 0) {
    return { output: null, error: 'No data rows found.' };
  }

  // Determine column count from the header row (or first row)
  const headerRow = data[0];
  const columnCount = headerRow?.length ?? 0;

  // Validate row consistency
  const inconsistentRows: number[] = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i]?.length !== columnCount) {
      inconsistentRows.push(i + 1); // 1-based
    }
  }

  // Re-serialize — always use comma as normalized output delimiter
  const outputDelimiter = options.delimiter === 'auto' ? ',' : options.delimiter;
  const output = Papa.unparse(data, {
    delimiter: outputDelimiter,
  });

  const detectedDelimiter = (parseResult.meta.delimiter as string | undefined) ?? ',';

  // Include inconsistency warning in output as a comment if present
  if (inconsistentRows.length > 0) {
    const warning = `# Warning: rows with inconsistent column count: ${inconsistentRows.slice(0, 10).join(', ')}${inconsistentRows.length > 10 ? '…' : ''}`;
    return {
      output: `${warning}\n${output}`,
      error: null,
      detectedDelimiter,
      rowCount: data.length,
      columnCount,
    };
  }

  return {
    output,
    error: null,
    detectedDelimiter,
    rowCount: data.length,
    columnCount,
  };
}

/**
 * Validate CSV without reformatting.
 * Returns null on success or an error string.
 */
export function validateCsv(input: string, delimiter: Delimiter = 'auto'): string | null {
  const trimmed = input.trim();
  if (!trimmed) return 'Input is empty.';

  const result = Papa.parse<string[]>(trimmed, {
    delimiter: delimiter === 'auto' ? '' : delimiter,
    header: false,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    const e = result.errors[0];
    return `Parse error on row ${String(e?.row ?? '?')}: ${e?.message ?? 'Unknown error'}`;
  }
  return null;
}

/**
 * Parse CSV to an array of objects (using first row as headers).
 * Used by converters.
 */
export function parseCsvToObjects(
  input: string,
  delimiter: Delimiter = 'auto'
): { data: Record<string, string>[]; error: string | null; fields: string[] } {
  const trimmed = input.trim();
  if (!trimmed) return { data: [], error: 'Input is empty.', fields: [] };

  const result = Papa.parse<Record<string, string>>(trimmed, {
    delimiter: delimiter === 'auto' ? '' : delimiter,
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  if (result.errors.length > 0) {
    const e = result.errors[0];
    return {
      data: [],
      error: `Parse error on row ${String(e?.row ?? '?')}: ${e?.message ?? 'Unknown error'}`,
      fields: result.meta.fields ?? [],
    };
  }

  return {
    data: result.data,
    error: null,
    fields: result.meta.fields ?? [],
  };
}
