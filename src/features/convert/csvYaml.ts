/** CSV ↔ YAML conversions. */

import Papa from 'papaparse';
import { parseCsvToObjects } from '../csv/csvFormatter';
import { parseYaml, serializeToYaml } from '../yaml/yamlFormatter';
import type { YamlIndent } from '../yaml/yamlFormatter';
import type { ConversionResult, CsvOutputDelimiter } from './converters';

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
