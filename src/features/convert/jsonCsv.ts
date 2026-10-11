/** JSON ↔ CSV conversions. */

import Papa from 'papaparse';
import { parseCsvToObjects } from '../csv/csvFormatter';
import type { ConversionResult, CsvOutputDelimiter } from './converters';

// ─── JSON → CSV ────────────────────────────────────────────────────────────

/**
 * Convert JSON (array of objects) to CSV.
 * Warns if the JSON contains nested objects (flattened to [object]).
 */
export function jsonToCsv(input: string, delimiter?: CsvOutputDelimiter): ConversionResult {
  const trimmed = input.trim();
  if (!trimmed) return { output: null, error: 'Input is empty.' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    return {
      output: null,
      error: `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Wrap a single object in an array for convenience
  const arr = Array.isArray(parsed) ? parsed : [parsed];

  if (arr.length === 0) return { output: null, error: 'JSON array is empty.' };

  // Check for nested objects — CSV can't represent them natively
  let hasNested = false;
  for (const row of arr) {
    if (typeof row !== 'object' || row === null) {
      return { output: null, error: 'JSON must be an array of objects to convert to CSV.' };
    }
    for (const val of Object.values(row as Record<string, unknown>)) {
      if (typeof val === 'object' && val !== null) {
        hasNested = true;
        break;
      }
    }
    if (hasNested) break;
  }

  const output = Papa.unparse(arr as object[], {
    ...(delimiter != null ? { delimiter } : {}),
  });

  return {
    output,
    error: null,
    warning: hasNested
      ? 'Nested objects/arrays were converted to their JSON string representation. The CSV output may not be round-trippable back to the original JSON.'
      : undefined,
  };
}

// ─── CSV → JSON ────────────────────────────────────────────────────────────

export function csvToJson(input: string, indent = 2): ConversionResult {
  const { data, error } = parseCsvToObjects(input);
  if (error) return { output: null, error };
  if (data.length === 0) return { output: null, error: 'No data rows found.' };

  try {
    return { output: JSON.stringify(data, null, indent), error: null };
  } catch (err) {
    return {
      output: null,
      error: `Serialization error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
