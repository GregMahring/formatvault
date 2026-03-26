/**
 * All conversion pair implementations:
 *   JSON ↔ CSV, JSON ↔ YAML, CSV ↔ YAML, TOML ↔ JSON, TOML ↔ YAML
 *
 * Each converter returns { output, error, warning? }.
 * A warning (not an error) is used for lossy conversions (e.g. nested JSON → CSV).
 */

import Papa from 'papaparse';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { parseCsvToObjects } from '../csv/csvFormatter';
import { parseYaml, serializeToYaml } from '../yaml/yamlFormatter';
import type { YamlIndent } from '../yaml/yamlFormatter';
import { parseToml, serializeToToml } from '../toml/tomlFormatter';

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

export type CsvOutputDelimiter = ',' | '\t' | '|' | ';';

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

export function yamlToCsv(input: string, delimiter?: CsvOutputDelimiter): ConversionResult {
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

  const output = Papa.unparse(arr as object[], {
    ...(delimiter != null ? { delimiter } : {}),
  });

  return {
    output,
    error: null,
    warning: hasNested
      ? 'Nested objects/sequences were converted to their string representation. The CSV output may not be round-trippable.'
      : undefined,
  };
}

// ─── TOML → JSON ───────────────────────────────────────────────────────────

export function tomlToJson(input: string, indent = 2): ConversionResult {
  const { value, error } = parseToml(input);
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

// ─── JSON → TOML ───────────────────────────────────────────────────────────

export function jsonToToml(input: string): ConversionResult {
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

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      output: null,
      error:
        'TOML root must be a table (object). JSON arrays and scalar values cannot be converted to TOML.',
    };
  }

  try {
    const output = serializeToToml(parsed as Record<string, unknown>);
    return { output: output.trimEnd(), error: null };
  } catch (err) {
    return {
      output: null,
      error: `TOML serialization error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── TOML → YAML ───────────────────────────────────────────────────────────

export function tomlToYaml(input: string, indent: YamlIndent = 2): ConversionResult {
  const { value, error } = parseToml(input);
  if (error) return { output: null, error };

  try {
    const output = serializeToYaml(value, indent);
    return { output: output.trimEnd(), error: null };
  } catch (err) {
    return {
      output: null,
      error: `YAML serialization error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── XML → JSON ────────────────────────────────────────────────────────────

/**
 * Convert XML to a JSON representation.
 * Attributes are prefixed with "@" to distinguish them from child elements.
 * Text content of elements with attributes is stored under "#text".
 */
export function xmlToJson(input: string, indent = 2): ConversionResult {
  const trimmed = input.trim();
  if (!trimmed) return { output: null, error: 'Input is empty.' };

  const validation = XMLValidator.validate(trimmed, { allowBooleanAttributes: true });
  if (validation !== true) {
    return {
      output: null,
      error: `Invalid XML: ${validation.err.msg} (line ${String(validation.err.line)})`,
    };
  }

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
      textNodeName: '#text',
      cdataPropName: '#cdata',
      allowBooleanAttributes: true,
    });
    const parsed: unknown = parser.parse(trimmed);
    return { output: JSON.stringify(parsed, null, indent), error: null };
  } catch (err) {
    return {
      output: null,
      error: `Conversion error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── YAML → TOML ───────────────────────────────────────────────────────────

export function yamlToToml(input: string): ConversionResult {
  const { value, error } = parseYaml(input);
  if (error) return { output: null, error };

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {
      output: null,
      error:
        'TOML root must be a table (object). YAML sequences and scalar values cannot be converted to TOML.',
      // Note: YAML arrays map directly to TOML arrays but only as table values, not roots
    } as ConvertError;
  }

  try {
    const output = serializeToToml(value as Record<string, unknown>);
    return { output: output.trimEnd(), error: null };
  } catch (err) {
    return {
      output: null,
      error: `TOML serialization error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
