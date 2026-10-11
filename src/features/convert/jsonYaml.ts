/** JSON ↔ YAML conversions. */

import { parseYaml, serializeToYaml } from '../yaml/yamlFormatter';
import type { YamlIndent } from '../yaml/yamlFormatter';
import type { ConversionResult } from './converters';

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
