/**
 * All 6 conversion pair implementations:
 *   JSON ↔ CSV, JSON ↔ YAML, CSV ↔ YAML
 *
 * Each converter returns { output, error, warning? }.
 * A warning (not an error) is used for lossy conversions (e.g. nested JSON → CSV).
 */

import Papa from 'papaparse';
import { parseCsvToObjects } from '../csv/csvFormatter';
import { parseYaml, serializeToYaml } from '../yaml/yamlFormatter';
import type { YamlIndent } from '../yaml/yamlFormatter';

export interface ConvertResult {
  output: string;
  error: null;
  /** Non-fatal notice about lossy conversion or data changes */
  warning?: string;
}

export interface ConvertError {
  output: null;
  error: string;
}

export type ConversionResult = ConvertResult | ConvertError;

// ─── JSON → CSV ────────────────────────────────────────────────────────────

/**
 * Convert JSON (array of objects) to CSV.
 * Warns if the JSON contains nested objects (flattened to [object]).
 */
export function jsonToCsv(input: string): ConversionResult {
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

  const output = Papa.unparse(arr as object[]);

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

// ─── JSON → YAML ───────────────────────────────────────────────────────────

export function jsonToYaml(input: string, indent: YamlIndent = 2): ConversionResult {
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

  try {
    const output = serializeToYaml(parsed, indent);
    return { output: output.trimEnd(), error: null };
  } catch (err) {
    return {
      output: null,
      error: `YAML serialization error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── YAML → JSON ───────────────────────────────────────────────────────────

export function yamlToJson(input: string, indent = 2): ConversionResult {
  const { value, error } = parseYaml(input);
  if (error) return { output: null, error };

  try {
    return { output: JSON.stringify(value, null, indent), error: null };
  } catch (err) {
    return {
      output: null,
      error: `JSON serialization error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── CSV → YAML ────────────────────────────────────────────────────────────

export function csvToYaml(input: string, indent: YamlIndent = 2): ConversionResult {
  const { data, error } = parseCsvToObjects(input);
  if (error) return { output: null, error };
  if (data.length === 0) return { output: null, error: 'No data rows found.' };

  try {
    const output = serializeToYaml(data, indent);
    return { output: output.trimEnd(), error: null };
  } catch (err) {
    return {
      output: null,
      error: `YAML serialization error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── YAML → CSV ────────────────────────────────────────────────────────────

export function yamlToCsv(input: string): ConversionResult {
  const { value, error } = parseYaml(input);
  if (error) return { output: null, error };

  const arr = Array.isArray(value) ? value : [value];
  if (arr.length === 0) return { output: null, error: 'YAML document is empty.' };

  for (const row of arr) {
    if (typeof row !== 'object' || row === null) {
      return { output: null, error: 'YAML must be a sequence of mappings to convert to CSV.' };
    }
  }

  let hasNested = false;
  for (const row of arr) {
    for (const val of Object.values(row as Record<string, unknown>)) {
      if (typeof val === 'object' && val !== null) {
        hasNested = true;
        break;
      }
    }
    if (hasNested) break;
  }

  const output = Papa.unparse(arr as object[]);

  return {
    output,
    error: null,
    warning: hasNested
      ? 'Nested objects/sequences were converted to their string representation. The CSV output may not be round-trippable.'
      : undefined,
  };
}
